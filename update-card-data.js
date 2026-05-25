// update-card-data.js
// Scrapes Indian credit card data from bank websites (primary) and aggregators (fallback)
// Uses Playwright for JS-heavy sites. Upserts into Supabase daily via GitHub Action.

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');

// ─── ENV CHECK ────────────────────────────────────────────────────────────────
console.log('🔍 Checking environment variables...');
console.log('SUPABASE_URL          :', process.env.NEXT_PUBLIC_SUPABASE_URL       ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY     :', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_KEY  :', process.env.SUPABASE_SERVICE_ROLE_KEY      ? '✅ Set' : '❌ Missing');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Sleep for ms milliseconds */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Safe parseInt — returns null on failure */
const safeInt = v => { const n = parseInt(v); return isNaN(n) ? null : n; };

/** Safe parseFloat — returns null on failure */
const safeFloat = v => { const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? null : n; };

/** Normalise fee strings like "₹2,500 + GST" → 2500 */
function parseFee(str) {
  if (!str) return null;
  if (/nil|free|zero|no.*fee/i.test(str)) return 0;
  const m = str.match(/[\d,]+/);
  return m ? safeFloat(m[0].replace(/,/g, '')) : null;
}

/** Best-effort tier detection from card name / description */
function detectTier(name = '', fee = 0) {
  const n = name.toLowerCase();
  if (/infinit|reserve|signature|world elite|centurion/i.test(n) || fee >= 10000) return 'Super Premium';
  if (/platinum|gold|elite|preferred|prestige|privilege|magnus|regalia/i.test(n) || fee >= 2500) return 'Premium';
  if (/select|titanium|classic|prime|preferred/i.test(n) || fee >= 500) return 'Mid';
  if (fee === 0 || /lite|basic|entry|student|simply/i.test(n)) return 'Entry';
  return 'Mid';
}

/** Deduplicate cards array by card_name+bank_name */
function deduplicateCards(cards) {
  const seen = new Map();
  for (const c of cards) {
    const key = `${c.card_name}__${c.bank_name}`.toLowerCase();
    if (!seen.has(key)) seen.set(key, c);
  }
  return [...seen.values()];
}

// ─── BROWSER FACTORY ──────────────────────────────────────────────────────────

async function launchBrowser() {
  return chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
}

async function newPage(browser) {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-IN,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  return page;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BANK SCRAPERS  (primary sources)
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
    await sleep(3000);

    const items = await page.$$eval(
      'a[href*="credit-card"], .card-item, .product-card, [class*="creditcard"], [class*="credit-card"]',
      els => els.map(el => ({
        name: el.querySelector('h2,h3,h4,.card-name,.title') ?.innerText?.trim() || el.innerText?.trim(),
        href: el.href || el.querySelector('a')?.href || ''
      }))
    );

    for (const item of items) {
      if (!item.name || item.name.length < 5) continue;
      if (!/credit/i.test(item.href + item.name)) continue;
      const fee = null; // detail pages needed for fee; aggregator will fill
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'HDFC Bank',
        card_type: 'credit',
        card_network: /diners/i.test(item.name) ? 'Diners' : /amex/i.test(item.name) ? 'Amex' : /master/i.test(item.name) ? 'Mastercard' : 'Visa',
        card_tier: detectTier(item.name, fee),
        annual_fee: fee,
        joining_fee: fee,
        source_url: item.href || 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
        is_popular: /infinia|regalia|millennia|diners|moneyback/i.test(item.name)
      });
    }
    console.log(`     ✅ HDFC: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  HDFC scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
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
    await sleep(3000);

    const items = await page.$$eval(
      '.card-item, .product-card, [class*="card-name"], .card-title, h3, h4',
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || el.querySelector('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5 || item.name.length > 80) continue;
      if (!/sbi|card|credit/i.test(item.name + item.href)) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'SBI Card',
        card_type: 'credit',
        card_network: /rupay/i.test(item.name) ? 'RuPay' : /master/i.test(item.name) ? 'Mastercard' : /amex/i.test(item.name) ? 'Amex' : 'Visa',
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.sbicard.com/en/personal/credit-cards.page',
        is_popular: /elite|prime|cashback|miles|pulse/i.test(item.name)
      });
    }
    console.log(`     ✅ SBI: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  SBI scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
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
    await sleep(3000);

    const items = await page.$$eval(
      '.card-name, .cardName, h2, h3, [class*="card-title"], [class*="cardTitle"]',
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5 || item.name.length > 80) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'ICICI Bank',
        card_type: 'credit',
        card_network: /rupay/i.test(item.name) ? 'RuPay' : /master/i.test(item.name) ? 'Mastercard' : /amex/i.test(item.name) ? 'Amex' : 'Visa',
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.icicibank.com/card/credit-card',
        is_popular: /amazon|emeralde|sapphiro|rubyx|coral|manchester/i.test(item.name)
      });
    }
    console.log(`     ✅ ICICI: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  ICICI scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
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
    await sleep(3000);

    const items = await page.$$eval(
      '.card-name, h2, h3, h4, [class*="cardName"], [class*="card-title"]',
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || el.querySelector('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5 || item.name.length > 80) continue;
      if (!/axis|credit|card|magnus|flipkart|neo|select|privilege/i.test(item.name + item.href)) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'Axis Bank',
        card_type: 'credit',
        card_network: /rupay/i.test(item.name) ? 'RuPay' : /master/i.test(item.name) ? 'Mastercard' : /amex/i.test(item.name) ? 'Amex' : 'Visa',
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.axisbank.com/retail/cards/credit-card',
        is_popular: /magnus|flipkart|neo|select|privilege|atlas/i.test(item.name)
      });
    }
    console.log(`     ✅ Axis: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Axis scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
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
    await sleep(3000);

    const items = await page.$$eval(
      'h2, h3, h4, .card-title, [class*="card-name"]',
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || el.querySelector('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5 || item.name.length > 80) continue;
      if (!/kotak|credit|811|white|league|royale|zen|essentia|privy/i.test(item.name + item.href)) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'Kotak Mahindra Bank',
        card_type: 'credit',
        card_network: /rupay/i.test(item.name) ? 'RuPay' : /master/i.test(item.name) ? 'Mastercard' : 'Visa',
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.kotak.com/en/personal-banking/cards/credit-cards.html',
        is_popular: /white|league|royale|zen/i.test(item.name)
      });
    }
    console.log(`     ✅ Kotak: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Kotak scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
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
    await sleep(3000);

    const items = await page.$$eval(
      'h2, h3, h4, .card-title, [class*="card-name"], .product-name',
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || el.querySelector('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5 || item.name.length > 80) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'Yes Bank',
        card_type: 'credit',
        card_network: /rupay/i.test(item.name) ? 'RuPay' : /master/i.test(item.name) ? 'Mastercard' : 'Visa',
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.yesbank.in/personal-banking/yes-individual/cards/credit-cards',
        is_popular: /marquee|premia|reserv/i.test(item.name)
      });
    }
    console.log(`     ✅ Yes Bank: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Yes Bank scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
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
    await sleep(3000);

    const items = await page.$$eval(
      'h2, h3, h4, .card-title, [class*="card-name"]',
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || el.querySelector('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5 || item.name.length > 80) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'IndusInd Bank',
        card_type: 'credit',
        card_network: /rupay/i.test(item.name) ? 'RuPay' : /master/i.test(item.name) ? 'Mastercard' : /amex/i.test(item.name) ? 'Amex' : 'Visa',
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.indusind.com/in/en/personal/cards/credit-card.html',
        is_popular: /legend|pioneer|pinnacle|celesta/i.test(item.name)
      });
    }
    console.log(`     ✅ IndusInd: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  IndusInd scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
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
    await sleep(3000);

    const items = await page.$$eval(
      'h2, h3, h4, .card-title, [class*="card-name"], .product-name',
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || el.querySelector('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5 || item.name.length > 80) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'RBL Bank',
        card_type: 'credit',
        card_network: /rupay/i.test(item.name) ? 'RuPay' : /master/i.test(item.name) ? 'Mastercard' : 'Visa',
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.rblbank.com/cards/credit-cards',
        is_popular: /shoprite|play|icon|insignia/i.test(item.name)
      });
    }
    console.log(`     ✅ RBL: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  RBL scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
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
    await sleep(3000);

    const items = await page.$$eval(
      'h2, h3, h4, .card-title, [class*="cardName"], [class*="card-name"]',
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || el.querySelector('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5 || item.name.length > 80) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'IDFC FIRST Bank',
        card_type: 'credit',
        card_network: /rupay/i.test(item.name) ? 'RuPay' : /master/i.test(item.name) ? 'Mastercard' : 'Visa',
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.idfcfirstbank.com/credit-card',
        is_popular: /wealth|select|classic|millennia|first/i.test(item.name)
      });
    }
    console.log(`     ✅ IDFC FIRST: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  IDFC FIRST scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
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
    await sleep(3000);

    const items = await page.$$eval(
      'h2, h3, h4, .card-name, [class*="card-title"], [class*="cardName"]',
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || el.querySelector('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5 || item.name.length > 80) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'Standard Chartered',
        card_type: 'credit',
        card_network: /master/i.test(item.name) ? 'Mastercard' : /rupay/i.test(item.name) ? 'RuPay' : 'Visa',
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.sc.com/in/credit-cards/',
        is_popular: /smart|manhattan|ultimate|platinum rewards/i.test(item.name)
      });
    }
    console.log(`     ✅ Standard Chartered: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Standard Chartered scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
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
    await sleep(3000);

    const items = await page.$$eval(
      'h2, h3, h4, [class*="card-name"], [class*="cardName"], [data-testid*="card"]',
      els => els.map(el => ({
        name: el.innerText?.trim(),
        href: el.closest('a')?.href || el.querySelector('a')?.href || ''
      }))
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5 || item.name.length > 80) continue;
      cards.push({
        card_name: item.name.replace(/\s+/g, ' ').trim(),
        bank_name: 'American Express',
        card_type: 'credit',
        card_network: 'Amex',
        card_tier: detectTier(item.name),
        annual_fee: null,
        joining_fee: null,
        source_url: item.href || 'https://www.americanexpress.com/en-in/credit-cards/',
        is_popular: /platinum|gold|membership|mrcc|everyday/i.test(item.name)
      });
    }
    console.log(`     ✅ Amex: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Amex scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
  return cards;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AGGREGATOR SCRAPERS  (fallback + fee/reward enrichment)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CARDINSIDER ──────────────────────────────────────────────────────────────
async function scrapeCardInsider(browser) {
  console.log('  📋 Scraping CardInsider (aggregator)...');
  const cards = [];
  const page = await newPage(browser);
  try {
    // CardInsider lists all cards with fees on one page
    await page.goto('https://www.cardinsider.com/credit-cards/', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await sleep(4000);

    // Scroll to load lazy content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(2000);

    const items = await page.$$eval(
      '.card-item, .credit-card-item, [class*="card-listing"], article',
      els => els.map(el => {
        const nameEl   = el.querySelector('h2,h3,h4,.card-name,.cardName,[class*="card-title"]');
        const bankEl   = el.querySelector('.bank-name,.issuer,[class*="bank"]');
        const feeEl    = el.querySelector('.annual-fee,.joining-fee,[class*="fee"]');
        const linkEl   = el.querySelector('a');
        const networkEl= el.querySelector('.network,[class*="network"],[class*="visa"],[class*="master"],[class*="rupay"]');
        return {
          name:    nameEl    ?.innerText?.trim() || '',
          bank:    bankEl    ?.innerText?.trim() || '',
          fee:     feeEl     ?.innerText?.trim() || '',
          href:    linkEl    ?.href              || '',
          network: networkEl ?.innerText?.trim() || ''
        };
      })
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5) continue;
      const fee = parseFee(item.fee);
      cards.push({
        card_name:   item.name.replace(/\s+/g, ' ').trim(),
        bank_name:   item.bank  || guessBank(item.name),
        card_type:   'credit',
        card_network: detectNetwork(item.name, item.network),
        card_tier:   detectTier(item.name, fee),
        annual_fee:  fee,
        joining_fee: fee,
        source_url:  item.href || 'https://www.cardinsider.com/credit-cards/',
        is_popular:  false
      });
    }
    console.log(`     ✅ CardInsider: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  CardInsider scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
  return cards;
}

// ─── PAISABAZAAR ──────────────────────────────────────────────────────────────
async function scrapePaisabazaar(browser) {
  console.log('  📋 Scraping Paisabazaar (aggregator)...');
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
      '.card-item, [class*="card-list"], [class*="cardItem"], .cc-card',
      els => els.map(el => {
        const nameEl  = el.querySelector('h2,h3,h4,[class*="card-name"],[class*="cardName"]');
        const bankEl  = el.querySelector('[class*="bank"],[class*="issuer"]');
        const feeEl   = el.querySelector('[class*="fee"],[class*="annual"]');
        const linkEl  = el.querySelector('a');
        return {
          name: nameEl ?.innerText?.trim() || '',
          bank: bankEl ?.innerText?.trim() || '',
          fee:  feeEl  ?.innerText?.trim() || '',
          href: linkEl ?.href              || ''
        };
      })
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5) continue;
      const fee = parseFee(item.fee);
      cards.push({
        card_name:   item.name.replace(/\s+/g, ' ').trim(),
        bank_name:   item.bank || guessBank(item.name),
        card_type:   'credit',
        card_network: detectNetwork(item.name, ''),
        card_tier:   detectTier(item.name, fee),
        annual_fee:  fee,
        joining_fee: fee,
        source_url:  item.href || 'https://www.paisabazaar.com/credit-card/',
        is_popular:  false
      });
    }
    console.log(`     ✅ Paisabazaar: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  Paisabazaar scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
  return cards;
}

// ─── BANKBAZAAR ───────────────────────────────────────────────────────────────
async function scrapeBankBazaar(browser) {
  console.log('  📋 Scraping BankBazaar (aggregator)...');
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
      '.card, [class*="card-item"], [class*="cardItem"], .product-card',
      els => els.map(el => {
        const nameEl = el.querySelector('h2,h3,h4,[class*="name"],[class*="title"]');
        const bankEl = el.querySelector('[class*="bank"],[class*="provider"]');
        const feeEl  = el.querySelector('[class*="fee"]');
        const linkEl = el.querySelector('a');
        return {
          name: nameEl ?.innerText?.trim() || '',
          bank: bankEl ?.innerText?.trim() || '',
          fee:  feeEl  ?.innerText?.trim() || '',
          href: linkEl ?.href              || ''
        };
      })
    ).catch(() => []);

    for (const item of items) {
      if (!item.name || item.name.length < 5) continue;
      const fee = parseFee(item.fee);
      cards.push({
        card_name:   item.name.replace(/\s+/g, ' ').trim(),
        bank_name:   item.bank || guessBank(item.name),
        card_type:   'credit',
        card_network: detectNetwork(item.name, ''),
        card_tier:   detectTier(item.name, fee),
        annual_fee:  fee,
        joining_fee: fee,
        source_url:  item.href || 'https://www.bankbazaar.com/credit-card.html',
        is_popular:  false
      });
    }
    console.log(`     ✅ BankBazaar: found ${cards.length} cards`);
  } catch (e) {
    console.warn(`     ⚠️  BankBazaar scrape failed: ${e.message}`);
  } finally {
    await page.close();
  }
  return cards;
}

// ─── HELPERS for aggregator scrapers ──────────────────────────────────────────

function detectNetwork(cardName, networkHint) {
  const s = (cardName + ' ' + networkHint).toLowerCase();
  if (/rupay/i.test(s))      return 'RuPay';
  if (/mastercard|master/i.test(s)) return 'Mastercard';
  if (/amex|american express/i.test(s)) return 'Amex';
  if (/diners/i.test(s))     return 'Diners';
  return 'Visa';
}

function guessBank(cardName) {
  const n = cardName.toLowerCase();
  if (/hdfc/i.test(n))       return 'HDFC Bank';
  if (/sbi/i.test(n))        return 'SBI Card';
  if (/icici/i.test(n))      return 'ICICI Bank';
  if (/axis/i.test(n))       return 'Axis Bank';
  if (/kotak/i.test(n))      return 'Kotak Mahindra Bank';
  if (/yes bank|yesbank/i.test(n)) return 'Yes Bank';
  if (/indusind/i.test(n))   return 'IndusInd Bank';
  if (/rbl/i.test(n))        return 'RBL Bank';
  if (/idfc/i.test(n))       return 'IDFC FIRST Bank';
  if (/standard chartered|sc bank/i.test(n)) return 'Standard Chartered';
  if (/amex|american express/i.test(n)) return 'American Express';
  if (/bob|bank of baroda/i.test(n)) return 'Bank of Baroda';
  if (/canara/i.test(n))     return 'Canara Bank';
  if (/federal/i.test(n))    return 'Federal Bank';
  if (/au small/i.test(n))   return 'AU Small Finance Bank';
  if (/hsbc/i.test(n))       return 'HSBC';
  if (/citibank|citi/i.test(n)) return 'Citibank';
  return 'Unknown Bank';
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUPABASE UPSERT
// ═══════════════════════════════════════════════════════════════════════════════

async function upsertCards(cards) {
  let inserted = 0, updated = 0, failed = 0;

  for (const card of cards) {
    // Skip cards with no meaningful name
    if (!card.card_name || card.card_name.length < 4) { failed++; continue; }
    // Skip cards with unknown bank if no source URL
    if (card.bank_name === 'Unknown Bank' && !card.source_url) { failed++; continue; }

    const payload = {
      card_name:                   card.card_name,
      bank_name:                   card.bank_name,
      card_type:                   card.card_type   || 'credit',
      card_network:                card.card_network || null,
      card_tier:                   card.card_tier    || null,
      annual_fee:                  card.annual_fee   ?? null,
      joining_fee:                 card.joining_fee  ?? null,
      annual_fee_waiver_conditions: card.annual_fee_waiver_conditions || null,
      reward_type:                 card.reward_type  || null,
      base_reward_rate:            card.base_reward_rate ?? null,
      category_rewards:            card.category_rewards || null,
      domestic_lounge_access:      card.domestic_lounge_access    ?? null,
      international_lounge_access: card.international_lounge_access ?? null,
      min_income_monthly:          card.min_income_monthly ?? null,
      min_credit_score:            card.min_credit_score   ?? null,
      age_min:                     card.age_min ?? null,
      age_max:                     card.age_max ?? null,
      is_popular:                  card.is_popular ?? false,
      is_active:                   true,
      source_url:                  card.source_url || null,
      last_updated:                new Date().toISOString()
    };

    // Check if card already exists
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
      const { error: upErr } = await supabase
        .from('cards')
        .update(payload)
        .eq('id', existing.id);
      if (upErr) {
        console.warn(`  ❌ Update failed ${card.card_name}: ${upErr.message}`);
        failed++;
      } else {
        updated++;
      }
    } else {
      const { error: insErr } = await supabase
        .from('cards')
        .insert(payload);
      if (insErr) {
        console.warn(`  ❌ Insert failed ${card.card_name}: ${insErr.message}`);
        failed++;
      } else {
        inserted++;
      }
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

  const browser = await launchBrowser();
  let allCards = [];

  try {
    // ── Phase 1: Bank websites (primary) ──────────────────────────────────────
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
    console.log(`\n📦 Phase 1 total: ${allCards.length} raw cards from bank sites\n`);

    // ── Phase 2: Aggregators (enrichment + fallback) ──────────────────────────
    console.log('═══ PHASE 2: Aggregator Sites ═══');
    const aggResults = await Promise.allSettled([
      scrapeCardInsider(browser),
      scrapePaisabazaar(browser),
      scrapeBankBazaar(browser)
    ]);

    for (const r of aggResults) {
      if (r.status === 'fulfilled') allCards.push(...r.value);
    }
    console.log(`\n📦 Phase 2 total (before dedup): ${allCards.length} raw cards\n`);

  } finally {
    await browser.close();
  }

  // ── Phase 3: Deduplicate ────────────────────────────────────────────────────
  console.log('═══ PHASE 3: Deduplication ═══');
  // Filter out junk names (nav links, headings, etc.)
  const cleaned = allCards.filter(c =>
    c.card_name &&
    c.card_name.length >= 5 &&
    c.card_name.length <= 120 &&
    c.bank_name !== 'Unknown Bank' || c.source_url
  );
  const unique = deduplicateCards(cleaned);
  console.log(`✅ After dedup: ${unique.length} unique cards\n`);

  // ── Phase 4: Upsert to Supabase ─────────────────────────────────────────────
  console.log('═══ PHASE 4: Upserting to Supabase ═══');
  const { inserted, updated, failed } = await upsertCards(unique);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════');
  console.log('✅ Update complete!');
  console.log(`   Total unique cards processed : ${unique.length}`);
  console.log(`   Inserted (new)               : ${inserted}`);
  console.log(`   Updated (existing)           : ${updated}`);
  console.log(`   Failed / skipped             : ${failed}`);
  console.log('════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});