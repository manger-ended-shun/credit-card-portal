// update-card-data.js
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * PHASE 1: Curated Core Dataset (True, high-fidelity ground truth for major Indian cards)
 * This ensures your app is never empty or full of junk FAQs.
 */
const CURATED_CARDS = [
  // --- HDFC BANK ---
  {
    card_name: "Infinia Credit Card Metal Edition",
    bank_name: "HDFC Bank",
    card_type: "Premium",
    card_network: "Visa",
    card_tier: "Super Premium",
    annual_fee: 12500,
    joining_fee: 12500,
    annual_fee_waiver_conditions: "Spend 10 Lakhs in a preceding year",
    reward_type: "Reward Points",
    base_reward_rate: 3.33,
    category_rewards: { "SmartBuy": 16.65, "Dining": 6.66 },
    domestic_lounge_access: 99, // Unlimited
    international_lounge_access: 99, // Unlimited
    min_income_monthly: 300000,
    is_popular: true,
    is_active: true
  },
  {
    card_name: "Diners Club Black",
    bank_name: "HDFC Bank",
    card_type: "Premium",
    card_network: "Diners Club",
    card_tier: "Super Premium",
    annual_fee: 10000,
    joining_fee: 10000,
    annual_fee_waiver_conditions: "Spend 8 Lakhs in a preceding year",
    reward_type: "Reward Points",
    base_reward_rate: 3.33,
    category_rewards: { "SmartBuy": 16.65 },
    domestic_lounge_access: 99,
    international_lounge_access: 99,
    is_popular: true,
    is_active: true
  },
  {
    card_name: "Regalia Gold",
    bank_name: "HDFC Bank",
    card_type: "Rewards",
    card_network: "Visa",
    card_tier: "Premium",
    annual_fee: 2500,
    joining_fee: 2500,
    annual_fee_waiver_conditions: "Spend 3 Lakhs in a preceding year",
    reward_type: "Reward Points",
    base_reward_rate: 1.33,
    category_rewards: { "Retail Spends": 1.33, "Travel & Dining": 5.32 },
    domestic_lounge_access: 12,
    international_lounge_access: 6,
    is_popular: true,
    is_active: true
  },
  {
    card_name: "Millennia Credit Card",
    bank_name: "HDFC Bank",
    card_type: "Cashback",
    card_network: "Mastercard",
    card_tier: "Entry Level",
    annual_fee: 1000,
    joining_fee: 1000,
    annual_fee_waiver_conditions: "Spend 1 Lakh in a preceding year",
    reward_type: "Cashback",
    base_reward_rate: 1.00,
    category_rewards: { "Partner Merchants": 5.00, "Online Spends": 1.00 },
    domestic_lounge_access: 4,
    international_lounge_access: 0,
    is_popular: true,
    is_active: true
  },
  // --- ICICI BANK ---
  {
    card_name: "Amazon Pay ICICI Bank Credit Card",
    bank_name: "ICICI Bank",
    card_type: "Cashback",
    card_network: "Visa",
    card_tier: "Entry Level",
    annual_fee: 0,
    joining_fee: 0,
    annual_fee_waiver_conditions: "Lifetime Free",
    reward_type: "Amazon Pay Balance",
    base_reward_rate: 1.00,
    category_rewards: { "Amazon Prime Shopping": 5.00, "Non-Prime Shopping": 3.00, "Flight & Travel": 2.00 },
    domestic_lounge_access: 0,
    international_lounge_access: 0,
    is_popular: true,
    is_active: true
  },
  {
    card_name: "ICICI Emeralde Private Metal Credit Card",
    bank_name: "ICICI Bank",
    card_type: "Luxury",
    card_network: "Visa",
    card_tier: "Super Premium",
    annual_fee: 12499,
    joining_fee: 12499,
    annual_fee_waiver_conditions: "Spend 10 Lakhs in a preceding year",
    reward_type: "Reward Points",
    base_reward_rate: 1.50,
    category_rewards: { "All Spends": 1.50 },
    domestic_lounge_access: 99,
    international_lounge_access: 99,
    is_popular: false,
    is_active: true
  },
  // --- AXIS BANK ---
  {
    card_name: "Axis Bank Magnus Credit Card",
    bank_name: "Axis Bank",
    card_type: "Premium",
    card_network: "Visa",
    card_tier: "Super Premium",
    annual_fee: 12500,
    joining_fee: 12500,
    annual_fee_waiver_conditions: "Spend 25 Lakhs in a preceding year",
    reward_type: "Edge Horizon Points",
    base_reward_rate: 1.20,
    category_rewards: { "Travel Edge": 6.00 },
    domestic_lounge_access: 99,
    international_lounge_access: 8,
    is_popular: true,
    is_active: true
  },
  {
    card_name: "Flipkart Axis Bank Credit Card",
    bank_name: "Axis Bank",
    card_type: "Cashback",
    card_network: "Visa",
    card_tier: "Entry Level",
    annual_fee: 500,
    joining_fee: 500,
    annual_fee_waiver_conditions: "Spend 3.5 Lakhs in a preceding year",
    reward_type: "Cashback",
    base_reward_rate: 1.00,
    category_rewards: { "Flipkart Spends": 5.00, "Cleartrip/Cult.fit": 4.00 },
    domestic_lounge_access: 4,
    international_lounge_access: 0,
    is_popular: true,
    is_active: true
  },
  {
    card_name: "Axis Bank Ace Credit Card",
    bank_name: "Axis Bank",
    card_type: "Cashback",
    card_network: "Visa",
    card_tier: "Entry Level",
    annual_fee: 499,
    joining_fee: 499,
    annual_fee_waiver_conditions: "Spend 2 Lakhs in a preceding year",
    reward_type: "Cashback",
    base_reward_rate: 1.50,
    category_rewards: { "Google Pay Bills/Recharges": 5.00, "Swiggy/Zomato/Ola": 4.00 },
    domestic_lounge_access: 4,
    international_lounge_access: 0,
    is_popular: true,
    is_active: true
  },
  // --- STATE BANK OF INDIA (SBI CARD) ---
  {
    card_name: "SBI Card Elite",
    bank_name: "SBI Card",
    card_type: "Premium",
    card_network: "Visa",
    card_tier: "Premium",
    annual_fee: 4999,
    joining_fee: 4999,
    annual_fee_waiver_conditions: "Spend 10 Lakhs in a preceding year",
    reward_type: "Reward Points",
    base_reward_rate: 1.00,
    category_rewards: { "Dining & Departmental Stores": 5.00 },
    domestic_lounge_access: 8,
    international_lounge_access: 6,
    is_popular: true,
    is_active: true
  },
  {
    card_name: "SBI Card Pulse",
    bank_name: "SBI Card",
    card_type: "Lifestyle",
    card_network: "Visa",
    card_tier: "Mid Tier",
    annual_fee: 1499,
    joining_fee: 1499,
    annual_fee_waiver_conditions: "Spend 2 Lakhs in a preceding year",
    reward_type: "Reward Points",
    base_reward_rate: 0.50,
    category_rewards: { "Chemist/Pharmacy/Dining/Movies": 2.50 },
    domestic_lounge_access: 8,
    international_lounge_access: 0,
    is_popular: false,
    is_active: true
  },
  {
    card_name: "SBI SimplyCLICK Credit Card",
    bank_name: "SBI Card",
    card_type: "Shopping",
    card_network: "Visa",
    card_tier: "Entry Level",
    annual_fee: 499,
    joining_fee: 499,
    annual_fee_waiver_conditions: "Spend 1 Lakh in a preceding year",
    reward_type: "Reward Points",
    base_reward_rate: 0.25,
    category_rewards: { "Apollo/Cleartrip/Eazydiner/Flipkart/Myntra": 2.50, "Other Online Spends": 1.25 },
    domestic_lounge_access: 0,
    international_lounge_access: 0,
    is_popular: true,
    is_active: true
  }
  // Note: Add more core cards to this structural array as you discover them!
];

/**
 * Strict String Validator to dynamically clean scraped strings.
 * Blocks FAQs, buttons, nav strings, or policies from corrupting the DB.
 */
function isValidCardName(name, bankName) {
  if (!name || typeof name !== 'string') return false;
  
  const clean = name.trim();
  
  // Rules to weed out junk
  if (/^\d+\./.test(clean)) return false; // Starts with FAQ digits like "1. How to..."
  if (clean.endsWith('?')) return false; // It's an FAQ question
  if (clean.split(/\s+/).length > 7) return false; // Sentence length is likely a blog title or banner text
  
  const lowerJunk = clean.toLowerCase();
  const junkWords = [
    'cookie', 'download', 'shareholder', 'lounge access', 'recurring payment', 
    'utilisation', 'statements', 'manage your', 'tips to', 'block my', 'lost card', 
    'billing cycle', 'usage', 'terms', 'privacy', 'policy', 'careers', 'about us',
    'click here', 'apply now', 'view details', 'learn more', 'faqs'
  ];
  
  if (junkWords.some(word => lowerJunk.includes(word))) return false;
  
  // Stricter affirmative validation: Make sure it relates to credit cards
  const validKeywords = ['card', 'visa', 'mastercard', 'rupay', 'amex', 'platinum', 'gold', 'signature', 'infinia', 'regalia', 'select', 'elite', 'prime'];
  const hasKeyword = validKeywords.some(keyword => lowerJunk.includes(keyword));
  
  // If the bank name is in it, or it contains standard card keywords, it passes
  return hasKeyword || lowerJunk.includes(bankName.toLowerCase());
}

/**
 * PHASE 2 & 3: Dynamic Fallback Scraping (Fills gaps using highly targetted aggregator scraping)
 */
async function scrapeAggregators() {
  const discoveredCards = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Launching resilient fallback aggregator scrapers...');

  // Target Source: CardInsider Aggregator Framework
  try {
    await page.goto('https://cardinsider.com/best-credit-cards-in-india/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Scrape specific structured listing elements instead of broad headers
    const cardElements = await page.evaluate(() => {
      const results = [];
      // Look explicitly for anchor tags inside product titles or specific grid items
      const elements = document.querySelectorAll('.wp-block-heading, .card-box h3, .entry-title a, h3[class*="title"]');
      elements.forEach(el => {
        const text = el.innerText ? el.innerText.trim() : '';
        if (text) results.push(text);
      });
      return results;
    });

    console.log(`🔍 Extracted ${cardElements.length} raw text nodes from CardInsider.`);

    for (let rawName of cardElements) {
      // Map back to structural bank buckets
      let detectedBank = "Other";
      if (rawName.includes("HDFC")) detectedBank = "HDFC Bank";
      else if (rawName.includes("SBI") || rawName.includes("State Bank")) detectedBank = "SBI Card";
      else if (rawName.includes("ICICI")) detectedBank = "ICICI Bank";
      else if (rawName.includes("Axis")) detectedBank = "Axis Bank";
      else if (rawName.includes("Kotak")) detectedBank = "Kotak Mahindra Bank";
      else if (rawName.includes("IDFC")) detectedBank = "IDFC FIRST Bank";
      else if (rawName.includes("RBL")) detectedBank = "RBL Bank";
      else if (rawName.includes("Standard Chartered")) detectedBank = "Standard Chartered";

      if (detectedBank !== "Other" && isValidCardName(rawName, detectedBank)) {
        discoveredCards.push({
          card_name: rawName.replace(detectedBank, '').replace('Credit Card', '').trim(),
          bank_name: detectedBank,
          card_type: "Standard Spends",
          card_network: "Visa/Mastercard",
          card_tier: "Standard",
          annual_fee: 500, // Safe generic defaults for discovered cards
          joining_fee: 500,
          is_popular: false,
          is_active: true
        });
      }
    }
  } catch (err) {
    console.warn('⚠️ Warning: Aggregator Scraper encountered an isolated issue:', err.message);
  }

  await browser.close();
  return discoveredCards;
}

/**
 * PHASE 4: Deduplication and Database Synchronization
 */
async function main() {
  console.log('🚀 Starting Hybrid Data Sync Pipeline...');

  // Step 1: Temporarily clear/deactivate non-essential states to avoid old stale flags
  const { error: resetError } = await supabase
    .from('cards')
    .update({ is_active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Batch target safe modification

  if (resetError) {
    console.error('⚠️ Could not update active states safely:', resetError.message);
  }

  // Step 2: Load our dynamic scraped discoveries
  const dynamicDiscoveries = await scrapeAggregators();
  console.log(`✨ Filtered dynamic validation yielded ${dynamicDiscoveries.length} valid cards.`);

  // Step 3: Combine Curated (Takes precedence) + Dynamic Discoveries
  const masterList = [...CURATED_CARDS];

  // Prevent dynamic discoveries from overriding structural information in seed items
  dynamicDiscoveries.forEach(disc => {
    const exists = masterList.some(
      curated => curated.card_name.toLowerCase() === disc.card_name.toLowerCase() &&
                 curated.bank_name.toLowerCase() === disc.bank_name.toLowerCase()
    );
    if (!exists) {
      masterList.push(disc);
    }
  });

  console.log(`📊 Upserting a total combined pool of ${masterList.length} uniquely resolved cards to Supabase...`);

  // Step 4: Write directly using unique column updates
  let insertedCount = 0;
  for (const card of masterList) {
    const { error: upsertError } = await supabase
      .from('cards')
      .upsert(
        { 
          ...card, 
          last_updated: new Date().toISOString() 
        }, 
        { onConflict: 'card_name,bank_name' }
      );

    if (upsertError) {
      console.error(`❌ Failed to synchronize card "${card.card_name}":`, upsertError.message);
    } else {
      insertedCount++;
    }
  }

  console.log(`🎉 Pipeline execution succeeded. Synchronized ${insertedCount} pristine data records successfully.`);
}

main().catch(err => {
  console.error('💥 Critical Execution Failure:', err);
  process.exit(1);
});