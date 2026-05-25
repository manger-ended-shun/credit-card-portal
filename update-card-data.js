// update-card-data.js
// Scrapes Indian credit card data from bank websites (primary) and aggregators (fallback)
// Uses Playwright for JS-heavy sites. Upserts into Supabase daily via GitHub Action.

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');

// ─── ENV CHECK ────────────────────────────────────────────────────────────────
console.log('🔍 Checking environment variables...');
console.log('SUPABASE_URL         :', process.env.NEXT_PUBLIC_SUPABASE_URL      ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY    :', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_KEY :', process.env.SUPABASE_SERVICE_ROLE_KEY     ? '✅ Set' : '❌ Missing');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const sleep = ms => new Promise(r => setTimeout(r, ms));

const safeFloat = v => {
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
};

function parseFee(str) {
  if (!str) return null;
  if (/nil|free|zero|no.*fee|lifetime/i.test(str)) return 0;
  const m = str.match(/[\d,]+/);
  return m ? safeFloat(m[0].replace(/,/g, '')) : null;
}

function detectTier(name = '', fee = 0) {
  const n = name.toLowerCase();
  if (/infinit|reserve|centurion|world elite|diners black|magnus/i.test(n) || fee >= 10000) return 'Super Premium';
  if (/platinum|gold|elite|prestige|privilege|regalia|emeralde|sapphiro/i.test(n) || fee >= 2500) return 'Premium';
  if (/select|titanium|prime|preferred|millennia|coral|simply|moneyback/i.test(n) || fee >= 500) return 'Mid';
  if (fee === 0 || /lite|basic|entry|student|instant|neo|811/i.test(n)) return 'Entry';
  return 'Mid';
}

function detectNetwork(name = '', hint = '') {
  const s = (name + ' ' + hint).toLowerCase();
  if (/rupay/i.test(s))             return 'RuPay';
  if (/mastercard|master card/i.test(s)) return 'Mastercard';
  if (/amex|american express/i.test(s))  return 'Amex';
  if (/diners/i.test(s))            return 'Diners';
  return 'Visa';
}

function guessBank(name = '') {
  const n = name.toLowerCase();
  if (/\bhdfc\b/i.test(n))                return 'HDFC Bank';
  if (/\bsbi\b/i.test(n))                 return 'SBI Card';
  if (/\bicici\b/i.test(n))               return 'ICICI Bank';
  if (/\baxis\b/i.test(n))                return 'Axis Bank';
  if (/\bkotak\b/i.test(n))               return 'Kotak Mahindra Bank';
  if (/yes bank|yesbank/i.test(n))        return 'Yes Bank';
  if (/indusind/i.test(n))                return 'IndusInd Bank';
  if (/\brbl\b/i.test(n))                 return 'RBL Bank';
  if (/idfc/i.test(n))                    return 'IDFC FIRST Bank';
  if (/standard chartered|sc bank/i.test(n)) return 'Standard Chartered';
  if (/amex|american express/i.test(n))   return 'American Express';
  if (/\bbob\b|bank of baroda/i.test(n))  return 'Bank of Baroda';
  if (/canara/i.test(n))                  return 'Canara Bank';
  if (/federal/i.test(n))                 return 'Federal Bank';
  if (/au small|au bank/i.test(n))        return 'AU Small Finance Bank';
  if (/\bhsbc\b/i.test(n))                return 'HSBC';
  if (/citi(bank)?/i.test(n))             return 'Citibank';
  return 'Unknown Bank';
}

function deduplicateCards(cards) {
  const seen = new Map();
  for (const c of cards) {
    const key = `${c.card_name}__${c.bank_name}`.toLowerCase().trim();
    if (!seen.has(key)) seen.set(key, c);
  }
  return [...seen.values()];
}

/**
 * The core filter — rejects anything that is NOT a credit card product name.
 * Rules:
 *  - Must be 5–80 characters
 *  - Must NOT start with a digit or punctuation (FAQ numbering like "1.", "2.")
 *  - Must NOT contain question marks (FAQ items)
 *  - Must NOT look like a sentence (>6 words is almost certainly a heading/tip/blog)
 *  - Must NOT be a generic nav/UI label
 *  - Must contain at least one card-name keyword OR the bank name
 */
const JUNK_PHRASES = [
  /^(about|download|contact|login|apply|home|menu|search|skip|back|next|prev|close|share|follow|subscribe|read more|learn more|know more|view all|see all|click here|find out|explore|discover|get started|check now|apply now|compare now)/i,
  /^(tips?|how to|what (is|are|to)|why |when |where |can i|should i|do i|is it|are there)/i,
  /shareholders?/i,
  /privacy policy|terms|cookie|sitemap|disclaimer|feedback|grievance|nodal/i,
  /blog|article|news|press release|announcement/i,
  /^(\d+)\./,           // FAQ numbered items like "1. How to..."
  /\?$/,                // ends with question mark
  /international transaction fees?/i,
  /billing cycle/i,
  /reward points and how/i,
  /block.*card|lost.*card|stolen/i,
  /credit (utilisation|score|limit|bill)/i,
  /recurring payment/i,
  /festive season/i,
];

const CARD_KEYWORDS = [
  /credit card/i,
  /\b(visa|mastercard|rupay|diners|amex)\b/i,
  /\b(platinum|gold|silver|titanium|elite|classic|premium|select|signature|infinite|reserve|privilege|prestige|regalia|magna|magnus|infinia|emeralde|sapphiro|rubyx|coral|millennia|moneyback|cashback|rewards?|travel|fuel|shopping|lifestyle|women|student|secured)\b/i,
  /\b(black|white|blue|green|red|purple)\b/i,  // many cards use colour names
  /\b(pro|plus|lite|max|prime|ace|uno|neo|zen)\b/i,
];

function isValidCardName(name, bankName = '') {
  if (!name || typeof name !== 'string') return false;
  const t = name.trim();
  if (t.length < 5 || t.length > 80) return false;

  // Reject junk patterns
  for (const p of JUNK_PHRASES) {
    if (p.test(t)) return false;
  }

  // Reject if too many words (sentences/tips)
  const wordCount = t.split(/\s+/).length;
  if (wordCount > 7) return false;

  // Accept if contains a card keyword
  for (const p of CARD_KEYWORDS) {
    if (p.test(t)) return true;
  }

  // Accept if the bank name is embedded (e.g. "HDFC Regalia")
  if (bankName && new RegExp(bankName.split(' ')[0], 'i').test(t)) return true;

  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BROWSER FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

async function launchBrowser() {
  return chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
}

async function newPage(browser) {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-IN,en;q=0.9' });
  await page.setViewportSize({ width: 1280, height: 900 });
  return page;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BANK SCRAPERS  — each uses specific product-card selectors, NOT generic h2/h3
// ═══════════════════════════════════════════════════════════════════════════════

// ─── HDFC ─────────────────────────────────────────────────────────────────────
async function scrapeHDFC(browser) {
  console.log('  🏦 Scraping HDFC Bank...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.hdfcbank.com/personal/pay/cards/credit-cards', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    // HDFC renders cards in product tiles — target only those containers
    const items = await page.$$eval(
      [
        '.product-card .product-title',
        '.card-product-name',
        '[class*="ProductCard"] h3',
        '[class*="ProductCard"] h4',
        '[class*="product-name"]',
        '.card-listing-item h3',
        '.card-listing-item h4',
        'a[href*="credit-card"] h3',
        'a[href*="credit-card"] h4',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'HDFC')) continue;
      const fee = null;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'HDFC Bank',
        card_type: 'credit',
        card_network: detectNetwork(item.name),
        card_tier: detectTier(item.name, fee),
        annual_fee: fee,
        joining_fee: fee,
        source_url: item.href || 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
        is_popular: /infinia|regalia|millennia|diners|moneyback/i.test(item.name)
      });
    }
    console.log(`     ✅ HDFC: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  HDFC failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ─── SBI ──────────────────────────────────────────────────────────────────────
async function scrapeSBI(browser) {
  console.log('  🏦 Scraping SBI Card...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.sbicard.com/en/personal/credit-cards.page', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    const items = await page.$$eval(
      [
        '.card-name',
        '.cardName',
        '[class*="card-name"]',
        '[class*="cardName"]',
        '.product-title',
        '[class*="product-title"]',
        '.card-item h3',
        '.card-item h4',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'SBI')) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'SBI Card',
        card_type: 'credit',
        card_network: detectNetwork(item.name),
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.sbicard.com/en/personal/credit-cards.page',
        is_popular: /elite|prime|cashback|miles|pulse/i.test(item.name)
      });
    }
    console.log(`     ✅ SBI: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  SBI failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ─── ICICI ────────────────────────────────────────────────────────────────────
async function scrapeICICI(browser) {
  console.log('  🏦 Scraping ICICI Bank...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.icicibank.com/card/credit-card', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    const items = await page.$$eval(
      [
        '.card-name',
        '.cardName',
        '[class*="CardName"]',
        '[class*="card-name"]',
        '[class*="product-name"]',
        '.product-title',
        '.card-item h3',
        '.card-item h4',
        '[class*="CreditCard"] h3',
        '[class*="CreditCard"] h4',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'ICICI')) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'ICICI Bank',
        card_type: 'credit',
        card_network: detectNetwork(item.name),
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.icicibank.com/card/credit-card',
        is_popular: /amazon|emeralde|sapphiro|rubyx|coral|manchester/i.test(item.name)
      });
    }
    console.log(`     ✅ ICICI: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  ICICI failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ─── AXIS ─────────────────────────────────────────────────────────────────────
async function scrapeAxis(browser) {
  console.log('  🏦 Scraping Axis Bank...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.axisbank.com/retail/cards/credit-card', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    const items = await page.$$eval(
      [
        '.card-name',
        '.cardName',
        '[class*="card-name"]',
        '[class*="cardName"]',
        '[class*="CardName"]',
        '.product-name',
        '[class*="product-name"]',
        '.card-product h3',
        '.card-product h4',
        '[class*="CardProduct"] h3',
        '[class*="CardProduct"] h4',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'Axis')) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'Axis Bank',
        card_type: 'credit',
        card_network: detectNetwork(item.name),
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.axisbank.com/retail/cards/credit-card',
        is_popular: /magnus|flipkart|neo|select|privilege|atlas/i.test(item.name)
      });
    }
    console.log(`     ✅ Axis: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Axis failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ─── KOTAK ────────────────────────────────────────────────────────────────────
async function scrapeKotak(browser) {
  console.log('  🏦 Scraping Kotak Mahindra Bank...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.kotak.com/en/personal-banking/cards/credit-cards.html', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    const items = await page.$$eval(
      [
        '.card-name', '.cardName',
        '[class*="card-name"]', '[class*="cardName"]',
        '.product-title', '[class*="product-title"]',
        '.card-item h3', '.card-item h4',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'Kotak')) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'Kotak Mahindra Bank',
        card_type: 'credit',
        card_network: detectNetwork(item.name),
        card_tier: detectTier(item.name),
        annual_fee: null, joining_fee: null,
        source_url: item.href || 'https://www.kotak.com/en/personal-banking/cards/credit-cards.html',
        is_popular: /white|league|royale|zen/i.test(item.name)
      });
    }
    console.log(`     ✅ Kotak: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Kotak failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ─── YES BANK ─────────────────────────────────────────────────────────────────
async function scrapeYesBank(browser) {
  console.log('  🏦 Scraping Yes Bank...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.yesbank.in/personal-banking/yes-individual/cards/credit-cards', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    const items = await page.$$eval(
      [
        '.card-name', '.cardName', '[class*="card-name"]',
        '.product-title', '.card-item h3', '.card-item h4',
        '[class*="product-name"]',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'Yes')) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'Yes Bank',
        card_type: 'credit',
        card_network: detectNetwork(item.name),
        card_tier: detectTier(item.name),
        annual_fee: null, joining_fee: null,
        source_url: item.href || 'https://www.yesbank.in/personal-banking/yes-individual/cards/credit-cards',
        is_popular: /marquee|premia|reserv/i.test(item.name)
      });
    }
    console.log(`     ✅ Yes Bank: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Yes Bank failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ─── INDUSIND ─────────────────────────────────────────────────────────────────
async function scrapeIndusInd(browser) {
  console.log('  🏦 Scraping IndusInd Bank...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.indusind.com/in/en/personal/cards/credit-card.html', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    const items = await page.$$eval(
      [
        '.card-name', '.cardName', '[class*="card-name"]',
        '.product-title', '.card-item h3', '.card-item h4',
        '[class*="CardTitle"]', '[class*="cardTitle"]',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'IndusInd')) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'IndusInd Bank',
        card_type: 'credit',
        card_network: detectNetwork(item.name),
        card_tier: detectTier(item.name),
        annual_fee: null, joining_fee: null,
        source_url: item.href || 'https://www.indusind.com/in/en/personal/cards/credit-card.html',
        is_popular: /legend|pioneer|pinnacle|celesta/i.test(item.name)
      });
    }
    console.log(`     ✅ IndusInd: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  IndusInd failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ─── RBL ──────────────────────────────────────────────────────────────────────
async function scrapeRBL(browser) {
  console.log('  🏦 Scraping RBL Bank...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.rblbank.com/cards/credit-cards', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    const items = await page.$$eval(
      [
        '.card-name', '.cardName', '[class*="card-name"]',
        '.product-title', '.card-item h3', '.card-item h4',
        '[class*="product-name"]',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'RBL')) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'RBL Bank',
        card_type: 'credit',
        card_network: detectNetwork(item.name),
        card_tier: detectTier(item.name),
        annual_fee: null, joining_fee: null,
        source_url: item.href || 'https://www.rblbank.com/cards/credit-cards',
        is_popular: /shoprite|play|icon|insignia/i.test(item.name)
      });
    }
    console.log(`     ✅ RBL: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  RBL failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ─── IDFC FIRST ───────────────────────────────────────────────────────────────
async function scrapeIDFC(browser) {
  console.log('  🏦 Scraping IDFC FIRST Bank...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.idfcfirstbank.com/credit-card', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    const items = await page.$$eval(
      [
        '.card-name', '.cardName', '[class*="card-name"]', '[class*="cardName"]',
        '[class*="CardName"]', '.product-title', '[class*="product-name"]',
        '.card-item h3', '.card-item h4',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'IDFC')) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'IDFC FIRST Bank',
        card_type: 'credit',
        card_network: detectNetwork(item.name),
        card_tier: detectTier(item.name),
        annual_fee: null, joining_fee: null,
        source_url: item.href || 'https://www.idfcfirstbank.com/credit-card',
        is_popular: /wealth|select|classic|millennia|first/i.test(item.name)
      });
    }
    console.log(`     ✅ IDFC FIRST: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  IDFC FIRST failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ─── STANDARD CHARTERED ───────────────────────────────────────────────────────
async function scrapeSC(browser) {
  console.log('  🏦 Scraping Standard Chartered...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.sc.com/in/credit-cards/', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    const items = await page.$$eval(
      [
        '.card-name', '[class*="card-name"]', '[class*="cardName"]',
        '.product-title', '.card-item h3', '.card-item h4',
        '[class*="product-name"]',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'Standard')) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'Standard Chartered',
        card_type: 'credit',
        card_network: detectNetwork(item.name),
        card_tier: detectTier(item.name),
        annual_fee: null, joining_fee: null,
        source_url: item.href || 'https://www.sc.com/in/credit-cards/',
        is_popular: /smart|manhattan|ultimate|platinum rewards/i.test(item.name)
      });
    }
    console.log(`     ✅ Standard Chartered: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Standard Chartered failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ─── AMEX ─────────────────────────────────────────────────────────────────────
async function scrapeAmex(browser) {
  console.log('  🏦 Scraping American Express India...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.americanexpress.com/en-in/credit-cards/', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    const items = await page.$$eval(
      [
        '[class*="card-name"]', '[class*="cardName"]', '[class*="CardName"]',
        '[data-testid*="card-name"]', '[data-testid*="cardName"]',
        '.product-title', '[class*="product-name"]',
        '[class*="CardTitle"]', '[class*="card-title"]',
      ].join(','),
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name, 'American Express')) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'American Express',
        card_type: 'credit',
        card_network: 'Amex',
        card_tier: detectTier(item.name),
        annual_fee: null, joining_fee: null,
        source_url: item.href || 'https://www.americanexpress.com/en-in/credit-cards/',
        is_popular: /platinum|gold|membership|mrcc|everyday/i.test(item.name)
      });
    }
    console.log(`     ✅ Amex: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Amex failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AGGREGATOR SCRAPERS — CardInsider, Paisabazaar, BankBazaar
//  These use structured listing pages with known card-specific selectors
// ═══════════════════════════════════════════════════════════════════════════════

async function scrapeCardInsider(browser) {
  console.log('  📋 Scraping CardInsider...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.cardinsider.com/credit-cards/', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(2000);

    const items = await page.$$eval(
      '.card-name, .credit-card-name, [class*="card-name"], [class*="CardName"], .cc-name, h3.name, h4.name',
      els => els.map(el => {
        const card = el.closest('[class*="card-item"], [class*="card-listing"], article, .cc-card') || el.parentElement;
        return {
          name:    el.innerText?.trim(),
          bank:    card?.querySelector('[class*="bank"], [class*="issuer"], .bank-name')?.innerText?.trim() || '',
          fee:     card?.querySelector('[class*="fee"], [class*="annual"]')?.innerText?.trim() || '',
          href:    card?.querySelector('a')?.href || el.closest('a')?.href || '',
          network: card?.querySelector('[class*="network"], [class*="visa"], [class*="master"], [class*="rupay"]')?.innerText?.trim() || ''
        };
      })
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name)) continue;
      const fee = parseFee(item.fee);
      cards.push({
        card_name:    item.name.replace(/\s+/g, ' ').trim(),
        bank_name:    item.bank || guessBank(item.name),
        card_type:    'credit',
        card_network: detectNetwork(item.name, item.network),
        card_tier:    detectTier(item.name, fee),
        annual_fee:   fee,
        joining_fee:  fee,
        source_url:   item.href || 'https://www.cardinsider.com/credit-cards/',
        is_popular:   false
      });
    }
    console.log(`     ✅ CardInsider: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  CardInsider failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

async function scrapePaisabazaar(browser) {
  console.log('  📋 Scraping Paisabazaar...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.paisabazaar.com/credit-card/', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(2000);

    const items = await page.$$eval(
      '[class*="card-name"], [class*="cardName"], [class*="CardName"], .cc-name, .credit-card-name',
      els => els.map(el => {
        const card = el.closest('[class*="card-item"], [class*="cardItem"], .cc-card, article') || el.parentElement;
        return {
          name: el.innerText?.trim(),
          bank: card?.querySelector('[class*="bank"], [class*="issuer"]')?.innerText?.trim() || '',
          fee:  card?.querySelector('[class*="fee"], [class*="annual"]')?.innerText?.trim() || '',
          href: card?.querySelector('a')?.href || el.closest('a')?.href || ''
        };
      })
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name)) continue;
      const fee = parseFee(item.fee);
      cards.push({
        card_name:    item.name.replace(/\s+/g, ' ').trim(),
        bank_name:    item.bank || guessBank(item.name),
        card_type:    'credit',
        card_network: detectNetwork(item.name),
        card_tier:    detectTier(item.name, fee),
        annual_fee:   fee,
        joining_fee:  fee,
        source_url:   item.href || 'https://www.paisabazaar.com/credit-card/',
        is_popular:   false
      });
    }
    console.log(`     ✅ Paisabazaar: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Paisabazaar failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

async function scrapeBankBazaar(browser) {
  console.log('  📋 Scraping BankBazaar...');
  const cards = [];
  const page = await newPage(browser);
  try {
    await page.goto('https://www.bankbazaar.com/credit-card.html', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(2000);

    const items = await page.$$eval(
      '[class*="card-name"], [class*="cardName"], [class*="CardName"], .credit-card-name, .cc-name',
      els => els.map(el => {
        const card = el.closest('[class*="card"], article, .product-card') || el.parentElement;
        return {
          name: el.innerText?.trim(),
          bank: card?.querySelector('[class*="bank"], [class*="provider"]')?.innerText?.trim() || '',
          fee:  card?.querySelector('[class*="fee"]')?.innerText?.trim() || '',
          href: card?.querySelector('a')?.href || el.closest('a')?.href || ''
        };
      })
    ).catch(() => []);

    for (const item of items) {
      if (!isValidCardName(item.name)) continue;
      const fee = parseFee(item.fee);
      cards.push({
        card_name:    item.name.replace(/\s+/g, ' ').trim(),
        bank_name:    item.bank || guessBank(item.name),
        card_type:    'credit',
        card_network: detectNetwork(item.name),
        card_tier:    detectTier(item.name, fee),
        annual_fee:   fee,
        joining_fee:  fee,
        source_url:   item.href || 'https://www.bankbazaar.com/credit-card.html',
        is_popular:   false
      });
    }
    console.log(`     ✅ BankBazaar: ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  BankBazaar failed: ${e.message}`);
  } finally { await page.close(); }
  return cards;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUPABASE UPSERT
// ═══════════════════════════════════════════════════════════════════════════════

async function upsertCards(cards) {
  let inserted = 0, updated = 0, failed = 0;

  for (const card of cards) {
    if (!card.card_name || card.card_name.length < 4) { failed++; continue; }
    if (card.bank_name === 'Unknown Bank') { failed++; continue; }

    const payload = {
      card_name:                    card.card_name,
      bank_name:                    card.bank_name,
      card_type:                    card.card_type    || 'credit',
      card_network:                 card.card_network || null,
      card_tier:                    card.card_tier    || null,
      annual_fee:                   card.annual_fee   ?? null,
      joining_fee:                  card.joining_fee  ?? null,
      annual_fee_waiver_conditions: card.annual_fee_waiver_conditions || null,
      reward_type:                  card.reward_type  || null,
      base_reward_rate:             card.base_reward_rate ?? null,
      category_rewards:             card.category_rewards || null,
      domestic_lounge_access:       card.domestic_lounge_access    ?? null,
      international_lounge_access:  card.international_lounge_access ?? null,
      min_income_monthly:           card.min_income_monthly ?? null,
      min_credit_score:             card.min_credit_score   ?? null,
      age_min:                      card.age_min ?? null,
      age_max:                      card.age_max ?? null,
      is_popular:                   card.is_popular ?? false,
      is_active:                    true,
      source_url:                   card.source_url || null,
      last_updated:                 new Date().toISOString()
    };

    const { data: existing, error: fetchErr } = await supabase
      .from('cards')
      .select('id')
      .eq('card_name', card.card_name)
      .eq('bank_name', card.bank_name)
      .maybeSingle();

    if (fetchErr) {
      console.warn(`  ⚠️  Fetch error for ${card.card_name}: ${fetchErr.message}`);
      failed++;
      continue;
    }

    if (existing) {
      const { error: upErr } = await supabase.from('cards').update(payload).eq('id', existing.id);
      if (upErr) { console.warn(`  ❌ Update failed ${card.card_name}: ${upErr.message}`); failed++; }
      else updated++;
    } else {
      const { error: insErr } = await supabase.from('cards').insert(payload);
      if (insErr) { console.warn(`  ❌ Insert failed ${card.card_name}: ${insErr.message}`); failed++; }
      else inserted++;
    }
  }

  return { inserted, updated, failed };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n🚀 Starting full India credit card data update...');
  console.log(`📅 ${new Date().toISOString()}\n`);

  // First: mark all existing cards inactive — we'll re-activate ones we find
  // This ensures cards no longer offered get retired automatically
  await supabase.from('cards').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('🔄 Marked existing cards inactive (will re-activate found cards)\n');

  const browser = await launchBrowser();
  let allCards = [];

  try {
    console.log('═══ PHASE 1: Bank Websites ═══');
    const bankResults = await Promise.allSettled([
      scrapeHDFC(browser),
      scrapeSBI(browser),
      scrapeICICI(browser),
      scrapeAxis(browser),
      scrapeKotak(browser),
      scrapeYesBank(browser),
      scrapeIndusInd(browser),
      scrapeRBL(browser),
      scrapeIDFC(browser),
      scrapeSC(browser),
      scrapeAmex(browser)
    ]);
    for (const r of bankResults) {
      if (r.status === 'fulfilled') allCards.push(...r.value);
    }
    console.log(`\n📦 Phase 1 subtotal: ${allCards.length} cards from bank sites\n`);

    console.log('═══ PHASE 2: Aggregator Sites ═══');
    const aggResults = await Promise.allSettled([
      scrapeCardInsider(browser),
      scrapePaisabazaar(browser),
      scrapeBankBazaar(browser)
    ]);
    for (const r of aggResults) {
      if (r.status === 'fulfilled') allCards.push(...r.value);
    }
    console.log(`\n📦 Phase 2 subtotal (before dedup): ${allCards.length} cards\n`);

  } finally {
    await browser.close();
  }

  console.log('═══ PHASE 3: Deduplication & Validation ═══');
  const unique = deduplicateCards(allCards);
  console.log(`✅ Unique valid cards: ${unique.length}\n`);

  console.log('═══ PHASE 4: Upserting to Supabase ═══');
  const { inserted, updated, failed } = await upsertCards(unique);

  console.log('\n════════════════════════════════════════');
  console.log('✅ Update complete!');
  console.log(`   Unique cards processed : ${unique.length}`);
  console.log(`   Inserted (new)         : ${inserted}`);
  console.log(`   Updated (existing)     : ${updated}`);
  console.log(`   Failed / skipped       : ${failed}`);
  console.log('════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
