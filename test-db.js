// test-db.js
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
 
const { createClient } = require('@supabase/supabase-js');
 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 
console.log('🔍 Environment Variables:');
console.log('  URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('  Key:', supabaseKey ? '✅ Set' : '❌ Missing');
console.log();
 
const supabase = createClient(supabaseUrl, supabaseKey);
 
async function testDatabase() {
  console.log('🔍 Testing Database Connection...\n');
 
  try {
    // Test 1: Try to query cards table
    console.log('📋 Testing cards table...');
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('count')
      .single();
 
    if (cardsError) {
      console.log('⚠️  Cards table query failed:', cardsError.message);
    } else {
      console.log('✅ Cards table exists! Total cards:', cards.count);
    }
 
    // Test 2: Try to query offers table
    console.log('\n📋 Testing offers table...');
    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select('count')
      .single();
 
    if (offersError) {
      console.log('⚠️  Offers table query failed:', offersError.message);
    } else {
      console.log('✅ Offers table exists! Total offers:', offers.count);
    }
 
    // Test 3: Try to query banks table
    console.log('\n📋 Testing banks table...');
    const { data: banks, error: banksError } = await supabase
      .from('banks')
      .select('count')
      .single();
 
    if (banksError) {
      console.log('⚠️  Banks table query failed:', banksError.message);
    } else {
      console.log('✅ Banks table exists! Total banks:', banks.count);
    }
 
    console.log('\n✅ Database connection successful!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}
 
testDatabase();