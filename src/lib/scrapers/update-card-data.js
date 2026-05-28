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
        query: `${bankName} ${cardName} annual fee, joining fee, and reward points limit officially`,
        search_depth: "basic",
        include_answer: false,
        max_results: 3
      })
    });
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) return "No live data found.";
    
    // Combine the snippets from the top 3 search results into a single string
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
Your objective is to extract data for the following card: ${cardName} issued by ${bankName}.

CRITICAL INSTRUCTION - LIVE WEB CONTEXT:
Below is live, real-time search engine data for this exact card. You MUST prioritize these facts over your internal memory, especially for numerical values like the annual fee.
---
${liveContext}
---

Extraction Rules (Strict Compliance Required):
1. Currency & Numbers Handling: All fee/limit fields must be raw integers in INR (e.g., 4999). 
   - "base_reward_rate" MUST be a raw floating-point number representing the effective base return percentage.
   - "value_paise" fields must be the actual value in Paise (e.g., 100 paise = 1 Rupee).
2. Category Rewards: "category_rewards" must be a clean JSON object containing accelerated categories and return rates.
3. Narrative Fields: Put human-readable descriptive text breakdown of base reward rules inside the "earn_base_rate" field.

Output ONLY a valid JSON object matching this exact schema:
{
  "bank_name": "${bankName}",
  "card_name": "${cardName}",
  "card_type": "string",
  "card_network": "string",
  "card_tier": "string",
  "annual_fee": "number or null",
  "annual_fee_waiver_conditions": "string or null",
  "forex_markup": "number or null",
  "reward_type": "string",
  "base_reward_rate": "number or null",
  "base_reward_unit": "string",
  "category_rewards": "object or null",
  "point_value_paise": "number or null",
  "welcome_bonus_points": "number or null",
  "welcome_spend_requirement": "number or null",
  "domestic_lounge_access": "number or null",
  "international_lounge_access": "number or null",
  "lounge_program": "string or null",
  "air_miles_earning": "boolean",
  "transfer_partners": "string or null",
  "fuel_surcharge_waiver": "boolean",
  "fuel_surcharge_limit": "number or null",
  "min_income_monthly": "number or null",
  "is_active": true,
  "best_use": "string or null",
  "excluded_mcc": "array of strings or null",
  "metal_card": "boolean",
  "earn_base_rate": "string or null"
}`;

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
    "SBI Card"
  ];

  for (const bank of targetBanks) {
    const cards = await getCardsForBank(bank);
    console.log(`✅ Found ${cards.length} cards for ${bank}.`);

    if (cards.length === 0) continue;

    for (const cardName of cards) {
      // 1. Get Live Web Truth
      const liveContext = await searchLiveWeb(bank, cardName);
      
      // 2. Feed Truth to AI
      const cardDetails = await extractCardDetails(bank, cardName, liveContext);
      
      if (cardDetails) {
        // 3. Save to DB
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