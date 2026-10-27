// Visual Audit Script for JD Power Warehouse
// Navigates the reference URL and captures screenshots + extracted design info
// Usage: node scripts/visual-audit.js

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://preview-1784678966980352958.vibepreview.com';
const EVIDENCE_DIR = path.join(__dirname, '..', 'evidence', 'reference');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

const ROUTES_TO_EXPLORE = [
  { path: '/', name: 'home' },
  { path: '/shop', name: 'shop' },
  { path: '/products', name: 'products' },
  { path: '/categories', name: 'categories' },
  { path: '/cart', name: 'cart' },
  { path: '/checkout', name: 'checkout' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
  { path: '/account', name: 'account' },
  { path: '/orders', name: 'orders' },
];

async function extractDesignTokens(page) {
  return await page.evaluate(() => {
    const computed = (el, prop) => window.getComputedStyle(el).getPropertyValue(prop).trim();
    const body = document.body;
    const result = {
      bodyBg: computed(body, 'background-color'),
      bodyColor: computed(body, 'color'),
      bodyFont: computed(body, 'font-family'),
      bodyFontSize: computed(body, 'font-size'),
    };

    // Headings
    const h1 = document.querySelector('h1');
    if (h1) {
      result.h1FontSize = computed(h1, 'font-size');
      result.h1FontWeight = computed(h1, 'font-weight');
      result.h1Color = computed(h1, 'color');
      result.h1FontFamily = computed(h1, 'font-family');
    }
    const h2 = document.querySelector('h2');
    if (h2) {
      result.h2FontSize = computed(h2, 'font-size');
      result.h2FontWeight = computed(h2, 'font-weight');
    }

    // Buttons
    const primaryBtn = document.querySelector('button, a[class*="btn"], a[class*="button"], [class*="btn-primary"], [class*="button-primary"]');
    if (primaryBtn) {
      result.btnBg = computed(primaryBtn, 'background-color');
      result.btnColor = computed(primaryBtn, 'color');
      result.btnBorderRadius = computed(primaryBtn, 'border-radius');
      result.btnPadding = computed(primaryBtn, 'padding');
      result.btnFontSize = computed(primaryBtn, 'font-size');
      result.btnFontWeight = computed(primaryBtn, 'font-weight');
      result.btnText = primaryBtn.textContent?.trim().slice(0, 50);
    }

    // Nav/header
    const nav = document.querySelector('nav, header');
    if (nav) {
      result.navBg = computed(nav, 'background-color');
      result.navColor = computed(nav, 'color');
      result.navHeight = computed(nav, 'height');
    }

    // Links
    const links = Array.from(document.querySelectorAll('a[href]'))
      .filter(a => a.href.includes(window.location.hostname))
      .map(a => ({ text: a.textContent?.trim().slice(0, 40), href: a.pathname }))
      .filter(l => l.text && l.href !== '#')
      .slice(0, 30);
    result.internalLinks = links;

    // CSS variables
    const rootStyle = getComputedStyle(document.documentElement);
    const cssVars = {};
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === ':root') {
            const text = rule.cssText;
            const matches = text.matchAll(/--([\w-]+):\s*([^;]+);/g);
            for (const m of matches) {
              cssVars[`--${m[1]}`] = m[2].trim();
            }
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    result.cssVars = cssVars;

    // Font imports
    const fontLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => l.href)
      .filter(h => h.includes('font') || h.includes('google') || h.includes('typekit'));
    result.fontLinks = fontLinks;

    // Meta title/description
    result.pageTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    result.metaDescription = metaDesc ? metaDesc.content : null;

    // Page structure
    result.hasHeader = !!document.querySelector('header');
    result.hasFooter = !!document.querySelector('footer');
    result.hasNav = !!document.querySelector('nav');
    result.hasHero = !!document.querySelector('[class*="hero"], [id*="hero"], section:first-of-type');
    result.productCards = document.querySelectorAll('[class*="product"], [class*="card"], [class*="item"]').length;

    return result;
  });
}

async function extractPageStructure(page) {
  return await page.evaluate(() => {
    const getText = el => el?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100) || '';

    // Navigation links
    const navLinks = Array.from(document.querySelectorAll('nav a, header a')).map(a => ({
      text: getText(a),
      href: a.getAttribute('href'),
    })).filter(l => l.text);

    // Hero section
    const hero = document.querySelector('[class*="hero"], section:first-child, .banner, [class*="banner"]');
    const heroData = hero ? {
      heading: getText(hero.querySelector('h1, h2')),
      subheading: getText(hero.querySelector('p')),
      hasCta: !!hero.querySelector('a, button'),
      ctaText: getText(hero.querySelector('a, button')),
      bgColor: getComputedStyle(hero).backgroundColor,
    } : null;

    // Product cards
    const cards = Array.from(document.querySelectorAll('[class*="product-card"], [class*="product_card"], [class*="ProductCard"]'))
      .slice(0, 5)
      .map(card => ({
        name: getText(card.querySelector('[class*="name"], [class*="title"], h3, h4')),
        price: getText(card.querySelector('[class*="price"]')),
        hasImage: !!card.querySelector('img'),
        hasCta: !!card.querySelector('button, a[class*="cart"], a[class*="buy"]'),
      }));

    // Footer
    const footer = document.querySelector('footer');
    const footerData = footer ? {
      bg: getComputedStyle(footer).backgroundColor,
      links: Array.from(footer.querySelectorAll('a')).slice(0, 10).map(a => getText(a)),
    } : null;

    // All visible sections
    const sections = Array.from(document.querySelectorAll('section, [class*="section"]')).slice(0, 10).map(s => ({
      id: s.id,
      classes: s.className?.slice(0, 60),
      heading: getText(s.querySelector('h1,h2,h3,h4')),
    }));

    // Images
    const images = Array.from(document.querySelectorAll('img')).slice(0, 10).map(img => ({
      src: img.src?.replace(location.origin, '').slice(0, 80),
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));

    // Colors in use (from inline styles and visible elements)
    const colors = new Set();
    for (const el of document.querySelectorAll('*')) {
      const style = getComputedStyle(el);
      const bg = style.backgroundColor;
      const color = style.color;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') colors.add(bg);
      if (color) colors.add(color);
      if (colors.size > 30) break;
    }

    return {
      navLinks,
      hero: heroData,
      productCards: cards,
      footer: footerData,
      sections,
      images,
      colorsFound: Array.from(colors).slice(0, 20),
    };
  });
}

async function tryRoute(page, url, name) {
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const status = response?.status();
    if (status && status >= 400) {
      return { exists: false, status };
    }
    await page.waitForTimeout(1500);
    return { exists: true, status };
  } catch (e) {
    return { exists: false, error: e.message };
  }
}

async function main() {
  const audit = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    accessStatus: null,
    routes: {},
    designTokens: null,
    pageStructure: null,
    discoveredRoutes: [],
    errors: [],
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // --- Step 1: Load homepage ---
    console.log('Loading homepage...');
    const homeResult = await tryRoute(page, BASE_URL, 'home');
    audit.accessStatus = homeResult;

    if (!homeResult.exists) {
      console.error('Homepage inaccessible:', homeResult);
      audit.errors.push({ route: '/', error: homeResult });
      fs.writeFileSync(path.join(EVIDENCE_DIR, 'audit-raw.json'), JSON.stringify(audit, null, 2));
      return;
    }

    // Extract design tokens from homepage
    console.log('Extracting design tokens...');
    audit.designTokens = await extractDesignTokens(page);
    audit.pageStructure = await extractPageStructure(page);

    // Discover routes from nav links
    const navLinks = audit.pageStructure.navLinks || [];
    console.log(`Found ${navLinks.length} nav links`);

    // Collect all internal links
    const internalLinks = (audit.designTokens.internalLinks || []).map(l => l.href);
    const allDiscoveredPaths = [...new Set([
      ...navLinks.map(l => l.href).filter(h => h && !h.startsWith('http')),
      ...internalLinks,
    ])];
    audit.discoveredRoutes = allDiscoveredPaths;

    // --- Step 2: Take screenshots at all viewports for homepage ---
    console.log('Taking homepage screenshots...');
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(1000);
      const filename = `home-${vp.name}.png`;
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, filename),
        fullPage: true,
      });
      console.log(`  Saved ${filename}`);
    }

    // --- Step 3: Explore discovered routes ---
    const routesToVisit = [
      ...new Set([
        ...allDiscoveredPaths,
        ...ROUTES_TO_EXPLORE.map(r => r.path),
      ])
    ].filter(p => p && p !== '/' && p.startsWith('/'));

    console.log(`\nExploring ${routesToVisit.length} routes...`);

    for (const routePath of routesToVisit) {
      const url = BASE_URL + routePath;
      const safeName = routePath.replace(/\//g, '-').replace(/^-/, '') || 'index';
      console.log(`  Checking: ${routePath}`);

      // Set desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });
      const result = await tryRoute(page, url, safeName);
      audit.routes[routePath] = result;

      if (result.exists) {
        // Extract structure
        const structure = await extractPageStructure(page);
        const tokens = await extractDesignTokens(page);
        audit.routes[routePath].structure = structure;
        audit.routes[routePath].tokens = tokens;

        // Screenshot desktop
        await page.screenshot({
          path: path.join(EVIDENCE_DIR, `${safeName}-desktop.png`),
          fullPage: true,
        });

        // Screenshot mobile
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(800);
        await page.screenshot({
          path: path.join(EVIDENCE_DIR, `${safeName}-mobile.png`),
          fullPage: true,
        });

        console.log(`    ✓ ${routePath} (${result.status})`);
      } else {
        console.log(`    ✗ ${routePath} (${result.status || result.error})`);
      }
    }

    // --- Step 4: Interact with cart if visible ---
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Try to open cart/menu
    const cartBtn = await page.$('[class*="cart"], [aria-label*="cart"], [aria-label*="Cart"]');
    if (cartBtn) {
      await cartBtn.click().catch(() => {});
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, 'cart-open-desktop.png'),
        fullPage: false,
      });
      console.log('Captured cart open state');
    }

    // Try mobile menu
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(800);
    const menuBtn = await page.$('[class*="hamburger"], [class*="menu-btn"], [class*="mobile-menu"], button[aria-label*="menu"], button[aria-label*="Menu"]');
    if (menuBtn) {
      await menuBtn.click().catch(() => {});
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, 'mobile-menu-open.png'),
        fullPage: false,
      });
      console.log('Captured mobile menu open state');
    }

  } catch (err) {
    console.error('Fatal error:', err);
    audit.errors.push({ fatal: err.message });
  } finally {
    if (browser) await browser.close();
  }

  // Save raw audit data
  const auditPath = path.join(EVIDENCE_DIR, 'audit-raw.json');
  fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));
  console.log(`\nAudit data saved to ${auditPath}`);
  console.log('Screenshots saved to evidence/reference/');
}

main().catch(console.error);
