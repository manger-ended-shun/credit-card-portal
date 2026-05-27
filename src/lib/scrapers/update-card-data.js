const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Go up three levels to reach the root where .env.local resides
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Load sources relative to this file
const sourcesPath = path.join(__dirname, 'sources.json');
const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));

async function parseWithGroq(text, url) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{
          role: "system",
          content: `Extract credit card data into this strict JSON. Ensure numeric values for fees/rates.
          { "card_name": "string", "bank_name": "string", "annual_fee": number, "base_reward_rate": number, "earn_accelerated": "string", "best_use": "string", "transfer_partners": "string", "earn_exclusions": "string", "domestic_lounge_access": number }`
        }, { role: "user", content: `Extract from this page: ${url}\n\nContent: ${text.substring(0, 8000)}` }],
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error(`❌ Groq failed for ${url}`);
    return null;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const allUrls = new Set();

  console.log('🔍 Discovery Phase: Scanning sources...');
  for (const source of sources) {
    try {
      await page.goto(source, { waitUntil: 'networkidle', timeout: 60000 });
      const links = await page.evaluate(() => 
        Array.from(document.querySelectorAll('a[href*="/credit-card/"]')).map(a => a.href)
      );
      links.forEach(l => allUrls.add(l));
    } catch (e) { console.warn(`⚠️ Could not scrape source: ${source}`); }
  }

  console.log(`🚀 Found ${allUrls.size} unique cards. Starting Extraction...`);

  for (const url of Array.from(allUrls).slice(0, 20)) { 
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const text = await page.innerText('body');
      const data = await parseWithGroq(text, url);
      
      if (data) {
        await supabase.from('cards').upsert({
          ...data,
          last_updated: new Date().toISOString()
        }, { onConflict: 'card_name' });
        console.log(`✅ Synced: ${data.card_name}`);
      }
    } catch (e) {
      console.error(`❌ Failed processing: ${url}`);
    }
  }
  await browser.close();
}

main();