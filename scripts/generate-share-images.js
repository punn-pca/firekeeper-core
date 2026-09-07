import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 1. Generate 1200x630 OG Landscape Image (Standard Open Graph for FB/Twitter/LinkedIn/Line/Telegram)
const svgLandscape = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="deepBg" cx="50%" cy="48%" r="65%">
      <stop offset="0%" stop-color="#0d1527"/>
      <stop offset="60%" stop-color="#050813"/>
      <stop offset="100%" stop-color="#020409"/>
    </radialGradient>
    
    <!-- Semantic Amber Illumination -->
    <radialGradient id="amberAura" cx="50%" cy="38%" r="35%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.22"/>
      <stop offset="50%" stop-color="#d97706" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#050813" stop-opacity="0"/>
    </radialGradient>

    <!-- Gold Foil Gradient -->
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Border Accent Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.8"/>
    </linearGradient>

    <!-- Subtle Glow Filter -->
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

    <filter id="beaconGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="24" result="blur1"/>
      <feGaussianBlur stdDeviation="8" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur1"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Background Grid Pattern -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.75" stroke-opacity="0.35"/>
    </pattern>
  </defs>

  <!-- Background Layer -->
  <rect width="1200" height="630" fill="#020409"/>
  <rect width="1200" height="630" fill="url(#deepBg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Radial Semantic Light -->
  <circle cx="600" cy="240" r="320" fill="url(#amberAura)"/>

  <!-- Outer Architectural Framing -->
  <rect x="28" y="28" width="1144" height="574" rx="8" fill="none" stroke="url(#borderGrad)" stroke-width="1.2"/>
  <rect x="36" y="36" width="1128" height="558" rx="6" fill="none" stroke="#0f172a" stroke-width="0.8" stroke-dasharray="6 6" opacity="0.6"/>

  <!-- Corner Calibration Marks (+) -->
  <g stroke="#f59e0b" stroke-width="1.2" opacity="0.8">
    <!-- Top-Left -->
    <line x1="22" y1="28" x2="34" y2="28"/><line x1="28" y1="22" x2="28" y2="34"/>
    <!-- Top-Right -->
    <line x1="1166" y1="28" x2="1178" y2="28"/><line x1="1172" y1="22" x2="1172" y2="34"/>
    <!-- Bottom-Left -->
    <line x1="22" y1="602" x2="34" y2="602"/><line x1="28" y1="596" x2="28" y2="608"/>
    <!-- Bottom-Right -->
    <line x1="1166" y1="602" x2="1178" y2="602"/><line x1="1172" y1="596" x2="1172" y2="608"/>
  </g>

  <!-- Top Institutional Header Bar -->
  <g transform="translate(60, 68)">
    <!-- System Classification Pill -->
    <rect x="0" y="0" width="280" height="26" rx="13" fill="#0b1329" stroke="#334155" stroke-width="0.8"/>
    <circle cx="14" cy="13" r="4" fill="#f59e0b" filter="url(#softGlow)"/>
    <text x="26" y="17" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="10.5" font-weight="600" fill="#cbd5e1" letter-spacing="0.18em">FIRE KEEPER INTELLIGENCE</text>

    <!-- Governance Badge Right -->
    <g transform="translate(760, 0)">
      <rect x="0" y="0" width="320" height="26" rx="13" fill="#0b1329" stroke="#334155" stroke-width="0.8"/>
      <circle cx="14" cy="13" r="3.5" fill="#10b981"/>
      <text x="26" y="17" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="10" font-weight="500" fill="#94a3b8" letter-spacing="0.12em">ISO 42001 · NIST AI RMF · LEVEL 1-5</text>
    </g>
  </g>

  <!-- Concentric Epistemic Compass Rings -->
  <g opacity="0.45">
    <circle cx="600" cy="225" r="180" stroke="#334155" stroke-width="0.8" stroke-dasharray="4 8" fill="none"/>
    <circle cx="600" cy="225" r="130" stroke="#f59e0b" stroke-width="0.6" stroke-dasharray="2 6" fill="none" opacity="0.6"/>
    <circle cx="600" cy="225" r="85" stroke="#475569" stroke-width="0.8" fill="none"/>
    
    <!-- Crosshairs -->
    <line x1="600" y1="35" x2="600" y2="135" stroke="#334155" stroke-width="0.8" stroke-dasharray="2 4"/>
    <line x1="600" y1="315" x2="600" y2="415" stroke="#334155" stroke-width="0.8" stroke-dasharray="2 4"/>
    <line x1="410" y1="225" x2="510" y2="225" stroke="#334155" stroke-width="0.8" stroke-dasharray="2 4"/>
    <line x1="690" y1="225" x2="790" y2="225" stroke="#334155" stroke-width="0.8" stroke-dasharray="2 4"/>
  </g>

  <!-- Central Firekeeper Beacon / Flame Icon -->
  <g transform="translate(600, 160) scale(2.2)" filter="url(#beaconGlow)">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" 
          fill="none" 
          stroke="url(#goldGradient)" 
          stroke-width="1.6" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="1.5" fill="#fef3c7"/>
  </g>

  <!-- Title: FIRE KEEPER -->
  <text x="600" y="295" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" font-weight="800" font-size="52" fill="#FFFFFF" letter-spacing="0.36em">FIRE KEEPER</text>

  <!-- Subtitle: Executive Decision Intelligence -->
  <text x="600" y="338" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', sans-serif" font-weight="500" font-size="16" fill="#cbd5e1" letter-spacing="0.26em">EXECUTIVE DECISION INTELLIGENCE &amp; AI GOVERNANCE</text>

  <!-- Architecture Pill (PCA v3.0) -->
  <g transform="translate(600, 388)">
    <rect x="-260" y="-18" width="520" height="36" rx="18" fill="#0b1329" fill-opacity="0.9" stroke="url(#borderGrad)" stroke-width="1"/>
    <circle cx="-230" cy="0" r="4.5" fill="#f59e0b" filter="url(#softGlow)"/>
    <text x="10" y="5" text-anchor="middle" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" font-weight="700" fill="#f8fafc" letter-spacing="0.22em">PUNN PREDICTIVE COGNITIVE ARCHITECTURE (PCA v3.0)</text>
  </g>

  <!-- Three Epistemic Pillars -->
  <g transform="translate(600, 442)">
    <text x="0" y="0" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11.5" fill="#94a3b8" letter-spacing="0.24em">
      GROUND TRUTH <tspan fill="#f59e0b">·</tspan> REASONING INTEGRITY <tspan fill="#f59e0b">·</tspan> HUMAN SOVEREIGNTY
    </text>
  </g>

  <!-- Divider Line -->
  <line x1="280" y1="480" x2="920" y2="480" stroke="#1e293b" stroke-width="1"/>
  <line x1="520" y1="480" x2="680" y2="480" stroke="#f59e0b" stroke-width="1.5" opacity="0.8"/>

  <!-- Creed / Quote -->
  <text x="600" y="515" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-style="italic" font-size="14.5" fill="#e2e8f0" letter-spacing="0.08em">
    &#8220;We do not replace human judgment. We illuminate it.&#8221;
  </text>

  <!-- Bottom Institutional Footer -->
  <g transform="translate(60, 565)">
    <!-- Attribution Axiom -->
    <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" fill="#64748b" letter-spacing="0.16em">
      ATTRIBUTION: <tspan fill="#cbd5e1">AI ASSISTS. PUNN CREATES.</tspan>
    </text>
    <!-- Core Methodology -->
    <text x="540" y="0" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10" fill="#64748b" letter-spacing="0.16em">
      12-STAGE EPISTEMIC COGNITIVE ENGINE
    </text>
    <!-- Canonical Domain -->
    <text x="1080" y="0" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="600" fill="#f59e0b" letter-spacing="0.14em">
      https://firekeeper.site
    </text>
  </g>
</svg>`;

// 2. Generate 1000x1000 Square Cover (Executive Book / Avatar / Catalog Standard)
const svgSquare = `<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sqDeepBg" cx="50%" cy="48%" r="65%">
      <stop offset="0%" stop-color="#0d1527"/>
      <stop offset="60%" stop-color="#050813"/>
      <stop offset="100%" stop-color="#020409"/>
    </radialGradient>
    <radialGradient id="sqAmberAura" cx="50%" cy="38%" r="40%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#d97706" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#050813" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sqGoldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="sqBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.8"/>
    </linearGradient>
    <filter id="sqBeaconGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="28" result="blur1"/>
      <feGaussianBlur stdDeviation="10" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur1"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="sqGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.75" stroke-opacity="0.35"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1000" height="1000" fill="#020409"/>
  <rect width="1000" height="1000" fill="url(#sqDeepBg)"/>
  <rect width="1000" height="1000" fill="url(#sqGrid)"/>

  <!-- Radial Illumination -->
  <circle cx="500" cy="380" r="380" fill="url(#sqAmberAura)"/>

  <!-- Framing & Calibration Marks -->
  <rect x="36" y="36" width="928" height="928" rx="10" fill="none" stroke="url(#sqBorderGrad)" stroke-width="1.2"/>
  <rect x="46" y="46" width="908" height="908" rx="8" fill="none" stroke="#0f172a" stroke-width="0.8" stroke-dasharray="6 6" opacity="0.6"/>

  <g stroke="#f59e0b" stroke-width="1.2" opacity="0.8">
    <line x1="30" y1="36" x2="42" y2="36"/><line x1="36" y1="30" x2="36" y2="42"/>
    <line x1="958" y1="36" x2="970" y2="36"/><line x1="964" y1="30" x2="964" y2="42"/>
    <line x1="30" y1="964" x2="42" y2="964"/><line x1="36" y1="958" x2="36" y2="970"/>
    <line x1="958" y1="964" x2="970" y2="964"/><line x1="964" y1="958" x2="964" y2="970"/>
  </g>

  <!-- Top Badges -->
  <g transform="translate(80, 80)">
    <rect x="0" y="0" width="270" height="28" rx="14" fill="#0b1329" stroke="#334155" stroke-width="0.8"/>
    <circle cx="14" cy="14" r="4" fill="#f59e0b"/>
    <text x="28" y="18" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="600" fill="#cbd5e1" letter-spacing="0.16em">FIRE KEEPER INTELLIGENCE</text>
  </g>

  <!-- Concentric Rings -->
  <g opacity="0.45">
    <circle cx="500" cy="360" r="230" stroke="#334155" stroke-width="0.8" stroke-dasharray="4 8" fill="none"/>
    <circle cx="500" cy="360" r="160" stroke="#f59e0b" stroke-width="0.6" stroke-dasharray="2 6" fill="none" opacity="0.6"/>
    <circle cx="500" cy="360" r="105" stroke="#475569" stroke-width="0.8" fill="none"/>
  </g>

  <!-- Beacon Flame Icon -->
  <g transform="translate(500, 275) scale(2.8)" filter="url(#sqBeaconGlow)">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" 
          fill="none" 
          stroke="url(#sqGoldGradient)" 
          stroke-width="1.6" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="1.5" fill="#fef3c7"/>
  </g>

  <!-- Title -->
  <text x="500" y="475" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="62" fill="#FFFFFF" letter-spacing="0.38em">FIRE KEEPER</text>

  <!-- Subtitle -->
  <text x="500" y="525" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="17" fill="#cbd5e1" letter-spacing="0.25em">EXECUTIVE DECISION INTELLIGENCE</text>
  <text x="500" y="555" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="400" font-size="14" fill="#94a3b8" letter-spacing="0.22em">&amp; ENTERPRISE AI GOVERNANCE PLATFORM</text>

  <!-- Architecture Pill -->
  <g transform="translate(500, 630)">
    <rect x="-265" y="-20" width="530" height="40" rx="20" fill="#0b1329" fill-opacity="0.95" stroke="url(#sqBorderGrad)" stroke-width="1.2"/>
    <circle cx="-230" cy="0" r="5" fill="#f59e0b"/>
    <text x="10" y="6" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#f8fafc" letter-spacing="0.2em">PUNN PREDICTIVE COGNITIVE ARCHITECTURE</text>
  </g>
  <text x="500" y="685" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="#f59e0b" letter-spacing="0.3em">PCA v3.0 · 12-STAGE COGNITIVE PIPELINE</text>

  <!-- Creed -->
  <line x1="260" y1="740" x2="740" y2="740" stroke="#1e293b" stroke-width="1"/>
  <line x1="440" y1="740" x2="560" y2="740" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="500" y="780" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-style="italic" font-size="16" fill="#e2e8f0" letter-spacing="0.08em">
    &#8220;We do not replace human judgment. We illuminate it.&#8221;
  </text>
  <text x="500" y="815" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11.5" fill="#94a3b8" letter-spacing="0.24em">
    GROUND TRUTH <tspan fill="#f59e0b">·</tspan> REASONING <tspan fill="#f59e0b">·</tspan> HUMAN SOVEREIGNTY
  </text>

  <!-- Footer -->
  <g transform="translate(80, 915)">
    <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="#64748b" letter-spacing="0.16em">
      ATTRIBUTION: <tspan fill="#cbd5e1">AI ASSISTS. PUNN CREATES.</tspan>
    </text>
    <text x="840" y="0" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="11.5" font-weight="600" fill="#f59e0b" letter-spacing="0.14em">
      https://firekeeper.site
    </text>
  </g>
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

  // 4. Also generate standard share-cover.png alias (1200x630)
  await sharp(Buffer.from(svgLandscape))
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'share-cover.png'));
  console.log('Generated /public/share-cover.png');
}

main().catch(err => {
  console.error('Error generating share images:', err);
  process.exit(1);
});
