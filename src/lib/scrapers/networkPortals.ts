// src/lib/scrapers/networkPortals.ts
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs'; // Added to save the screenshot
import path from 'path';

export async function scrapeNetworkPortal(url: string, platform: 'Visa' | 'Mastercard') {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      defaultViewport: { width: 1280, height: 1080 }, // Taller viewport
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    
    // Extra-stealthy user agent to bypass bot blockers
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Hard pause to let Visa's heavy security checks and React components mount
    await new Promise(r => setTimeout(r, 4000));

    // 📸 TAKE A PICTURE: This saves a screenshot so we can see what the bot sees
    if (platform === 'Visa') {
      try {
        const screenshotPath = path.join(process.cwd(), 'public', 'visa-debug.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`[DEBUG] Visa screenshot saved to: ${screenshotPath}`);
      } catch (e) {
        console.log('[DEBUG] Failed to save screenshot.');
      }
    }

    // Scroll simulation
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, 300);
          totalHeight += 300;
          if (totalHeight >= document.body.scrollHeight || totalHeight > 5000) {
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });

    const offers = await page.evaluate((sourcePlatform) => {
      const items: any[] = [];
      const seenTitles = new Set<string>();

      const junkPhrases = ['cookie', 'privacy', 'sign in', 'log in', 'terms', 'rights reserved', 'contact us'];
      const dealSignatures = ['%', '₹', 'rs', 'inr', 'discount', 'cashback', 'complimentary', 'bonus', 'save', 'off', 'reward'];
      const dateRegex = /(valid\s*(till|until|thru|through)|expires|validity|end\s*date)(.{0,30})/i;

      if (sourcePlatform === 'Visa') {
        // NUCLEAR EXTRACTION: Ignore links entirely. Look at every single element on the page.
        const allElements = document.querySelectorAll('div, li, article, .card, .offer');
        
        allElements.forEach((el) => {
          const rawText = (el.textContent || '').replace(/\s+/g, ' ').trim();
          
          // Only process chunks of text that are the size of a typical card (not too short, not the whole page)
          if (rawText.length < 30 || rawText.length > 400) return;

          const textLower = rawText.toLowerCase();
          
          // Does this block of text contain a deal keyword AND an expiration date?
          const hasDeal = dealSignatures.some(d => textLower.includes(d));
          const hasDate = dateRegex.test(textLower);
          const isJunk = junkPhrases.some(j => textLower.includes(j));

          if (hasDeal && hasDate && !isJunk) {
            const heading = el.querySelector('h2, h3, h4, h5, strong, .title');
            let title = heading && heading.textContent ? heading.textContent.trim() : rawText.substring(0, 50) + '...';

            if (!seenTitles.has(title)) {
              seenTitles.add(title);

              const dateMatch = rawText.match(dateRegex);
              const validity = dateMatch ? dateMatch[0].trim() : 'See portal for details';

              const variantRegex = /(signature|infinite|platinum|gold|classic|business|corporate)/gi;
              const variantsFound = rawText.match(variantRegex);
              const variant = variantsFound ? Array.from(new Set(variantsFound)).join(', ') : 'All Visa Variants';

              // Try to find a link nearby, default to the main page if none exists
              const anchor = el.querySelector('a');
              const link = anchor ? anchor.href : window.location.href;

              items.push({
                title,
                description: rawText.replace(title, '').trim().substring(0, 180) || 'Exclusive Visa network offer item.',
                source: sourcePlatform,
                source_url: link,
                validity_date: validity,
                card_variant: variant,
                created_at: new Date().toISOString()
              });
            }
          }
        });

      } else {
        // Mastercard Processing (Working perfectly)
        const blocks = document.querySelectorAll('div, section, article, a');
        blocks.forEach((el) => {
          const rawText = (el.textContent || '').replace(/\s+/g, ' ').trim();
          const textLower = rawText.toLowerCase();
          const headingEl = el.querySelector('h2, h3, h4, h5, .title, strong');
          if (!headingEl || !headingEl.textContent) return;

          const title = headingEl.textContent.trim();
          const isRealDeal = dealSignatures.some(d => textLower.includes(d));
          const isJunk = junkPhrases.some(j => textLower.includes(j));

          if (title.length > 8 && title.length < 120 && !seenTitles.has(title) && isRealDeal && !isJunk) {
            seenTitles.add(title);
            const dateMatch = rawText.match(dateRegex);
            const variantRegex = /(world|elite|platinum|titanium|gold|business|corporate)/gi;
            const variantsFound = rawText.match(variantRegex);
            
            let anchorElement = el.tagName === 'A' ? el : el.querySelector('a');
            const targetUrl = anchorElement ? (anchorElement as HTMLAnchorElement).href : window.location.href;

            items.push({
              title,
              description: rawText.replace(title, '').trim().substring(0, 180) || 'Exclusive Mastercard category utility perk.',
              source: sourcePlatform,
              source_url: targetUrl,
              validity_date: dateMatch ? dateMatch[0].trim() : 'See category terms',
              card_variant: variantsFound ? Array.from(new Set(variantsFound)).join(', ') : 'All Mastercard Variants',
              created_at: new Date().toISOString()
            });
          }
        });
      }

      return items;
    }, platform);

    await browser.close();
    return offers;

  } catch (error) {
    console.error(`Error filtering platform structure for ${platform}:`, error);
    if (browser) {
      try { await browser.close(); } catch(e) {}
    }
    return [];
  }
}