const dotenv = require('dotenv');
const path = require('path');
const WebSocket = require('ws'); 
const { z } = require('zod'); // 👈 Imported Zod

// Splitting strings so your editor cannot auto-format them into markdown links!
const AI_URL = 'https://' + 'models.inference.ai.azure.com' + '/chat/completions';
const TAVILY_URL = 'https://' + 'api.tavily.com' + '/search';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Verify API Keys
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
    return null;
  }
}

// ==========================================
// 1. 🛡️ THE BOUNCER: Strict AI Schema Validation
// ==========================================
// ==========================================
// 1. 🛡️ THE BOUNCER: Absolute Firewall (No Passthrough)
// ==========================================
const cleanNumeric = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return null;
  // Keeps numbers and decimals. Strips %, ₹, Rs, and spaces.
  const cleaned = val.replace(/[^0-9.]/g, ''); 
  return cleaned === '' ? null : parseFloat(cleaned);
};

const CardSchema = z.object({
  _thought_process: z.string().optional(),
  bank_name: z.string(),
  card_name: z.string(),
  
  // -- ALL POTENTIAL NUMERIC FIELDS (Scrubbed) --
  annual_fee: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  joining_fee: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  forex_markup: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  base_reward_rate: z.preprocess(cleanNumeric, z.number().nullable().catch(null)), // Caught the 3.33% culprit!
  points_per_100: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  statement_redemption_ratio: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  reward_cap_monthly: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  reward_cap_annual: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  reward_expiry_months: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  domestic_lounge_access: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  international_lounge_access: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  air_accident_insurance: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  lost_card_liability: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  travel_insurance: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  golf_access: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  min_income_monthly: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  min_credit_score: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  age_min: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  age_max: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  card_launch_year: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  welcome_bonus_points: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  welcome_bonus_miles: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  welcome_bonus_cashback: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  welcome_spend_requirement: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  welcome_spend_period_days: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  quarterly_spend_requirement: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  miles_conversion_ratio: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  fuel_surcharge_limit: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  purchase_protection: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),
  accelerated_reward_multiplier: z.preprocess(cleanNumeric, z.number().nullable().catch(null)),

  // -- BOOLEANS --
  spend_based_lounge: z.boolean().nullable().catch(null),
  concierge_service: z.boolean().nullable().catch(null),
  is_popular: z.boolean().nullable().catch(null),
  metal_card: z.boolean().nullable().catch(null),
  upi_enabled: z.boolean().nullable().catch(null),
  air_miles_earning: z.boolean().nullable().catch(null),
  fuel_surcharge_waiver: z.boolean().nullable().catch(null),

  // -- STRINGS --
  card_type: z.string().nullable().catch(null),
  card_network: z.string().nullable().catch(null),
  card_tier: z.string().nullable().catch(null),
  annual_fee_waiver_conditions: z.string().nullable().catch(null),
  reward_type: z.string().nullable().catch(null),
  base_reward_unit: z.string().nullable().catch(null),
  earn_accelerated: z.string().nullable().catch(null),
  earn_exclusions: z.string().nullable().catch(null),
  transfer_partners: z.string().nullable().catch(null),
  airline_transfer_ratio: z.string().nullable().catch(null),
  hotel_transfer_ratio: z.string().nullable().catch(null),
  best_use: z.string().nullable().catch(null),
  worst_use: z.string().nullable().catch(null),
  lounge_program: z.string().nullable().catch(null),
  movie_benefits: z.string().nullable().catch(null),
  dining_discounts: z.string().nullable().catch(null),
  welcome_offer_end_date: z.string().nullable().catch(null),

  // -- ARRAYS --
  partner_airlines: z.array(z.string()).nullable().catch(null),
  excluded_mcc: z.array(z.string()).nullable().catch(null)
}); // Removed .passthrough() completely.

// ==========================================
// 2. 🛟 THE SAFETY NET: Graceful API/DB Retries
// ==========================================
async function withRetry(operationName, fn, retries = 3, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) {
        console.error(`❌ ${operationName} failed permanently after ${retries} attempts.`);
        throw error;
      }
      console.warn(`⚠️ ${operationName} timed out or failed. Retrying in ${delay}ms... (${i + 1}/${retries})`);
      await sleep(delay);
    }
  }
}

// ==========================================
// 3. 📡 THE PINGER: Automated Webhook Notifications
// ==========================================
async function sendDiscordAlert(stats) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const message = {
    content: `🟢 **Daily Sync Complete**\n🏦 Banks Scanned: ${stats.banks}\n✨ Cards Added/Updated: ${stats.updated}\n⏭️ Cards Skipped: ${stats.skipped}\n❌ Errors: ${stats.errors}`
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (e) {
    console.error("Failed to send webhook alert.");
  }
}

// ==========================================
// DB CHECK: AVOID REDUNDANT API CALLS
// ==========================================
async function checkIfCardNeedsUpdate(cardName) {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('last_updated')
      .eq('card_name', cardName)
      .single();

    if (error || !data) return true;

    const lastUpdatedDate = new Date(data.last_updated);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 10);

    if (lastUpdatedDate > thirtyDaysAgo) {
      return false; 
    }

    return true; 
  } catch (e) {
    return true; 
  }
}

// ==========================================
// RAG SEARCH AGENT
// ==========================================
async function searchLiveWeb(bankName, cardName) {
  console.log(`🔍 Searching live web for current data: ${cardName}...`);
  try {
    const response = await fetch(TAVILY_URL, {
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
    const response = await fetch(AI_URL, {
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
Include private banks, public sector banks, and small finance banks (e.g., HDFC Bank, SBI Card, Axis Bank, ICICI Bank, American Express, IDFC First Bank, AU Small Finance, etc.).
CRITICAL EXCLUSIONS: You MUST NOT include corporate-only banks, investment banks, or banks that have exited the Indian retail credit card market. Strictly EXCLUDE Citi Bank, Deutsche Bank, Bank of America, Barclays Bank, and JPMorgan Chase Bank.
Output ONLY a valid JSON object with a single key "banks" containing an array of strings.` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });
    
    if (response.status === 429) {
      console.warn(`⏳ Rate limit hit during Bank Scout. Sleeping for 60 seconds...`);
      await sleep(60000);
      return getActiveBanks();
    }

    const data = await response.json();
    if (!response.ok) return [];
    
    return parseSafeJSON(data.choices[0].message.content)?.banks || [];
  } catch (e) {
    return [];
  }
}

// ==========================================
// SCOUT PHASE 2: CARDS PER BANK
// ==========================================
async function getCardsForBank(bankName) {
  console.log(`\n🕵️ Scouting active cards for: ${bankName}...`);
  try {
    const response = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a master financial directory AI for the Indian credit card ecosystem." },
          { role: "user", content: `List all active, currently issued consumer credit cards offered by ${bankName} in India. Exclude closed/deprecated cards, commercial cards, and debit cards. 
CRITICAL: Ensure you explicitly list popular specific premium variants (e.g., "HDFC Bank Regalia Gold Credit Card", "HDFC Bank Infinia Metal Edition").
Output ONLY a valid JSON object with a single key "cards" containing an array of strings.` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (response.status === 429) {
      console.warn(`⏳ Rate limit hit scouting cards for ${bankName}. Sleeping for 60 seconds...`);
      await sleep(60000);
      return getCardsForBank(bankName);
    }

    const data = await response.json();
    if (!response.ok) return [];

    return parseSafeJSON(data.choices[0].message.content)?.cards || [];
  } catch (e) {
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
2. Transfer Partners (INTERNAL KNOWLEDGE OVERRIDE): In the "transfer_partners" field, DO NOT write a generic summary like "16 airline partners" or group them together. If the live web text provides a generic summary, YOU MUST OVERRIDE IT and list EACH individual airline and hotel name explicitly paired with its exact transfer ratio. 
CRITICAL FORMAT: Every single program must have its own ratio in brackets immediately preceding the name, separated by commas. 
Example: '[1:1] Singapore Airlines KrisFlyer, [2:1] British Airways Executive Club, [1:2] IHG Rewards Club'
WARNING: Accurately reflect mid-tier card ratios (e.g., HDFC Regalia Gold transferring at 2:1 to Avios) rather than defaulting to 1:1.
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
  "base_reward_rate": "string or null",
  "base_reward_unit": "string or null",
  "earn_accelerated": "string or null",
  "earn_exclusions": "string or null",
  "points_per_100": "string or null",
  "transfer_partners": "string or null",
  "airline_transfer_ratio": "string or null",
  "hotel_transfer_ratio": "string or null",
  "partner_airlines": "array of strings or null",
  "statement_redemption_ratio": "number or null",
  "reward_cap_monthly": "number or null",
  "reward_cap_annual": "number or null",
  "reward_expiry_months": "number or null",
  "best_use": "string or null",
  "worst_use": "string or null",
  "domestic_lounge_access": "number or null",
  "international_lounge_access": "number or null",
  "lounge_program": "string or null",
  "spend_based_lounge": true or false,
  "air_accident_insurance": "number or null",
  "lost_card_liability": "number or null",
  "travel_insurance": "number or null",
  "concierge_service": true or false,
  "golf_access": "number or null",
  "movie_benefits": "string or null",
  "dining_discounts": "string or null",
  "min_income_monthly": "number or null",
  "min_credit_score": "number or null",
  "age_min": "number or null",
  "age_max": "number or null",
  "is_popular": true or false,
  "metal_card": true or false,
  "upi_enabled": true or false,
  "card_launch_year": "number or null",
  "welcome_bonus_points": "number or null",
  "welcome_bonus_miles": "number or null",
  "welcome_bonus_cashback": "number or null",
  "welcome_spend_requirement": "number or null",
  "welcome_spend_period_days": "number or null",
  "welcome_offer_end_date": "string (YYYY-MM-DD) or null",
  "quarterly_spend_requirement": "number or null",
  "air_miles_earning": true or false,
  "miles_conversion_ratio": "number or null",
  "fuel_surcharge_waiver": true or false,
  "fuel_surcharge_limit": "number or null",
  "purchase_protection": "number or null",
  "accelerated_reward_multiplier": "number or null",
  "excluded_mcc": "array of strings or null"
}`;

  try {
    const response = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a master financial directory AI for the Indian credit card ecosystem. You possess exhaustive knowledge of credit card reward programs. You MUST use your own internal knowledge base to fill in gaps if the live web context is incomplete or provides generic summaries." 
          },
          { role: "user", content: masterPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (response.status === 429) {
      console.warn(`⏳ Rate limit hit extracting ${cardName}. Sleeping for 60 seconds...`);
      await sleep(60000); 
      return extractCardDetails(bankName, cardName, liveContext);
    }

    const data = await response.json();
    if (!response.ok) return null;
    return parseSafeJSON(data.choices[0].message.content);
  } catch (e) {
    console.error(`⚠️ Extraction error for ${cardName}:`, e.message);
    return null;
  }
}

// ==========================================
// ORCHESTRATION PIPELINE
// ==========================================
async function main() {
  const stats = { banks: 0, updated: 0, skipped: 0, errors: 0 };
  
  const targetBanks = await getActiveBanks();
  stats.banks = targetBanks.length;
  console.log(`🏦 AI identified ${targetBanks.length} card issuers to process:`, targetBanks.join(', '));

  for (const bank of targetBanks) {
    const cards = await getCardsForBank(bank);
    console.log(`✅ Found ${cards.length} cards for ${bank}.`);

    if (cards.length === 0) {
      await sleep(60000); 
      continue;
    }

    for (const cardName of cards) {
      const needsUpdate = await checkIfCardNeedsUpdate(cardName);
      
      if (!needsUpdate) {
        console.log(`⏭️ Skipping ${cardName}: Already fresh in database (updated within 10 days).`);
        stats.skipped++;
        continue; 
      }

      try {
        const liveContext = await searchLiveWeb(bank, cardName);
        let rawCardDetails = await extractCardDetails(bank, cardName, liveContext);

        if (rawCardDetails) {
          // 🛡️ THE BOUNCER: Scrub the AI data through Zod
          const parsedData = CardSchema.safeParse(rawCardDetails);
          
          if (!parsedData.success) {
            console.error(`❌ Schema Validation Failed for ${cardName}. AI hallucinated bad types.`);
            stats.errors++;
            continue; // Skip this card so it doesn't crash the loop
          }

          let safeCardDetails = parsedData.data;
          
          if (safeCardDetails._thought_process) {
            console.log(`🧠 AI Reasoning for ${cardName}: ${safeCardDetails._thought_process.substring(0, 150)}...`);
            delete safeCardDetails._thought_process;
          }

          safeCardDetails.last_updated = new Date().toISOString();

          // 🛟 THE SAFETY NET: Wrap the DB insert in a retry loop
          await withRetry(`Supabase Upsert: ${cardName}`, async () => {
            const { error } = await supabase
              .from('cards')
              .upsert(safeCardDetails, { onConflict: 'card_name' });
            
            if (error) throw new Error(error.message); 
          });

          console.log(`💾 Successfully synced ${cardName} to database.`);
          stats.updated++;
        }
      } catch (err) {
        console.error(`🚨 Fatal loop error for ${cardName}:`, err.message);
        stats.errors++;
      }

      console.log('⏳ Pausing for 60 seconds to respect rate limits...');
      await sleep(60000); 
    }
  }

  // 📡 THE PINGER: Broadcast the final report
  await sendDiscordAlert(stats);
  
  console.log('\n🎉 AI Data Pipeline Complete!');
  console.log(stats);
  process.exit(0);
}

main();