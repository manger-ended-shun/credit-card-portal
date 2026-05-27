import Parser from 'rss-parser';

const parser = new Parser();

export async function scrapeRSS(url: string, sourceName: string) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map(item => ({
      title: item.title || 'Untitled Offer',
      description: item.contentSnippet?.substring(0, 150) + "..." || 'No description available',
      source: sourceName,
      source_url: item.link || url,
    }));
  } catch (error) {
    console.error(`Error scraping ${sourceName}:`, error);
    return [];
  }
}

const FOREIGN_BANKS_TO_EXCLUDE = [
  'chase', 'capital one', 'us bank', 'discover', 'wells fargo', 'bank of america', 'ally bank'
];

// src/lib/scrapers/engine.ts

export function isRelevantOffer(title: string, description: string): boolean {
  const content = (title + ' ' + description).toLowerCase();
  
  // Must contain at least one of these financial/card keywords
  const requiredKeywords = [
    'credit card', 'debit card', 'amex', 'hdfc', 'sbi', 'icici', 'axis', 
    'cashback', 'reward points', 'transfer bonus', 'welcome bonus', 'devaluation'
  ];

  // Must NOT contain these generic travel/news keywords
  const junkKeywords = [
    'pilot', 'strike', 'baby', 'murder', 'politics', 'coach seat', 'incident'
  ];

  const hasRequired = requiredKeywords.some(keyword => content.includes(keyword));
  const hasJunk = junkKeywords.some(keyword => content.includes(keyword));

  return hasRequired && !hasJunk;
}