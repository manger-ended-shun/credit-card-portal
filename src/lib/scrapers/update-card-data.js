const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws'); 

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Verify API Keys (Using GitHub Models for OpenAI GPT-4o)
const GITHUB_TOKEN = process.env.GH_MODELS_TOKEN || process.env.GITHUB_TOKEN;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GITHUB_TOKEN || !SUPABASE_URL || !SUPABASE_KEY || !TAVILY_API_KEY) {
  console.error("🚨 FATAL ERROR: Missing environment variables. Ensure GH_MODELS_TOKEN, TAVILY, and SUPABASE keys are set.");
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  SUPABASE_URL, 
  SUPABASE_KEY,
  { realtime: { transport: WebSocket } }
);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// UTILITY: SAFE JSON PARSER
// ==========================================
function parseSafeJSON(rawStr) {
  try {
    let clean = rawStr.trim();
    if (clean.startsWith('```json')) clean = clean.substring(7);
    if (clean.startsWith('```')) clean = clean.substring(3);
    if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
    return JSON.parse(clean.trim());
  } catch (e) {
    console.error("🚨 JSON Parse Error:", e.message);
    console.error("Raw string was:", rawStr.substring(0, 200) + "...");
    return null;
  }
}

// ==========================================
// RAG SEARCH AGENT
// ==========================================
async function searchLiveWeb(bankName, cardName) {
  console.log(`🔍 Searching live web for current data: ${cardName}...`);
  try {
    const response = await fetch('[https://api.tavily.com/search](https://api.tavily.com/search)', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${bankName} ${cardName} credit card annual fee, domestic international lounge access limit, golf rounds, minimum income requirement, full exhaustive list of airline hotel transfer partners and exact conversion ratios India`,
        search_depth: "basic",
        include_answer: false,
        max_results: 6
      })
    });
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) return "No live data found.";
    
    return data.results.map(r => r.content).join("\n\n");
  } catch (e) {
    console.error(`⚠️ Web search failed for ${cardName}, falling back to AI memory.`, e.message);
    return "No live data available. Rely on internal training data.";
  }
}

// ==========================================
// SCOUT PHASE 1: ACTIVE BANKS
// ==========================================
async function getActiveBanks() {
  console.log(`\n🏦 AI is scouting for all active credit card issuers in India...`);
  try {
    const response = await fetch('[https://models.inference.ai.azure.com/chat/completions](https://models.inference.ai.azure.com/chat/completions)', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a master financial directory AI for the Indian credit card ecosystem." 
          },
          { 
            role: "user", 
            content: `List all major active consumer credit card issuing banks and financial institutions in India right now. 
            Include private banks, public sector banks, foreign banks, and small finance banks (e.g., HDFC Bank, SBI Card, Axis Bank, ICICI Bank, American Express, IDFC First Bank, AU Small Finance, etc.).
            Output ONLY a valid JSON object with a single key "banks" containing an array of strings.` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });
    
    // 🟢 FIX: Catch 429 Rate Limits and Auto-Retry
    if (response.status === 429) {
      console.warn(`⏳ Rate limit hit during Bank Scout. Sleeping for 60 seconds...`);
      await sleep(60000);
      return getActiveBanks();
    }

    const data = await response.json();
    if (!response.ok) {
      console.error(`🚨 Bank Scout API Error (${response.status}):`, JSON.stringify(data));
      return [];
    }
    
    const rawContent = data.choices[0].message.content;
    const parsed = parseSafeJSON(rawContent);
    return parsed ? parsed.banks || [] : [];

  } catch (e) {
    console.error(`⚠️ Error scouting banks:`, e.message);
    return [];
  }
}

// ==========================================
// SCOUT PHASE 2: CARDS PER BANK
// ==========================================
async function getCardsForBank(bankName) {
  console.log(`\n🕵️ Scouting active cards for: ${bankName}...`);
  try {
    const response = await fetch('[https://models.inference.ai.azure.com/chat/completions](https://models.inference.ai.azure.com/chat/completions)', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a master financial directory AI for the Indian credit card ecosystem." 
          },
          { 
            role: "user", 
            content: `List all active, currently issued consumer credit cards offered by ${bankName} in India. Exclude closed/deprecated cards, commercial cards, and debit cards. 
            CRITICAL: Ensure you explicitly list popular specific premium variants (e.g., "HDFC Bank Regalia Gold Credit Card", "HDFC Bank Infinia Metal Edition").
            Output ONLY a valid JSON object with a single key "cards" containing an array of strings.` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });
    
    // 🟢 FIX: Catch 429 Rate Limits and Auto-Retry
    if (response.status === 429) {
      console.warn(`⏳ Rate limit hit scouting cards for ${bankName}. Sleeping for 60 seconds...`);
      await sleep(60000);
      return getCardsForBank(bankName);
    }

    const data = await response.json();
    if (!response.ok) {
      console.error(`🚨 GitHub Models API Error (${response.status}):`, JSON.stringify(data));
      return [];
    }
    
    const rawContent = data.choices[0].message.content;
    const parsed = parseSafeJSON(rawContent);
    return parsed ? parsed.cards || [] : [];

  } catch (e) {
    console.error(`⚠️ Error scouting cards for ${bankName}:`, e.message);
    return [];
  }
}

// ==========================================
// DEEP DIVE PHASE
// ==========================================
async function extractCardDetails(bankName, cardName, liveContext) {
  console.log(`📄 Deep Dive Extraction (GPT-4o Grounded): ${cardName}`);
  
  const masterPrompt = `
You are the Master Financial Research & Data Extraction Engine specializing in the Indian credit card ecosystem. 
Your objective is to extract comprehensive data for the following card: ${cardName} issued by ${bankName}.

CRITICAL INSTRUCTION - LIVE WEB CONTEXT:
Below is live, real-time search engine data for this exact card. 
---
${liveContext}
---

Extraction Rules (Strict Compliance Required):
1. THE THOUGHT PROCESS (MANDATORY): You MUST start your JSON with a "_thought_process" key. In this string, you must:
   - Identify the base annual fee.
   - Actively search the text for lounge access counts, golf limits, and minimum monthly income.
   - Identify the EXHAUSTIVE list of individual transfer partners.
2. Transfer Partners (NO SUMMARIZING): In the "transfer_partners" field, DO NOT write "16 airline partners". You MUST extract and list EVERY specific airline and hotel name found in the text along with its exact transfer ratio.
3. Currency & Numbers Handling: All fee, income, and limit fields must be raw integers.
4. Schema Integrity & SQL Limits: "airline_transfer_ratio", "hotel_transfer_ratio", and "reward_program_name" MUST BE STRICTLY UNDER 50 CHARACTERS. Output ONLY the exact keys listed below.
5. Arrays: "partner_airlines" and "excluded_mcc" must strictly be flat arrays of strings.

Output ONLY a valid JSON object matching this exact schema:
{
  "_thought_process": "string",
  "bank_name": "${bankName}",
  "card_name": "${cardName}",
  "card_type": "string or null",
  "card_network": "string or null",
  "card_tier": "string or null",
  "annual_fee": "number or null",
  "joining_fee": "number or null",
  "annual_fee_waiver_conditions": "string or null",
  "forex_markup": "number or null",
  "reward_type": "string or null",
  "reward_program_name": "string or null",
  "base_reward_rate": "number or null",
  "base_reward_unit": "string or null",
  "category_rewards": "object or null",
  "point_value_paise": "number or null",
  "miles_value_paise": "number or null",
  "welcome_bonus_points": "number or null",
  "welcome_bonus_miles": "number or null",
  "welcome_bonus_cashback": "number or null",
  "welcome_spend_requirement": "number or null",
  "welcome_spend_period_days": "number or null",
  "welcome_offer_end_date": "string (YYYY-MM-DD) or null",
  "domestic_lounge_access": "number or null",
  "international_lounge_access": "number or null",
  "lounge_program": "string or null",
  "air_miles_earning": true or false,
  "miles_conversion_ratio": "number or null",
  "partner_airlines": "array of strings or null",
  "fuel_surcharge_waiver": true or false,
  "fuel_surcharge_limit": "number or null",
  "air_accident_insurance": "number or null",
  "lost_card_liability": "number or null",
  "purchase_protection": "number or null",
  "travel_insurance": "number or null",
  "concierge_service": true or false,
  "golf_access": "number or null",
  "movie_benefits": "string or null",
  "dining_discounts": "string or null",
  "min_income_monthly": "number or null",
  "min_credit_score": "number or null",
  "age_min": "number or null",
  "age_max": "number or null",
  "is_active": true,
  "is_popular": true or false,
  "earn_base_rate": "string or null",
  "earn_accelerated": "string or null",
  "earn_exclusions": "string or null",
  "points_per_100": "string or null",
  "transfer_partners": "string or null",
  "best_use": "string or null",
  "worst_use": "string or null",
  "reward_cap_monthly": "number or null",
  "reward_cap_annual": "number or null",
  "excluded_mcc": "array of strings or null",
  "spend_based_lounge": true or false,
  "quarterly_spend_requirement": "number or null",
  "upi_enabled": true or false,
  "metal_card": true or false,
  "statement_redemption_ratio": "number or null",
  "airline_transfer_ratio": "string or null",
  "hotel_transfer_ratio": "string or null",
  "reward_expiry_months": "number or null",
  "accelerated_reward_multiplier": "number or null",
  "international_acceptance_score": "number or null",
  "card_launch_year": "number or null"
}
`;

  try {
    const response = await fetch('[https://models.inference.ai.azure.com/chat/completions](https://models.inference.ai.azure.com/chat/completions)', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: masterPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });
    
    // 🟢 FIX: Catch 429 Rate Limits and Auto-Retry
    if (response.status === 429) {
      console.warn(`⏳ Rate limit hit extracting ${cardName}. Sleeping for 60 seconds...`);
      await sleep(60000);
      return extractCardDetails(bankName, cardName, liveContext);
    }

    const data = await response.json();
    if (!response.ok) {
      console.error(`🚨 Deep Dive API Error (${response.status}):`, JSON.stringify(data));
      return null;
    }

    return parseSafeJSON(data.choices[0].message.content);

  } catch (e) {
    console.error(`⚠️ Error extracting details for ${cardName}:`, e.message);
    return null;
  }
}

// ==========================================
// ORCHESTRATION PIPELINE
// ==========================================
async function main() {
  const targetBanks = await getActiveBanks();
  
  if (targetBanks.length === 0) {
    console.error("🚨 AI failed to identify any banks. Aborting pipeline.");
    process.exit(1);
  }
  
  console.log(`🏦 AI identified ${targetBanks.length} card issuers to process:`, targetBanks.join(', '));

  for (const bank of targetBanks) {
    const cards = await getCardsForBank(bank);
    console.log(`✅ Found ${cards.length} cards for ${bank}.`);

    if (cards.length === 0) {
      await sleep(10000); // Small buffer before hitting the next bank
      continue;
    }

    for (const cardName of cards) {
      const liveContext = await searchLiveWeb(bank, cardName);
      let cardDetails = await extractCardDetails(bank, cardName, liveContext);
      
      if (cardDetails) {
        if (cardDetails._thought_process) {
          console.log(`🧠 AI Reasoning for ${cardName}: ${cardDetails._thought_process.substring(0, 150)}...`);
          delete cardDetails._thought_process;
        }

        const { error } = await supabase
          .from('cards')
          .upsert({ 
            ...cardDetails, 
            last_updated: new Date().toISOString() 
          }, { 
            onConflict: 'card_name' 
          });

        if (error) {
          console.error(`⚠️ Supabase Upsert Error for ${cardName}:`, error.message);
        } else {
          console.log(`💾 Successfully synced ${cardName} to database.`);
        }
      }
      
      console.log('⏳ Pausing for 15 seconds to respect standard rate limits...');
      await sleep(15000); 
    }
  }
  
  console.log('\n🎉 AI Data Pipeline Complete!');
  process.exit(0);
}

main();