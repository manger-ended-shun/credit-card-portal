// scripts/scrape-offers.ts
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Using relative paths to ensure standalone execution works flawlessly
import { scrapeRSS, isRelevantOffer } from '../src/lib/scrapers/engine';
import { scrapeNetworkPortal } from '../src/lib/scrapers/networkPortals';

// Dynamically target the .env.local file at the root of your project
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("🚨 FATAL ERROR: Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runScraper() {
  console.log("🚀 Starting Offers Scraper Job...\n");

  // Core execution limit to prevent rate-throttling blocks
  const { data: lastRun } = await supabase
    .from('scraper_logs')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (lastRun && lastRun.length > 0) {
    const hoursSinceRun = (new Date().getTime() - new Date(lastRun[0].created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceRun < 0.05) {
      console.log("⏳ Throttled to protect source server metrics. Try again later.");
      process.exit(0);
    }
  }

  const rssSources = [
    { name: 'BoardingArea', url: 'https://boardingarea.com/feed/' },
    { name: 'LiveFromALounge', url: 'https://livefromalounge.com/feed/' }
  ];

  try {
    console.log("📡 Fetching data from RSS and Network Portals...");
    const [rssResults, mastercardOffers, visaOffers] = await Promise.all([
      Promise.all(rssSources.map(s => scrapeRSS(s.url, s.name))),
      scrapeNetworkPortal('https://specials.priceless.com/en-in/categories', 'Mastercard'),
      scrapeNetworkPortal('https://www.visa.co.in/en_in/visa-offers-and-perks/', 'Visa')
    ]);

    const processedRssOffers = rssResults.flat()
      .filter(offer => isRelevantOffer(offer.title, offer.description))
      .map(offer => ({
        title: offer.title,
        description: offer.description,
        source: offer.source,
        source_url: offer.source_url,
        validity_date: 'See article for details',
        card_variant: 'All Variants',
        created_at: new Date().toISOString()
      }));

    const combinedOffers = [...processedRssOffers, ...mastercardOffers, ...visaOffers];

    if (combinedOffers.length === 0) {
      console.log("✅ No operational structural updates or new offers identified.");
      process.exit(0);
    }

    const { data: existingRecords } = await supabase.from('card_offers').select('title');
    const duplicateTitles = existingRecords?.map(item => item.title) || [];
    
    const finalPayload = combinedOffers.filter(item => !duplicateTitles.includes(item.title));

    if (finalPayload.length > 0) {
      console.log(`💾 Inserting ${finalPayload.length} new unique offers into the database...`);
      await supabase.from('card_offers').insert(finalPayload);
      await supabase.from('scraper_logs').insert([{ created_at: new Date().toISOString() }]);
    } else {
      console.log("✅ No new unique offers found (all scraped offers are already in the database).");
    }

    console.log("\n🎉 Scraper Job Complete!");
    console.log(`📊 Breakdown: newly_added: ${finalPayload.length} | total_scraped: ${combinedOffers.length}`);
    console.log(`   - RSS: ${processedRssOffers.length} | Mastercard: ${mastercardOffers.length} | Visa: ${visaOffers.length}`);

    process.exit(0);

  } catch (error: any) {
    console.error("❌ Scraper encountered a fatal error:", error.message);
    process.exit(1);
  }
}

runScraper();