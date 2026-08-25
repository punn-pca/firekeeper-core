import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 1. Generate 1200x630 OG Landscape Image (Standard Open Graph for FB/Twitter/LinkedIn/Line)
const svgLandscape = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0B1325" stop-opacity="1"/>
      <stop offset="100%" stop-color="#030712" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="orangeGlow" cx="50%" cy="40%" r="40%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#050b14" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDF3C7"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#030712"/>
  <rect width="1200" height="630" fill="url(#bgGlow)"/>

  <!-- Radial Orange Glow -->
  <circle cx="600" cy="280" r="300" fill="url(#orangeGlow)"/>

  <!-- Concentric Rings -->
  <circle cx="600" cy="280" r="220" stroke="#334155" stroke-width="1" stroke-dasharray="4, 4" fill="none" opacity="0.3"/>
  <circle cx="600" cy="280" r="160" stroke="#475569" stroke-width="0.8" fill="none" opacity="0.25"/>
  <circle cx="600" cy="280" r="100" stroke="#64748B" stroke-width="0.5" fill="none" opacity="0.2"/>

  <!-- Side Dot Grids -->
  <g fill="#64748B" opacity="0.3">
    <!-- Left dots -->
    <circle cx="200" cy="240" r="2"/><circle cx="216" cy="240" r="2"/><circle cx="232" cy="240" r="2"/><circle cx="248" cy="240" r="2"/>
    <circle cx="200" cy="265" r="2"/><circle cx="216" cy="265" r="2"/><circle cx="232" cy="265" r="2"/><circle cx="248" cy="265" r="2"/>
    <circle cx="200" cy="290" r="2"/><circle cx="216" cy="290" r="2"/><circle cx="232" cy="290" r="2"/><circle cx="248" cy="290" r="2"/>
    <!-- Right dots -->
    <circle cx="952" cy="240" r="2"/><circle cx="968" cy="240" r="2"/><circle cx="984" cy="240" r="2"/><circle cx="1000" cy="240" r="2"/>
    <circle cx="952" cy="265" r="2"/><circle cx="968" cy="265" r="2"/><circle cx="984" cy="265" r="2"/><circle cx="1000" cy="265" r="2"/>
    <circle cx="952" cy="290" r="2"/><circle cx="968" cy="290" r="2"/><circle cx="984" cy="290" r="2"/><circle cx="1000" cy="290" r="2"/>
  </g>

  <!-- Flame Icon -->
  <g transform="translate(600, 195) scale(1.8)" filter="url(#glow)">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="none" stroke="#f97316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Title: FIRE KEEPER -->
  <text x="600" y="325" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', sans-serif" font-weight="600" font-size="54" fill="#FFFFFF" letter-spacing="0.38em">FIRE KEEPER</text>

  <!-- Subtitle Divider & Line -->
  <line x1="380" y1="365" x2="510" y2="365" stroke="#475569" stroke-width="1"/>
  <text x="600" y="371" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="15" fill="#94A3B8" letter-spacing="0.28em">12-STAGE STRATEGIC INTELLIGENCE</text>
  <line x1="690" y1="365" x2="820" y2="365" stroke="#475569" stroke-width="1"/>

  <!-- Status Pill -->
  <g transform="translate(600, 420)">
    <rect x="-240" y="-18" width="480" height="36" rx="18" fill="#0B1325" fill-opacity="0.8" stroke="#334155" stroke-width="1"/>
    <circle cx="-210" cy="0" r="4" fill="#10B981" filter="url(#glow)"/>
    <text x="15" y="5" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold" fill="#CBD5E1" letter-spacing="0.2em">PUNN COGNITIVE ARCHITECTURE (PCA V2)</text>
  </g>

  <!-- Tagline -->
  <text x="600" y="500" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="13" fill="#94A3B8" letter-spacing="0.3em">SEE CLEARER. DECIDE FREER. <tspan fill="#f97316">ACT WISER.</tspan></text>
</svg>`;

// 2. Generate 1000x1000 Square Cover
const svgSquare = `<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sqBgGlow" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0B1325" stop-opacity="1"/>
      <stop offset="100%" stop-color="#030712" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="sqOrangeGlow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
    </radialGradient>
    <filter id="sqGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="20" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="1000" height="1000" fill="#030712"/>
  <rect width="1000" height="1000" fill="url(#sqBgGlow)"/>

  <circle cx="500" cy="420" r="380" fill="url(#sqOrangeGlow)"/>

  <circle cx="500" cy="420" r="280" stroke="#334155" stroke-width="1" stroke-dasharray="4, 4" fill="none" opacity="0.3"/>
  <circle cx="500" cy="420" r="200" stroke="#475569" stroke-width="0.8" fill="none" opacity="0.25"/>
  <circle cx="500" cy="420" r="120" stroke="#64748B" stroke-width="0.5" fill="none" opacity="0.2"/>

  <!-- Flame Icon -->
  <g transform="translate(500, 310) scale(2.4)" filter="url(#sqGlow)">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="none" stroke="#f97316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Title -->
  <text x="500" y="470" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', sans-serif" font-weight="600" font-size="64" fill="#FFFFFF" letter-spacing="0.4em">FIRE KEEPER</text>

  <!-- Subtitle -->
  <line x1="220" y1="520" x2="380" y2="520" stroke="#475569" stroke-width="1.2"/>
  <text x="500" y="527" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="17" fill="#94A3B8" letter-spacing="0.28em">12-STAGE STRATEGIC INTELLIGENCE</text>
  <line x1="620" y1="520" x2="780" y2="520" stroke="#475569" stroke-width="1.2"/>

  <!-- Status Pill -->
  <g transform="translate(500, 600)">
    <rect x="-260" y="-20" width="520" height="40" rx="20" fill="#0B1325" fill-opacity="0.85" stroke="#334155" stroke-width="1"/>
    <circle cx="-225" cy="0" r="4.5" fill="#10B981" filter="url(#sqGlow)"/>
    <text x="15" y="6" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="bold" fill="#CBD5E1" letter-spacing="0.2em">PUNN COGNITIVE ARCHITECTURE (PCA V2)</text>
  </g>

  <!-- Tagline -->
  <text x="500" y="720" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="15" fill="#94A3B8" letter-spacing="0.32em">SEE CLEARER. DECIDE FREER. <tspan fill="#f97316">ACT WISER.</tspan></text>
</svg>`;

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write SVGs
  fs.writeFileSync(path.join(publicDir, 'og-image.svg'), svgLandscape);
  fs.writeFileSync(path.join(publicDir, 'firekeeper-book-cover.svg'), svgSquare);
  console.log('SVGs written successfully.');

  // 2. Render PNG 1200x630 using sharp
  await sharp(Buffer.from(svgLandscape))
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('Generated /public/og-image.png (1200x630)');

  // 3. Render PNG 1000x1000 square cover
  await sharp(Buffer.from(svgSquare))
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'firekeeper-book-cover.png'));
  console.log('Generated /public/firekeeper-book-cover.png (1000x1000)');

  // 4. Also generate standard share-cover.png alias
  await sharp(Buffer.from(svgLandscape))
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'share-cover.png'));
  console.log('Generated /public/share-cover.png');
}

main().catch(err => {
  console.error('Error generating share images:', err);
  process.exit(1);
});
