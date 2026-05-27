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
  // 1. HSBC Premier
  {
    card_name: "HSBC Premier Credit Card",
    bank_name: "HSBC Bank",
    card_type: "Premium",
    card_network: "Visa",
    card_tier: "Super Premium",
    annual_fee: 20000,
    annual_fee_waiver_conditions: "Waived for qualified HSBC Premier banking relationship",
    earn_base_rate: "3 RP/₹100 on eligible spends; 1 RP = ₹1 at Apple / select partners; accelerated Travel with Points eligible",
    earn_accelerated: "Travel with Points: hotels 12X (36 RP/₹100), flights 6X (18 RP/₹100); bonus cap 10k RP/month",
    earn_exclusions: "0 RP MCCs: fuel, govt/tax, wallets, jewellery, rent, education, utilities, financial institutions. Utilities MCC 4900 + Insurance MCCs capped at 3,000 RP/month.",
    points_per_100: "9 RP base; up to 108 RP best (12X hotels)",
    transfer_partners: "20 partners total (15 airlines + 5 hotels). Airlines = 1:1; Hotels = 1:1. AirAsia Rewards: 1:3. Shangri-La Circle: 5:1.",
    best_use: "Accor/Marriott/IHG 1:1 hotel stays. Airline JP via KrisFlyer, Qantas, BA (all 1:1). Portal travel with promos. Flying Blue promo awards 1:1.",
    worst_use: "Generic vouchers, catalogue, wealth. Shangri-La (5:1 poor). Turkish/United/Hainan (2:1). Statement credit.",
    domestic_lounge_access: 99,
    international_lounge_access: 99,
    is_popular: true,
    is_active: true
  },
  // 2. HSBC TravelOne
  {
    card_name: "HSBC TravelOne Credit Card",
    bank_name: "HSBC Bank",
    card_type: "Travel",
    card_network: "Visa",
    card_tier: "Premium",
    annual_fee: 3000,
    annual_fee_waiver_conditions: "Waiver around ₹3L annual spends",
    earn_base_rate: "2 RP/₹100 on regular spends; forex + travel eligible for accelerated earn; transferable airline/hotel points",
    earn_accelerated: "TravelOne 4 RP/₹100 (cap 50k RP/month); Travel with Points: hotels 6X, flights 4X; portal bonus cap 10k RP/month",
    earn_exclusions: "0 RP MCCs: fuel, utilities, insurance, govt/tax, jewellery, education, rent, wallets, financial services.",
    points_per_100: "6 RP base; up to 72 RP best (6X hotels)",
    transfer_partners: "Same 20 partners as Premier. Airlines = 1:1. AirAsia Rewards: 1:3. Hotels = 1:1.",
    best_use: "Accor/Marriott/IHG 1:1 hotel stays. Airline JP via KrisFlyer, Qantas, BA (all 1:1). Portal travel with promos.",
    worst_use: "Generic vouchers, catalogue, wealth. Shangri-La (5:1). Turkish/United/Hainan (2:1). Statement credit.",
    domestic_lounge_access: 8,
    international_lounge_access: 0,
    is_popular: false,
    is_active: true
  },
  // 3. SBI Miles Elite
  {
    card_name: "SBI Miles Elite Credit Card",
    bank_name: "SBI Card",
    card_type: "Travel",
    card_network: "Visa",
    card_tier: "Premium",
    annual_fee: 4999,
    annual_fee_waiver_conditions: "Waiver at ₹15L spends",
    earn_base_rate: "2 TC/₹200 on regular; 6 TC/₹200 on travel MCCs; 1 TC = ₹1 for miles; 1 TC = ₹0.50 for travel bookings",
    earn_accelerated: "Travel MCCs: 6 TC/₹200 (3 TC/₹100); no published monthly cap; no dedicated portal",
    earn_exclusions: "0 TC MCCs: fuel, e-wallet loading, rent/property, education, utilities, insurance, quasi-cash, balance transfers.",
    points_per_100: "3 TC base; 9 TC best (travel MCCs)",
    transfer_partners: "25 partners total. 1:1 ratio (10 airlines, 8 hotels). 3:1 ratio (8 airlines). AirAsia 1:3. Qatar/Singapore 2:1.",
    best_use: "Air India (Flying Blue, Air Miles) 1:1 for JF international. Domestic: short-haul. IHG + Wyndham 1:1 hotel redemptions.",
    worst_use: "BA/Finnair/Qatar/Turkish/ITC (1:0.25 TC); Shangri-La (5:1); Jumeirah/ITC/Turkish (2:1); statement credit.",
    domestic_lounge_access: 8,
    international_lounge_access: 6,
    is_popular: true,
    is_active: true
  },
  // 4. Axis Bank Horizon
  {
    card_name: "Axis Bank Horizon Credit Card",
    bank_name: "Axis Bank",
    card_type: "Travel",
    card_network: "Visa",
    card_tier: "Premium",
    annual_fee: 3000,
    annual_fee_waiver_conditions: "Waiver around ₹2-3L spends (check latest T&Cs)",
    earn_base_rate: "2 EDGE Miles/₹100 on regular spends; direct airline/hotel + Travel Edge acceleration",
    earn_accelerated: "Travel Edge + airlines/hotels 5 EDGE/₹100 (cap ₹2L travel/month; then 2 EDGE/₹100)",
    earn_exclusions: "0 EDGE MCCs: fuel, rent/real estate, wallets, EMI conversion, insurance, utilities, govt services. Qatar, Accor, Marriott removed. BA/Finnair at 2:1.",
    points_per_100: "4 EDGE base; 15 EDGE best (5 EDGE/₹100 travel)",
    transfer_partners: "~22 partners post Apr 2024 devaluation. 1:1 ratio (1 EDGE Mile) for most. Air India 1:1. BA/Finnair/LotusMiles at 2:1.",
    best_use: "Legacy 1:1 partners (KrisFlyer, Aeroplan, Etihad, JAL for JF). Air India 1:1 domestic. ITC/IHG 1:1 hotel stays.",
    worst_use: "BA/Finnair/Qatar (2:1). Generic vouchers, catalogue, statement credit; any Grp A partners with tight 1L sub-cap.",
    is_popular: false,
    is_active: true
  },
  // 5. HDFC Bank Infinia
  {
    card_name: "Infinia Credit Card Metal Edition",
    bank_name: "HDFC Bank",
    card_type: "Premium",
    card_network: "Visa",
    card_tier: "Super Premium",
    annual_fee: 12500,
    annual_fee_waiver_conditions: "Spend 10 Lakhs in a preceding year",
    earn_base_rate: "5 RP/₹150 (=3.33 RP/₹100); 1 RP = ₹1 on SmartBuy flights/hotels",
    earn_accelerated: "SmartBuy 5X flights, 10X hotels/trains; SmartBuy bonus 15k RP/month; total earn cap 2L RP/statement",
    earn_exclusions: "0 RP MCCs: fuel, wallets, EasyEMI, rent/govt, education. Caps: utilities MCC (4900) -> 2k RP/month; telecom -> 2k RP/month; insurance -> 5k RP/month.",
    points_per_100: "~10 RP base; ~100 RP best (hotels SmartBuy)",
    transfer_partners: "~22 partners total. Via SmartBuy/Rewards360: 1:1 ratio (8 partners). Via SmartBuy 2:1 ratio (14 partners).",
    best_use: "SmartBuy flights/hotels at 1 RP/₹ (best base use). KrisFlyer 1:1 via net banking. Accor 1:1.",
    worst_use: "Direct net transfer (2:1) — use Finnair bridge instead. Marriott/Radisson (2:1); generic catalogue.",
    domestic_lounge_access: 99, 
    international_lounge_access: 99, 
    concierge_service: true,
    golf_access: 99,
    air_accident_insurance: 30000000,
    fuel_surcharge_waiver: true,
    min_income_monthly: 300000,
    is_popular: true,
    is_active: true
  },
  // 6. Axis Magnus Burgundy
  {
    card_name: "Axis Bank Magnus Burgundy Credit Card",
    bank_name: "Axis Bank",
    card_type: "Premium",
    card_network: "Amex / Infinite",
    card_tier: "Super Premium",
    annual_fee: 30000,
    annual_fee_waiver_conditions: "Waiver at ₹30L spends",
    earn_base_rate: "12 EDGE RP/₹200 base slab (=6/₹100) up to ₹1.5L monthly spends",
    earn_accelerated: "12 EDGE RP/₹200 to ₹1.5L/month; 35 EDGE/₹200 between ₹1.5L - limits/₹1.5L; Travel Edge 60 EDGE/₹200 up to ₹2L/month",
    earn_exclusions: "0 EDGE MCCs: utilities, telecom, wallets, govt/tax, jewellery, education, rent. Gold/jewellery MCC 6013 rewards only up to ₹50k/month. Qatar, Accor, Marriott removed. BA/Finnair at 5:2.",
    points_per_100: "30 EDGE base; 90 EDGE best (₹200 Travel Edge)",
    transfer_partners: "~22 partners post Apr 2024 devaluation. Annual transfer cap: 10L pts. Group A (5:4 legacy partners); Group B (5:1).",
    best_use: "Legacy Grp A 5:4 (KrisFlyer, Aeroplan, Etihad, JAL for JF). Air India 5:4 Grp B. ITC 5:1 hotel stays.",
    worst_use: "BA/Finnair/Qatar/LotusMiles (5:2). Hitting 2L Grp A annual cap on low-value transfers.",
    domestic_lounge_access: 99,
    international_lounge_access: 99,
    concierge_service: true,
    golf_access: 99,
    is_popular: true,
    is_active: true
  },
  // 7. Axis Atlas
  {
    card_name: "Axis Atlas Credit Card",
    bank_name: "Axis Bank",
    card_type: "Travel",
    card_network: "Visa",
    card_tier: "Premium",
    annual_fee: 5000,
    annual_fee_waiver_conditions: "No fee waiver available. Instead: renewal EDGE Miles based on tier (Silver/Gold/Platinum).",
    earn_base_rate: "5 EDGE Miles/₹100 on travel spends (MCCs: airlines, hotels, travel agents); 2 EDGE Miles/₹100 on all other eligible spends",
    earn_accelerated: "Travel spends cap: ₹2L/month for accelerated 5 EDGE Miles rate. Tier milestone bonus miles: Silver 2,500 / Gold 5,000 / Platinum 10,000 per anniversary year.",
    earn_exclusions: "0 EDGE MCCs: fuel, insurance, wallets, govt, rent, education, utilities, gold/jewellery. 1% transaction fee on: education via apps, rent, wallet loads >₹10k/month, utility >₹50k/month. Qatar, Accor, Marriott removed. BA/Finnair devalued 2:1.",
    points_per_100: "6 EDGE base; 15 EDGE best (travel spends)",
    transfer_partners: "~22 partners post Apr 2024 devaluation. Annual cap: 1.5L EDGE Miles (30K Grp A + 1.2L Grp B). Group A (1:2 ratio); Group B (1:1 ratio).",
    best_use: "Travel spends at 5 EDGE Miles/₹100 = 10 partner miles (1:2 ratio). KrisFlyer, Aeroplan, Etihad, JAL (Group A, 1:2). Direct ₹1 per EDGE Mile on Axis Travel portal.",
    worst_use: "Very tight 30K Group A cap makes premium airline partners impractical for heavy earners. Statement credit / catalogue redemptions (₹0.5-1/EDGE Mile vs ₹2 potential).",
    domestic_lounge_access: 18,
    international_lounge_access: 12,
    is_popular: true,
    is_active: true
  },
  // 8. Diners Club Black (Retained from your existing list)
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
    air_accident_insurance: 20000000,
    fuel_surcharge_waiver: true,
    min_income_monthly: 175000,
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
  
  // Expanded blocklist for the new image matrix cards
  const curatedKeywords = [
    'infinia', 'magnus', 'diners club black', 
    'hsbc premier', 'travelone', 'miles elite', 'horizon', 'atlas', 'burgundy'
  ];
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