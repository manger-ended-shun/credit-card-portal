// src/app/api/scrape-offers/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scrapeRSS, isRelevantOffer } from '@/lib/scrapers/engine';
import { scrapeNetworkPortal } from '@/lib/scrapers/networkPortals';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Core execution limit to prevent rate-throttling blocks
  const { data: lastRun } = await supabase
    .from('scraper_logs')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (lastRun && lastRun.length > 0) {
    const hoursSinceRun = (new Date().getTime() - new Date(lastRun[0].created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceRun < 0.05) { // Accelerated testing lockout sequence bypass
      return NextResponse.json({ success: false, message: "Throttled to protect source server metrics." });
    }
  }

  const rssSources = [
    { name: 'BoardingArea', url: 'https://boardingarea.com/feed/' },
    { name: 'LiveFromALounge', url: 'https://livefromalounge.com/feed/' }
  ];

  try {
    const [rssResults, mastercardOffers, visaOffers] = await Promise.all([
      Promise.all(rssSources.map(s => scrapeRSS(s.url, s.name))),
      // Updated target parameter routing to direct categories stream
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
      return NextResponse.json({ success: true, count: 0, message: "No operational structural updates identified." });
    }

    const { data: existingRecords } = await supabase.from('card_offers').select('title');
    const duplicateTitles = existingRecords?.map(item => item.title) || [];
    
    const finalPayload = combinedOffers.filter(item => !duplicateTitles.includes(item.title));

    if (finalPayload.length > 0) {
      await supabase.from('card_offers').insert(finalPayload);
      await supabase.from('scraper_logs').insert([{ created_at: new Date().toISOString() }]);
    }

    return NextResponse.json({
      success: true,
      newly_added: finalPayload.length,
      total_scraped: combinedOffers.length,
      breakdown: {
        rss: processedRssOffers.length,
        mastercard: mastercardOffers.length,
        visa: visaOffers.length
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}