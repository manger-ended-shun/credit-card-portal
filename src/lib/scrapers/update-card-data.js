const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws'); 
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("🚨 FATAL ERROR: GROQ_API_KEY is completely missing. The script cannot authenticate with the AI.");
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: WebSocket } }
);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getCardsForBank(bankName) {
  console.log(`\n🕵️ Scouting active cards for: ${bankName}...`);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // 🟢 UPDATED MODEL HERE
        messages: [{
          role: "system",
          content: `You are a financial directory. List all active, currently issued consumer credit cards offered by ${bankName} in India as of May 2026. Exclude closed/deprecated cards, commercial cards, and debit cards. 
          Output ONLY a valid JSON object with a single key "cards" containing an array of strings. 
          Example: {"cards": ["Card Name 1", "Card Name 2"]}`
        }],
        response_format: { type: "json_object" }
      })
    });
    
    const data = await response.json();

    if (!response.ok) {
      console.error(`🚨 Groq API Error (${response.status}):`, JSON.stringify(data));
      return [];
    }

    const parsed = JSON.parse(data.choices[0].message.content);
    return parsed.cards || [];
  } catch (e) {
    console.error(`❌ Failed to scout cards for ${bankName}:`, e.message);
    return [];
  }
}

async function extractCardDetails(bankName, cardName) {
  console.log(`📄 Deep Dive Extraction: ${cardName}`);
  
  const masterPrompt = `
You are the Master Financial Research & Data Extraction Engine specializing in the major banking tiers of the Indian credit card ecosystem. 
Your objective is to extract the exact data for the following specific credit card: ${cardName} issued by ${bankName}.

Extraction Rules (Strict Compliance Required):
1. No Hallucinations: Use your training data as of May 2026. If a specific data point is unknown or unverified, explicitly return null. Do not guess.
2. Currency Handling: All fee/limit fields must be raw integers in INR (e.g., 12000). value_paise fields must be the actual value in Paise (e.g., 100 paise = 1 Rupee).
3. String Arrays: "excluded_mcc" must be a flat array of 4-digit string Merchant Category Codes (e.g., ["4900", "6513"]).
4. Category Rewards: "category_rewards" must be a clean JSON object (e.g., {"Dining": 6.66, "Travel": 10.00}).
5. Transfer Partners: "partner_airlines" and "transfer_partners" must explicitly list airlines/hotels and exact ratios (e.g., "Club Vistara (1:1)").

Output the complete comprehensive dataset in ONE single, complete JSON object containing all the fields requested in the schema. Output ONLY the valid JSON object. Do not wrap the JSON in markdown code blocks.

Schema mapping:
{
  "id": "${crypto.randomUUID()}",
  "bank_name": "${bankName}",
  "card_name": "${cardName}",
  "card_type": "string",
  "card_network": "string",
  "card_tier": "string",
  "annual_fee": "number or null",
  "annual_fee_waiver_conditions": "string or null",
  "forex_markup": "number or null",
  "reward_type": "string",
  "base_reward_rate": "string or null",
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
  "metal_card": "boolean"
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // 🟢 UPDATED MODEL HERE
        messages: [{ role: "user", content: masterPrompt }],
        response_format: { type: "json_object" }
      })
    });
    
    const data = await response.json();

    if (!response.ok) {
      console.error(`🚨 Groq API Error (${response.status}):`, JSON.stringify(data));
      return null;
    }

    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error(`❌ Failed to extract details for ${cardName}:`, e.message);
    return null;
  }
}

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
      const cardDetails = await extractCardDetails(bank, cardName);
      
      if (cardDetails) {
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