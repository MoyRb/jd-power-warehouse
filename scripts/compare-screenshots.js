// Compare local implementation vs reference screenshots
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const LOCAL_BASE = 'http://localhost:3001';
const EVIDENCE_DIR = path.join(__dirname, '..', 'evidence');
const LOCAL_DIR = path.join(EVIDENCE_DIR, 'local');

fs.mkdirSync(LOCAL_DIR, { recursive: true });

const PAGES = [
  { path: '/',                      name: 'home'              },
  { path: '/shop',                  name: 'shop'              },
  { path: '/sell',                  name: 'sell'              },
  { path: '/contact',               name: 'contact'           },
  { path: '/testimonials',          name: 'testimonials'      },
  { path: '/about',                 name: 'about'             },
  { path: '/privacy-policy',        name: 'privacy-policy'    },
  { path: '/terms-and-conditions',  name: 'terms'             },
  { path: '/refund-policy',         name: 'refund-policy'     },
  { path: '/shipping-policy',       name: 'shipping-policy'   },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    for (const route of PAGES) {
      const url = LOCAL_BASE + route.path;
      console.log(`Capturing ${vp.name}: ${route.path}`);
      try {
        const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(500);
        const filename = `${route.name}-${vp.name}.png`;
        await page.screenshot({ path: path.join(LOCAL_DIR, filename), fullPage: true });
        results.push({ route: route.path, viewport: vp.name, status: res?.status(), ok: true });
        console.log(`  ✓ ${filename}`);
      } catch (err) {
        results.push({ route: route.path, viewport: vp.name, ok: false, error: String(err) });
        console.log(`  ✗ Error: ${err.message}`);
      }
    }

    await context.close();
  }

  fs.writeFileSync(
    path.join(LOCAL_DIR, 'capture-results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2),
  );

  const ok = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\nCaptures: ${ok}/${total} successful`);
}

main().catch(console.error);
