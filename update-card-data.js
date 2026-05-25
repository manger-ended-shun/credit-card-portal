// update-card-data.js
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    domestic_lounge_access: 99, 
    international_lounge_access: 99, 
    concierge_service: true,
    golf_access: 99, // Your frontend will intercept this and display 'Unlimited'
    air_accident_insurance: 30000000, // ₹3 Crore
    fuel_surcharge_waiver: true,
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
    concierge_service: true,
    golf_access: 24,
    air_accident_insurance: 20000000, // ₹2 Crore
    fuel_surcharge_waiver: true,
    min_income_monthly: 175000,
    is_popular: true,
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
    concierge_service: true,
    golf_access: 8,
    air_accident_insurance: 45000000, // ₹4.5 Crore
    fuel_surcharge_waiver: true,
    min_income_monthly: 200000,
    is_popular: true,
    is_active: true
  }
];

function isValidCardName(name, bankName) {
  if (!name || typeof name !== 'string') return false;
  
  const clean = name.trim();
  if (/^\d+\./.test(clean)) return false; 
  if (clean.endsWith('?')) return false; 
  if (clean.split(/\s+/).length > 7) return false; 
  
  const lowerJunk = clean.toLowerCase();
  
  // Strict blocklist prevents the scraper from injecting duplicate variations
  const curatedKeywords = ['infinia', 'magnus', 'diners club black'];
  if (curatedKeywords.some(keyword => lowerJunk.includes(keyword))) {
    return false;
  }

  const junkWords = [
    'cookie', 'download', 'shareholder', 'lounge access', 'recurring payment', 
    'utilisation', 'statements', 'manage your', 'tips to', 'block my', 'lost card', 
    'billing cycle', 'usage', 'terms', 'privacy', 'policy', 'careers', 'about us',
    'click here', 'apply now', 'view details', 'learn more', 'faqs'
  ];
  if (junkWords.some(word => lowerJunk.includes(word))) return false;
  
  const validKeywords = ['card', 'visa', 'mastercard', 'rupay', 'amex', 'platinum', 'gold', 'signature', 'select', 'elite', 'prime'];
  const hasKeyword = validKeywords.some(keyword => lowerJunk.includes(keyword));
  
  return hasKeyword || lowerJunk.includes(bankName.toLowerCase());
}

async function scrapeAggregators() {
  const discoveredCards = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Launching resilient fallback aggregator scrapers...');

  try {
    await page.goto('https://cardinsider.com/best-credit-cards-in-india/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const cardElements = await page.evaluate(() => {
      const results = [];
      const elements = document.querySelectorAll('.wp-block-heading, .card-box h3, .entry-title a, h3[class*="title"]');
      elements.forEach(el => {
        const text = el.innerText ? el.innerText.trim() : '';
        if (text) results.push(text);
      });
      return results;
    });

    for (let rawName of cardElements) {
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
          annual_fee: 500, 
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

async function main() {
  console.log('🚀 Starting Hybrid Data Sync Pipeline...');

  await supabase.from('cards').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000'); 
  const dynamicDiscoveries = await scrapeAggregators();
  const masterList = [...CURATED_CARDS];

  dynamicDiscoveries.forEach(disc => {
    const exists = masterList.some(
      curated => curated.card_name.toLowerCase() === disc.card_name.toLowerCase() &&
                 curated.bank_name.toLowerCase() === disc.bank_name.toLowerCase()
    );
    if (!exists) {
      masterList.push(disc);
    }
  });

  let insertedCount = 0;
  for (const card of masterList) {
    const { error: upsertError } = await supabase
      .from('cards')
      .upsert(
        { ...card, last_updated: new Date().toISOString() }, 
        { onConflict: 'card_name,bank_name' }
      );
    if (!upsertError) insertedCount++;
  }
  console.log(`🎉 Synchronized ${insertedCount} pristine data records successfully.`);
}

main();