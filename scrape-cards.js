// scrape-cards.js
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
 
const { createClient } = require('@supabase/supabase-js');
 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 
const supabase = createClient(supabaseUrl, supabaseKey);
 
// Bank websites to scrape
const BANKS = [
  {
    name: 'HDFC Bank',
    slug: 'hdfc',
    website: 'https://www.hdfcbank.com/personal/cards',
    cards: [
      {
        name: 'HDFC Infinia Credit Card',
        tier: 'Super Premium',
        annual_fee: 12500,
        joining_fee: 12500,
        reward_type: 'points',
        base_reward_rate: 3.33,
        category_rewards: {
          dining: 5,
          online: 5,
          travel: 5,
          groceries: 5
        },
        domestic_lounge_access: 8,
        international_lounge_access: 6,
        min_income_monthly: 150000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true
      },
      {
        name: 'HDFC Diners Club Black',
        tier: 'Super Premium',
        annual_fee: 10000,
        joining_fee: 10000,
        reward_type: 'points',
        base_reward_rate: 3.33,
        category_rewards: {
          dining: 5,
          travel: 5,
          groceries: 5
        },
        domestic_lounge_access: 6,
        international_lounge_access: 6,
        min_income_monthly: 150000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true
      },
      {
        name: 'HDFC Regalia Gold',
        tier: 'Premium',
        annual_fee: 2500,
        joining_fee: 2500,
        reward_type: 'points',
        base_reward_rate: 2,
        category_rewards: {
          dining: 4,
          online: 2,
          travel: 4
        },
        domestic_lounge_access: 3,
        international_lounge_access: 0,
        min_income_monthly: 75000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true
      },
      {
        name: 'HDFC Millennia',
        tier: 'Mid',
        annual_fee: 1000,
        joining_fee: 1000,
        reward_type: 'cashback',
        base_reward_rate: 2.5,
        category_rewards: {
          dining: 5,
          wallet_reloads: 5,
          online_shopping: 5
        },
        domestic_lounge_access: 0,
        international_lounge_access: 0,
        min_income_monthly: 30000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true
      }
    ]
  },
  {
    name: 'ICICI Bank',
    slug: 'icici',
    website: 'https://www.icicibank.com/personal/cards',
    cards: [
      {
        name: 'ICICI Amazon Pay Credit Card',
        tier: 'Entry',
        annual_fee: 0,
        joining_fee: 0,
        reward_type: 'cashback',
        base_reward_rate: 1,
        category_rewards: {
          prime: 5,
          amazon: 5,
          dining: 2
        },
        domestic_lounge_access: 0,
        international_lounge_access: 0,
        min_income_monthly: 20000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true
      },
      {
        name: 'ICICI Amazon Pay ICICI Credit Card',
        tier: 'Entry',
        annual_fee: 0,
        joining_fee: 0,
        reward_type: 'cashback',
        base_reward_rate: 1,
        category_rewards: {
          prime: 5,
          amazon: 5,
          dining: 2
        },
        domestic_lounge_access: 0,
        international_lounge_access: 0,
        min_income_monthly: 20000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true
      },
      {
        name: 'ICICI Amazon Pay ICICI Credit Card',
        tier: 'Entry',
        annual_fee: 0,
        joining_fee: 0,
        reward_type: 'cashback',
        base_reward_rate: 1,
        category_rewards: {
          prime: 5,
          amazon: 5,
          dining: 2
        },
        domestic_lounge_access: 0,
        international_lounge_access: 0,
        min_income_monthly: 20000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true
      }
    ]
  }
];
 
async function scrapeCards() {
  console.log('🔍 Scraping Cards...\n');
 
  try {
    for (const bank of BANKS) {
      console.log(`📋 Processing ${bank.name}...`);
 
      for (const cardData of bank.cards) {
        // Check if card already exists
        const { data: existingCard } = await supabase
          .from('cards')
          .select('id')
          .eq('card_name', cardData.name)
          .eq('bank_name', bank.name)
          .single();
 
        if (existingCard) {
          // Update existing card
          const { error: updateError } = await supabase
            .from('cards')
            .update({
              card_tier: cardData.tier,
              annual_fee: cardData.annual_fee,
              joining_fee: cardData.joining_fee,
              reward_type: cardData.reward_type,
              base_reward_rate: cardData.base_reward_rate,
              category_rewards: cardData.category_rewards,
              domestic_lounge_access: cardData.domestic_l