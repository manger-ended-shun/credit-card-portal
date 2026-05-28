const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws'); 

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Verify API Keys
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GROQ_API_KEY || !SUPABASE_URL || !SUPABASE_KEY || !TAVILY_API_KEY) {
  console.error("🚨 FATAL ERROR: Missing environment variables. Ensure GROQ, TAVILY, and SUPABASE keys are set.");
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
// RAG SEARCH AGENT
// ==========================================
async function searchLiveWeb(bankName, cardName) {
  console.log(`🔍 Searching live web for current data: ${cardName}...`);
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${bankName} ${cardName} credit card annual fee exact amount, SmartBuy airline hotel transfer partners conversion ratios India`,
        search_depth: "basic",
        include_answer: false,
        max_results: 4
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
// SCOUT PHASE
// ==========================================
async function getCardsForBank(bankName) {
  console.log(`\n🕵️ Scouting active cards for: ${bankName}...`);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "system",
          content: `You are a financial directory. List all active, currently issued consumer credit cards offered by ${bankName} in India as of May 2026. Exclude closed/deprecated cards, commercial cards, and debit cards. 
          CRITICAL: Ensure you explicitly list popular specific premium variants (e.g., "HDFC Bank Regalia Gold Credit Card", "HDFC Bank Infinia Metal Edition").
          Output ONLY a valid JSON object with a single key "cards" containing an array of strings.`
        }],
        response_format: { type: "json_object" }
      })
    });
    
    const data = await response.json();
    if (!response.ok) return [];
    
    return JSON.parse(data.choices[0].message.content).cards || [];
  } catch (e) {
    return [];
  }
}

// ==========================================
// DEEP DIVE PHASE (Grounded with Live Data)
// ==========================================
async function extractCardDetails(bankName, cardName, liveContext) {
  console.log(`📄 Deep Dive Extraction (Grounded): ${cardName}`);
  
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
   - Explicitly identify the base annual fee for EXACTLY the ${cardName}. Do NOT use the 10,000 fee from Diners Black or Infinia. Do not confuse 10,000 milestone bonus points with the fee (e.g. Regalia and Regalia Gold typically have a base fee of 2500).
   - Search the text for transfer partners (e.g., Singapore Airlines KrisFlyer, Air France/KLM, Marriott) and note their ratios (like 2:1 or 100:50). HDFC SmartBuy has many partners for Regalia variants!
2. Currency & Numbers Handling: All fee and limit fields must be raw integers in INR (e.g., 2500). 
3. Transfer Partners & SQL Length Limits: "airline_transfer_ratio", "hotel_transfer_ratio", and "reward_program_name" MUST BE STRICTLY UNDER 50 CHARACTERS. (e.g., output "2:1" or "100 RP = 50 Miles"). Put the full descriptive list of airlines/hotels in the "transfer_partners" field.
4. Schema Integrity (FATAL): Output ONLY the exact keys listed in the schema below.
5. Arrays: "partner_airlines" and "excluded_mcc" must strictly be flat arrays of strings. 

Output ONLY a valid JSON object matching this exact schema:
{
  "_thought_process": "string (Your step-by-step reasoning for finding the exact annual fee and transfer partners for this specific card before you output the numbers)",
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
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: masterPrompt }],
        response_format: { type: "json_object" }
      })
    });
    
    const data = await response.json();
    if (!response.ok) return null;

    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    return null;
  }
}

// ==========================================
// ORCHESTRATION PIPELINE
// ==========================================
async function main() {
  const targetBanks = [
    "HDFC Bank",
    "SBI Card",
    "HSBC India"
  ];

  for (const bank of targetBanks) {
    const cards = await getCardsForBank(bank);
    console.log(`✅ Found ${cards.length} cards for ${bank}.`);

    if (cards.length === 0) continue;

    for (const cardName of cards) {
      const liveContext = await searchLiveWeb(bank, cardName);
      let cardDetails = await extractCardDetails(bank, cardName, liveContext);
      
      if (cardDetails) {
        
        // 🟢 FIX: The AI uses this key to think, but we must delete it before saving 
        // to prevent a Supabase schema crash!
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
      
      console.log('⏳ Pausing for 15 seconds to respect rate limits...');
      await sleep(15000); 
    }
  }
  
  console.log('\n🎉 AI Data Pipeline Complete!');
  process.exit(0);
}

main();