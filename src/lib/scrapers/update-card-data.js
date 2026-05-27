const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws'); 
const pdf = require('pdf-parse'); 

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: WebSocket } }
);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const sourcesPath = path.join(__dirname, 'sources.json');
const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));

async function fetchAndParsePdf(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer); 
    const data = await pdf(buffer);
    return data.text;
  } catch (e) {
    console.warn(`⚠️ Failed to parse PDF: ${url}`);
    return "";
  }
}

async function parseWithGroq(text, url) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{
          role: "system",
          content: `Extract credit card data into this strict JSON. If the content is not a specific card review, return {"error": "not_a_card"}. 
          Schema: { "card_name": "string", "bank_name": "string", "annual_fee": number, "base_reward_rate": number, "best_use": "string", "transfer_partners": "string", "domestic_lounge_access": number, "international_lounge_access": number, "min_monthly_income": number }`
        }, { role: "user", content: `Extract from this page: ${url}\n\nContent: ${text.substring(0, 20000)}` }], 
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
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

  const cardUrls = Array.from(allUrls).filter(url => 
    !url.includes('/compare') && 
    !url.includes('/best-') && 
    !url.includes('/interest-rates') && 
    !url.includes('/eligibility') &&
    url.endsWith('/')
  );

  console.log(`🚀 Found ${cardUrls.length} potential cards. Starting Extraction...`);

  for (const url of cardUrls.slice(0, 20)) { 
    try {
      console.log(`📄 Processing: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      let fullText = await page.innerText('body');

      const pdfLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(href => href.toLowerCase().includes('mitc') || href.toLowerCase().endsWith('.pdf'));
      });

      if (pdfLinks.length > 0) {
        console.log(`📎 Found PDF document: ${pdfLinks[0]}`);
        const pdfText = await fetchAndParsePdf(pdfLinks[0]);
        fullText += "\n\n--- ADDITIONAL PDF DOC TEXT ---\n\n" + pdfText;
      }

      const data = await parseWithGroq(fullText, url);
      
      if (data && !data.error) {
        await supabase.from('cards').upsert({ ...data, last_updated: new Date().toISOString() }, { onConflict: 'card_name' });
        console.log(`✅ Synced: ${data.card_name}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (e) {
      console.error(`❌ Failed processing: ${url}`);
    }
  }
  await browser.close();
}

main();