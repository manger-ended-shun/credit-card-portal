// show-data.js
const dotenv = require('dotenv');
const path = require('path');

// Dynamically resolves to the root .env.local file regardless of where this script lives
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
 
const { createClient } = require('@supabase/supabase-js');
 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail gracefully if the environment variables aren't loaded properly
if (!supabaseUrl || !supabaseKey) {
  console.error("🚨 FATAL ERROR: Missing Supabase credentials. Check your .env.local path.");
  process.exit(1);
}
 
const supabase = createClient(supabaseUrl, supabaseKey);
 
async function showData() {
  console.log('🔍 Showing Database Data...\n');
 
  try {
    // Show Cards
    console.log('📋 CARDS:');
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .limit(5);
 
    if (cardsError) {
      console.log('❌ Error:', cardsError.message);
    } else {
      console.log(JSON.stringify(cards, null, 2));
    }
 
    // Show Offers (🟢 FIXED: Changed 'offers' to 'card_offers' to match your frontend!)
    console.log('\n📋 OFFERS:');
    const { data: offers, error: offersError } = await supabase
      .from('card_offers') 
      .select('*')
      .limit(5);
 
    if (offersError) {
      console.log('❌ Error:', offersError.message);
    } else {
      console.log(JSON.stringify(offers, null, 2));
    }
 
    // Show Banks
    console.log('\n📋 BANKS:');
    const { data: banks, error: banksError } = await supabase
      .from('banks')
      .select('*')
      .limit(5);
 
    if (banksError) {
      console.log('❌ Error:', banksError.message);
    } else {
      console.log(JSON.stringify(banks, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
 
showData();