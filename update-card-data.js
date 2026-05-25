// update-card-data.js
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
 
const { createClient } = require('@supabase/supabase-js');
 
// Debug: Check environment variables
console.log('🔍 Checking environment variables...');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
 
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}
 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
 
const supabase = createClient(supabaseUrl, supabaseKey);
 
// Credit card data
const DATA_SOURCES = {
  HDFC: {
    name: 'HDFC Bank',
    website: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
    cards: [
      {
        card_name: 'HDFC Infinia Credit Card',
        card_type: 'credit',
        card_network: 'Visa',
        card_tier: 'Super Premium',
        annual_fee: 12500,
        joining_fee: 12500,
        annual_fee_waiver_conditions: 'Spend ₹8 lakhs in a year',
        reward_type: 'points',
        base_reward_rate: 3.33,
        category_rewards: { dining: 5, online: 5, travel: 5, groceries: 5 },
        domestic_lounge_access: 8,
        international_lounge_access: 6,
        min_income_monthly: 150000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true,
        source_url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/infinia-credit-card'
      },
      {
        card_name: 'HDFC Diners Club Black',
        card_type: 'credit',
        card_network: 'Diners',
        card_tier: 'Super Premium',
        annual_fee: 10000,
        joining_fee: 10000,
        annual_fee_waiver_conditions: 'Spend ₹5 lakhs in a year',
        reward_type: 'points',
        base_reward_rate: 3.33,
        category_rewards: { dining: 5, travel: 5, groceries: 5 },
        domestic_lounge_access: 6,
        international_lounge_access: 6,
        min_income_monthly: 150000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true,
        source_url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/diners-club-black'
      },
      {
        card_name: 'HDFC Regalia Gold',
        card_type: 'credit',
        card_network: 'Visa',
        card_tier: 'Premium',
        annual_fee: 2500,
        joining_fee: 2500,
        annual_fee_waiver_conditions: 'Spend ₹1.5 lakhs in a year',
        reward_type: 'points',
        base_reward_rate: 2,
        category_rewards: { dining: 4, online: 2, travel: 4 },
        domestic_lounge_access: 3,
        international_lounge_access: 0,
        min_income_monthly: 75000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true,
        source_url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold'
      },
      {
        card_name: 'HDFC Millennia',
        card_type: 'credit',
        card_network: 'Visa',
        card_tier: 'Mid',
        annual_fee: 1000,
        joining_fee: 1000,
        annual_fee_waiver_conditions: 'Spend ₹1 lakh in a year',
        reward_type: 'cashback',
        base_reward_rate: 2.5,
        category_rewards: { dining: 5, wallet_reloads: 5, online_shopping: 5 },
        domestic_lounge_access: 0,
        international_lounge_access: 0,
        min_income_monthly: 30000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true,
        source_url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/millennia'
      }
    ]
  },
  ICICI: {
    name: 'ICICI Bank',
    website: 'https://www.icicibank.com/credit-card',
    cards: [
      {
        card_name: 'ICICI Amazon Pay Credit Card',
        card_type: 'credit',
        card_network: 'Visa',
        card_tier: 'Entry',
        annual_fee: 0,
        joining_fee: 0,
        reward_type: 'cashback',
        base_reward_rate: 1,
        category_rewards: { prime: 5, amazon: 5, dining: 2 },
        domestic_lounge_access: 0,
        international_lounge_access: 0,
        min_income_monthly: 20000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true,
        source_url: 'https://www.icicibank.com/credit-card/amazon-pay-credit-card'
      },
      {
        card_name: 'ICICI Emeralde Credit Card',
        card_type: 'credit',
        card_network: 'Visa',
        card_tier: 'Super Premium',
        annual_fee: 12000,
        joining_fee: 12000,
        annual_fee_waiver_conditions: 'Spend ₹8 lakhs in a year',
        reward_type: 'points',
        base_reward_rate: 3,
        category_rewards: { dining: 4, travel: 4, online: 3 },
        domestic_lounge_access: 6,
        international_lounge_access: 3,
        min_income_monthly: 150000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true,
        source_url: 'https://www.icicibank.com/credit-card/emeralde-credit-card'
      }
    ]
  },
  AXIS: {
    name: 'Axis Bank',
    website: 'https://www.axisbank.com/credit-cards',
    cards: [
      {
        card_name: 'Axis Magnus Credit Card',
        card_type: 'credit',
        card_network: 'Visa',
        card_tier: 'Super Premium',
        annual_fee: 12500,
        joining_fee: 12500,
        annual_fee_waiver_conditions: 'Spend ₹15 lakhs in a year',
        reward_type: 'points',
        base_reward_rate: 4,
        category_rewards: { dining: 12, travel: 12, online: 12 },
        domestic_lounge_access: 8,
        international_lounge_access: 4,
        min_income_monthly: 200000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true,
        source_url: 'https://www.axisbank.com/credit-cards/magnus-credit-card'
      },
      {
        card_name: 'Axis Flipkart Credit Card',
        card_type: 'credit',
        card_network: 'Visa',
        card_tier: 'Entry',
        annual_fee: 500,
        joining_fee: 500,
        annual_fee_waiver_conditions: 'Spend ₹2 lakhs in a year',
        reward_type: 'cashback',
        base_reward_rate: 1.5,
        category_rewards: { flipkart: 5, online_shopping: 3, dining: 1.5 },
        domestic_lounge_access: 0,
        international_lounge_access: 0,
        min_income_monthly: 25000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true,
        source_url: 'https://www.axisbank.com/credit-cards/flipkart-credit-card'
      }
    ]
  },
  SBI: {
    name: 'SBI Card',
    website: 'https://www.sbicard.com/credit-cards',
    cards: [
      {
        card_name: 'SBI Card Elite',
        card_type: 'credit',
        card_network: 'Visa',
        card_tier: 'Premium',
        annual_fee: 4999,
        joining_fee: 4999,
        annual_fee_waiver_conditions: 'Spend ₹5 lakhs in a year',
        reward_type: 'points',
        base_reward_rate: 2,
        category_rewards: { dining: 4, travel: 4, online: 2 },
        domestic_lounge_access: 4,
        international_lounge_access: 2,
        min_income_monthly: 100000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true,
        source_url: 'https://www.sbicard.com/credit-cards/elite'
      },
      {
        card_name: 'SBI SimplyCLICK Credit Card',
        card_type: 'credit',
        card_network: 'Visa',
        card_tier: 'Entry',
        annual_fee: 499,
        joining_fee: 499,
        annual_fee_waiver_conditions: 'Spend ₹1 lakh in a year',
        reward_type: 'points',
        base_reward_rate: 1,
        category_rewards: { online_shopping: 2.5, amazon: 2.5, flipkart: 2.5 },
        domestic_lounge_access: 0,
        international_lounge_access: 0,
        min_income_monthly: 20000,
        min_credit_score: 750,
        age_min: 21,
        age_max: 65,
        is_popular: true,
        source_url: 'https://www.sbicard.com/credit-cards/simplyclick'
      }
    ]
  }
};
 
// Current offers data
const CURRENT_OFFERS = [
  {
    title: 'HDFC Infinia 10X Rewards on Amazon',
    description: 'Get 10X rewards on Amazon purchases with Infinia card',
    offer_type: 'card_offer',
    bank_name: 'HDFC Bank',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_ongoing: true,
    source_name: 'HDFC Website',
    source_type: 'official',
    is_featured: true
  },
  {
    title: 'Axis Magnus Weekend Benefits',
    description: '12X rewards on all weekend spends with Magnus',
    offer_type: 'card_offer',
    bank_name: 'Axis Bank',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_ongoing: true,
    source_name: 'Axis Website',
    source_type: 'official',
    is_featured: true
  },
  {
    title: 'ICICI Amazon Pay Cashback Offer',
    description: 'Get 5% cashback on Amazon purchases',
    offer_type: 'cashback',
    bank_name: 'ICICI Bank',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_ongoing: true,
    source_name: 'ICICI Website',
    source_type: 'official',
    is_featured: false
  }
];
 
async function updateDatabase() {
  console.log('🔄 Starting database update...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log('');
 
  try {
    // Step 1: Update banks
    console.log('📋 Step 1: Updating banks...');
    for (const [bankCode, bankData] of Object.entries(DATA_SOURCES)) {
      const { data: existingBank, error: bankError } = await supabase
        .from('banks')
        .select('id')
        .eq('name', bankData.name)
        .single();
 
      if (bankError && bankError.code !== 'PGRST116') {
        console.error(`  ❌ Error checking bank ${bankData.name}:`, bankError.message);
        continue;
      }
 
      if (existingBank) {
        const { error: updateError } = await supabase
          .from('banks')
          .update({
            website_url: bankData.website,
            cards_count: bankData.cards.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBank.id);
        
        if (updateError) {
          console.error(`  ❌ Error updating ${bankData.name}:`, updateError.message);
        } else {
          console.log(`  ✅ Updated: ${bankData.name}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('banks')
          .insert({
            name: bankData.name,
            slug: bankCode.toLowerCase(),
            website_url: bankData.website,
            cards_count: bankData.cards.length,
            is_active: true
          });
        
        if (insertError) {
          console.error(`  ❌ Error adding ${bankData.name}:`, insertError.message);
        } else {
          console.log(`  ✅ Added: ${bankData.name}`);
        }
      }
    }
 
    // Step 2: Update cards
    console.log('\n📋 Step 2: Updating cards...');
    for (const [bankCode, bankData] of Object.entries(DATA_SOURCES)) {
      const { data: bank, error: bankError } = await supabase
        .from('banks')
        .select('id')
        .eq('name', bankData.name)
        .single();
 
      if (bankError || !bank) {
        console.error(`  ❌ Bank not found: ${bankData.name}`);
        continue;
      }
 
      for (const card of bankData.cards) {
        const { data: existingCard, error: cardError } = await supabase
          .from('cards')
          .select('id')
          .eq('card_name', card.card_name)
          .eq('bank_name', bankData.name)
          .single();
 
        const cardData = {
          ...card,
          bank_name: bankData.name,
          last_updated: new Date().toISOString(),
          is_active: true
        };
 
        if (cardError && cardError.code !== 'PGRST116') {
          console.error(`  ❌ Error checking card ${card.card_name}:`, cardError.message);
          continue;
        }
 
        if (existingCard) {
          const { error: updateError } = await supabase
            .from('cards')
            .update(cardData)
            .eq('id', existingCard.id);
          
          if (updateError) {
            console.error(`  ❌ Error updating ${card.card_name}:`, updateError.message);
          } else {
            console.log(`  ✅ Updated: ${card.card_name}`);
          }
        } else {
          const { error: insertError } = await supabase
            .from('cards')
            .insert(cardData);
          
          if (insertError) {
            console.error(`  ❌ Error adding ${card.card_name}:`, insertError.message);
          } else {
            console.log(`  ✅ Added: ${card.card_name}`);
          }
        }
      }
    }
 
    // Step 3: Update offers
    console.log('\n📋 Step 3: Updating offers...');
    for (const offer of CURRENT_OFFERS) {
      const { data: existingOffer, error: offerError } = await supabase
        .from('offers')
        .select('id')
        .eq('title', offer.title)
        .single();
 
      const offerData = {
        ...offer,
        updated_at: new Date().toISOString(),
        is_active: true
      };
 
      if (offerError && offerError.code !== 'PGRST116') {
        console.error(`  ❌ Error checking offer ${offer.title}:`, offerError.message);
        continue;
      }
 
      if (existingOffer) {
        const { error: updateError } = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', existingOffer.id);
        
        if (updateError) {
          console.error(`  ❌ Error updating ${offer.title}:`, updateError.message);
        } else {
          console.log(`  ✅ Updated: ${offer.title}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('offers')
          .insert(offerData);
        
        if (insertError) {
          console.error(`  ❌ Error adding ${offer.title}:`, insertError.message);
        } else {
          console.log(`  ✅ Added: ${offer.title}`);
        }
      }
    }
 
    console.log('\n✅ Database update completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Banks: ${Object.keys(DATA_SOURCES).length}`);
    console.log(`   - Cards: ${Object.values(DATA_SOURCES).reduce((sum, bank) => sum + bank.cards.length, 0)}`);
    console.log(`   - Offers: ${CURRENT_OFFERS.length}`);
 
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}
 
// Run the update
updateDatabase();