/**
 * Asset Extraction Script — JD Power Warehouse
 * Downloads all images from the reference site for local use.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'https://preview-1784678966980352958.vibepreview.com';
const ROOT = path.join(__dirname, '..');
const PUBLIC_IMG = path.join(ROOT, 'public', 'images');

const DIRS = {
  logo:     path.join(PUBLIC_IMG, 'logo'),
  hero:     path.join(PUBLIC_IMG, 'hero'),
  catalog:  path.join(PUBLIC_IMG, 'catalog'),
  sections: path.join(PUBLIC_IMG, 'sections'),
};

Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));

const PAGES_TO_VISIT = ['/', '/shop', '/sell', '/contact', '/testimonials', '/about'];

// ── Helpers ────────────────────────────────────────────────────────────────

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': BASE_URL,
      },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function safeFilename(url, index) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || `img-${index}`;
    // Truncate long CDN filenames but keep extension
    const ext = path.extname(last) || '.jpg';
    const base = last.slice(0, 40).replace(/[^a-zA-Z0-9-]/g, '_');
    return base + ext;
  } catch {
    return `img-${index}.jpg`;
  }
}

function categorize(url, altText = '') {
  const u = url.toLowerCase();
  const a = altText.toLowerCase();
  if (a.includes('logo') || u.includes('logo') || u.includes('attachments')) return 'logo';
  if (a.includes('hero') || a.includes('banner') || u.includes('hero')) return 'hero';
  if (
    a.includes('tool') || a.includes('drill') || a.includes('mower') ||
    a.includes('grill') || a.includes('patio') || a.includes('chair') ||
    a.includes('cart') || a.includes('faucet') || a.includes('light') ||
    a.includes('vac') || a.includes('sawzall') || a.includes('solar') ||
    a.includes('thermostat') || a.includes('miter') || a.includes('ryobi') ||
    a.includes('dewalt') || a.includes('milwaukee') || a.includes('weber') ||
    a.includes('ridgid') || a.includes('gorilla') || u.includes('assets')
  ) return 'catalog';
  return 'sections';
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const imageMap = new Map(); // url → { alt, category }

  console.log('Launching browser…');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  });
  const page = await context.newPage();

  // Intercept network responses to grab all image URLs
  page.on('response', async (res) => {
    const url = res.url();
    const ct = (res.headers()['content-type'] || '');
    if (ct.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(url)) {
      if (!imageMap.has(url)) imageMap.set(url, { alt: '', category: null });
    }
  });

  for (const pagePath of PAGES_TO_VISIT) {
    const url = BASE_URL + pagePath;
    console.log(`\nVisiting ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1000);

      // Collect img elements
      const imgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt || '',
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
        }))
      );

      for (const img of imgs) {
        if (img.src && img.src.startsWith('http')) {
          imageMap.set(img.src, { alt: img.alt, category: null, w: img.naturalW, h: img.naturalH });
        }
      }

      // CSS background-image
      const bgImgs = await page.evaluate(() => {
        const results = [];
        for (const el of document.querySelectorAll('*')) {
          const bg = window.getComputedStyle(el).backgroundImage;
          if (bg && bg !== 'none' && bg.includes('url(')) {
            const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
            if (m && m[1].startsWith('http')) {
              results.push({ url: m[1], tag: el.tagName, cls: el.className?.slice?.(0, 40) || '' });
            }
          }
        }
        return results;
      });

      for (const bg of bgImgs) {
        if (!imageMap.has(bg.url)) imageMap.set(bg.url, { alt: `bg-${bg.tag}`, category: 'sections' });
      }

    } catch (err) {
      console.error(`  Error on ${pagePath}: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\nTotal unique image URLs found: ${imageMap.size}`);

  // Categorize and download
  const manifest = [];
  let idx = 0;

  for (const [url, meta] of imageMap) {
    const cat = meta.category ?? categorize(url, meta.alt);
    const destDir = DIRS[cat] ?? DIRS.sections;
    const filename = safeFilename(url, idx++);
    const localPath = path.join(destDir, filename);
    const publicPath = `/images/${cat}/${filename}`;

    process.stdout.write(`  Downloading [${cat}] ${filename}…`);
    try {
      await downloadFile(url, localPath);
      const size = fs.statSync(localPath).size;
      if (size < 100) {
        fs.unlinkSync(localPath);
        console.log(` SKIP (${size}b, too small)`);
        continue;
      }
      console.log(` ✓ (${(size/1024).toFixed(0)}KB)`);
      manifest.push({
        url,
        publicPath,
        category: cat,
        alt: meta.alt,
        width: meta.w || null,
        height: meta.h || null,
      });
    } catch (err) {
      console.log(` ✗ ${err.message}`);
      manifest.push({ url, publicPath, category: cat, error: err.message });
    }
  }

  // Save manifest
  const manifestPath = path.join(PUBLIC_IMG, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const ok = manifest.filter(m => !m.error);
  const failed = manifest.filter(m => m.error);

  console.log(`\n✓ Downloaded: ${ok.length}`);
  console.log(`✗ Failed:     ${failed.length}`);
  console.log(`Manifest:     public/images/manifest.json`);

  // Print categorized summary
  const byCat = {};
  for (const m of ok) {
    byCat[m.category] = (byCat[m.category] || []);
    byCat[m.category].push(m.publicPath);
  }
  console.log('\nBy category:');
  for (const [cat, paths] of Object.entries(byCat)) {
    console.log(`  ${cat}: ${paths.length} files`);
    paths.forEach(p => console.log(`    ${p}`));
  }
}

main().catch(console.error);
