import { writeFileSync } from 'node:fs';

// Public, crawlable routes only. Private workspaces and operational routes are excluded.
// lastmod is intentionally omitted until content timestamps are sourced from real edits.
const publicRoutes = [
  '/',
  '/guide',
  '/about',
  '/punn-pca',
  '/publication',
  '/whitepaper',
  '/plans',
  '/privacy-terms',
];

const xmlEscape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const urls = publicRoutes.map((route) => {
  const loc = xmlEscape('https://firekeeper.site' + (route === '/' ? '/' : route));
  return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
});
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  '</urlset>',
  '',
].join('\n');
writeFileSync(new URL('../public/sitemap.xml', import.meta.url), sitemap, 'utf8');
console.log(`Generated sitemap.xml with ${publicRoutes.length} public routes.`);
