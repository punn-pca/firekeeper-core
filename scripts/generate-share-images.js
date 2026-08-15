import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 1. Generate 1200x630 OG Landscape Image (Standard Open Graph for FB/Twitter/LinkedIn/Line)
const svgLandscape = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1c1917" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#0c0a09" stop-opacity="1"/>
      <stop offset="100%" stop-color="#050505" stop-opacity="1"/>
    </radialGradient>

    <radialGradient id="goldCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FDE047" stop-opacity="0.8"/>
      <stop offset="30%" stop-color="#D97706" stop-opacity="0.4"/>
      <stop offset="70%" stop-color="#92400E" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Metallic Gold Gradients -->
    <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDF3C7"/>
      <stop offset="25%" stop-color="#F59E0B"/>
      <stop offset="50%" stop-color="#D97706"/>
      <stop offset="75%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>

    <linearGradient id="goldLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#78350F"/>
    </linearGradient>

    <linearGradient id="bookSpine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.9"/>
      <stop offset="20%" stop-color="#262626" stop-opacity="0.3"/>
      <stop offset="40%" stop-color="#0a0a0a" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
    </linearGradient>

    <!-- Filter for Gold Glow -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <style>
    .title { font-family: 'Cinzel', 'Trajan Pro', 'Georgia', serif; font-weight: 800; letter-spacing: 0.22em; fill: url(#goldFoil); }
    .subhead { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; font-weight: 600; letter-spacing: 0.35em; fill: #D97706; }
    .tagline { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; font-weight: 500; letter-spacing: 0.28em; fill: #FDE68A; }
    .quote { font-family: 'Georgia', serif; font-style: italic; letter-spacing: 0.05em; fill: #E2E8F0; }
    .principle { font-family: 'Inter', system-ui, sans-serif; font-size: 11px; letter-spacing: 0.3em; fill: #94A3B8; }
    .badge-text { font-family: 'Inter', system-ui, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; fill: #FDE047; }
    .gold-stroke { stroke: url(#goldFoil); fill: none; }
  </style>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="#09090b"/>
  <rect width="1200" height="630" fill="url(#bgGlow)"/>

  <!-- Center Ambient Spotlights -->
  <circle cx="600" cy="315" r="380" fill="url(#goldCore)"/>

  <!-- Outer Card Frame (Embossed Gold Border) -->
  <rect x="25" y="25" width="1150" height="580" rx="16" fill="#0c0a09" fill-opacity="0.7" stroke="url(#goldFoil)" stroke-width="1.5" stroke-opacity="0.6"/>
  <rect x="35" y="35" width="1130" height="560" rx="12" fill="none" stroke="#F59E0B" stroke-width="0.5" stroke-opacity="0.3"/>

  <!-- Corner Accents -->
  <path d="M 45 65 L 45 45 L 65 45" stroke="url(#goldFoil)" stroke-width="2" fill="none"/>
  <path d="M 1155 65 L 1155 45 L 1135 45" stroke="url(#goldFoil)" stroke-width="2" fill="none"/>
  <path d="M 45 565 L 45 585 L 65 585" stroke="url(#goldFoil)" stroke-width="2" fill="none"/>
  <path d="M 1155 565 L 1155 585 L 1135 585" stroke="url(#goldFoil)" stroke-width="2" fill="none"/>

  <!-- CENTER BOOK COVER MOCKUP (Left/Center Composition) -->
  <g transform="translate(100, 45)">
    <!-- Book Shadow -->
    <rect x="30" y="30" width="460" height="480" rx="14" fill="#000000" fill-opacity="0.8" filter="url(#glow)"/>

    <!-- Book Hardcover Body -->
    <rect x="20" y="20" width="460" height="500" rx="12" fill="#121110" stroke="url(#goldFoil)" stroke-width="2"/>
    <rect x="30" y="30" width="440" height="480" rx="8" fill="none" stroke="#F59E0B" stroke-width="0.8" stroke-opacity="0.5"/>

    <!-- Book Spine Ribbon &amp; Elastic Band -->
    <rect x="20" y="20" width="18" height="500" rx="2" fill="url(#bookSpine)"/>
    <rect x="420" y="20" width="14" height="500" fill="#0a0a0a" stroke="#262626" stroke-width="0.5"/>

    <!-- Flame Sacred Geometry Emblem -->
    <g transform="translate(250, 85)" filter="url(#softGlow)">
      <!-- Outer Celestial Orbit Rings -->
      <circle cx="0" cy="0" r="32" stroke="url(#goldFoil)" stroke-width="0.75" fill="none" stroke-dasharray="3, 3"/>
      <circle cx="0" cy="0" r="26" stroke="#FEF08A" stroke-width="1" fill="none" opacity="0.6"/>
      <circle cx="0" cy="0" r="20" stroke="url(#goldFoil)" stroke-width="0.5" fill="none"/>
      
      <!-- Flame Path -->
      <path d="M 0 -18 C 6 -10 14 -4 14 6 C 14 14 8 20 0 20 C -8 20 -14 14 -14 6 C -14 -1 -8 -7 -4 -12 C -4 -4 0 2 4 4 C 5 0 2 -8 0 -18 Z" fill="url(#goldLight)"/>
      <circle cx="0" cy="5" r="3" fill="#FFFBEB" filter="url(#glow)"/>
    </g>

    <!-- Main Title -->
    <text x="250" y="150" text-anchor="middle" class="title" font-size="28" filter="url(#softGlow)">FIREKEEPER</text>
    
    <!-- PCA Subtitle with dividers -->
    <line x1="80" y1="172" x2="195" y2="172" stroke="url(#goldFoil)" stroke-width="1.2"/>
    <text x="250" y="178" text-anchor="middle" class="title" font-size="22" letter-spacing="0.3em">PCA</text>
    <line x1="305" y1="172" x2="420" y2="172" stroke="url(#goldFoil)" stroke-width="1.2"/>

    <text x="250" y="198" text-anchor="middle" class="subhead" font-size="9.5">PUNN COGNITIVE ARCHITECTURE</text>
    <text x="250" y="218" text-anchor="middle" class="tagline" font-size="8">THINK DEEPLY  •  DECIDE WISELY  •  LEAVE NO TRACE</text>

    <!-- Neural Network Wireframe Head Illustration -->
    <g transform="translate(250, 290)">
      <!-- Head Contour Profile &amp; Sacred Geometry -->
      <circle cx="0" cy="0" r="55" stroke="url(#goldFoil)" stroke-width="0.6" stroke-opacity="0.4" stroke-dasharray="2, 4" fill="none"/>
      <circle cx="0" cy="0" r="40" stroke="#F59E0B" stroke-width="0.8" stroke-opacity="0.6" fill="none"/>
      <circle cx="0" cy="0" r="24" stroke="url(#goldFoil)" stroke-width="1" fill="none"/>
      
      <!-- Center Radiant Pineal Core -->
      <circle cx="0" cy="0" r="6" fill="#FEF08A" filter="url(#glow)"/>

      <!-- Synaptic Lines &amp; Nodes -->
      <line x1="0" y1="0" x2="-28" y2="-22" stroke="#FBBF24" stroke-width="0.8" stroke-opacity="0.7"/>
      <line x1="0" y1="0" x2="28" y2="-22" stroke="#FBBF24" stroke-width="0.8" stroke-opacity="0.7"/>
      <line x1="0" y1="0" x2="-35" y2="15" stroke="#FBBF24" stroke-width="0.8" stroke-opacity="0.7"/>
      <line x1="0" y1="0" x2="35" y2="15" stroke="#FBBF24" stroke-width="0.8" stroke-opacity="0.7"/>
      <line x1="0" y1="0" x2="0" y2="-38" stroke="#FBBF24" stroke-width="0.8" stroke-opacity="0.7"/>
      <line x1="0" y1="0" x2="0" y2="38" stroke="#FBBF24" stroke-width="0.8" stroke-opacity="0.7"/>
      <line x1="-28" y1="-22" x2="0" y2="-38" stroke="#F59E0B" stroke-width="0.6" stroke-opacity="0.5"/>
      <line x1="28" y1="-22" x2="0" y2="-38" stroke="#F59E0B" stroke-width="0.6" stroke-opacity="0.5"/>
      <line x1="-35" y1="15" x2="0" y2="38" stroke="#F59E0B" stroke-width="0.6" stroke-opacity="0.5"/>
      <line x1="35" y1="15" x2="0" y2="38" stroke="#F59E0B" stroke-width="0.6" stroke-opacity="0.5"/>
      
      <circle cx="-28" cy="-22" r="3" fill="#FDE68A"/>
      <circle cx="28" cy="-22" r="3" fill="#FDE68A"/>
      <circle cx="-35" cy="15" r="3" fill="#FDE68A"/>
      <circle cx="35" cy="15" r="3" fill="#FDE68A"/>
      <circle cx="0" cy="-38" r="3" fill="#FDE68A"/>
      <circle cx="0" cy="38" r="3" fill="#FDE68A"/>
    </g>

    <!-- Quote &amp; Principle -->
    <text x="250" y="390" text-anchor="middle" font-size="15" fill="#D97706" font-weight="bold">“</text>
    <text x="250" y="410" text-anchor="middle" class="quote" font-size="11.5">"We don't replace judgment.</text>
    <text x="250" y="428" text-anchor="middle" class="quote" font-size="11.5">We illuminate it."</text>
    <text x="250" y="450" text-anchor="middle" class="principle">— THE FIREKEEPER PRINCIPLE —</text>

    <!-- Bottom Branding -->
    <line x1="90" y1="472" x2="410" y2="472" stroke="url(#goldFoil)" stroke-width="0.6" stroke-opacity="0.5"/>
    <text x="140" y="488" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-weight="700" font-size="11" fill="url(#goldFoil)" letter-spacing="0.25em">PUNN</text>
    <text x="320" y="485" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600" font-size="8.5" fill="#D97706" letter-spacing="0.2em">THE FIREKEEPER</text>
    <text x="320" y="496" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" fill="#94A3B8" letter-spacing="0.18em">STRATEGIC MYSTIC</text>
  </g>

  <!-- RIGHT SIDE: EXECUTIVE METADATA &amp; 5 PILLARS -->
  <g transform="translate(640, 75)">
    <!-- Platform Badge -->
    <rect x="0" y="0" width="240" height="28" rx="14" fill="#1e1b4b" stroke="#6366F1" stroke-width="1"/>
    <text x="120" y="18" text-anchor="middle" font-family="Inter, sans-serif" font-size="10.5" font-weight="700" fill="#A5B4FC" letter-spacing="0.15em">⚡ ENTERPRISE AI GOVERNANCE</text>

    <!-- Huge Headline -->
    <text x="0" y="70" font-family="'Cinzel', Georgia, serif" font-weight="800" font-size="34" fill="#FFFFFF" letter-spacing="0.05em">FIRE KEEPER OS</text>
    <text x="0" y="102" font-family="Inter, sans-serif" font-weight="600" font-size="16" fill="#FBBF24" letter-spacing="0.08em">Executive Decision Intelligence System</text>
    
    <text x="0" y="132" font-family="Inter, sans-serif" font-size="13" fill="#94A3B8">
      PUNN PCA 12-Stage Epistemic Reasoning,
    </text>
    <text x="0" y="152" font-family="Inter, sans-serif" font-size="13" fill="#94A3B8">
      Cryptographic WORM Ledger, ACH Matrix, ISO/IEC 42001 &amp; NIST AI RMF
    </text>

    <!-- 5 Governance Pillars Grid -->
    <g transform="translate(0, 180)">
      <!-- Pillar 1: Cognitive -->
      <g transform="translate(0, 0)">
        <rect width="220" height="52" rx="8" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
        <circle cx="28" cy="26" r="14" fill="#78350F" stroke="#F59E0B" stroke-width="1"/>
        <text x="28" y="30" text-anchor="middle" font-size="12">🧠</text>
        <text x="52" y="24" class="badge-text">COGNITIVE</text>
        <text x="52" y="38" font-family="Inter, sans-serif" font-size="10" fill="#94A3B8">12-Stage Epistemic Loop</text>
      </g>

      <!-- Pillar 2: Governance -->
      <g transform="translate(240, 0)">
        <rect width="220" height="52" rx="8" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
        <circle cx="28" cy="26" r="14" fill="#78350F" stroke="#F59E0B" stroke-width="1"/>
        <text x="28" y="30" text-anchor="middle" font-size="12">🛡️</text>
        <text x="52" y="24" class="badge-text">GOVERNANCE</text>
        <text x="52" y="38" font-family="Inter, sans-serif" font-size="10" fill="#94A3B8">ISO 42001 &amp; NIST AI RMF</text>
      </g>

      <!-- Pillar 3: Auditable -->
      <g transform="translate(0, 64)">
        <rect width="220" height="52" rx="8" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
        <circle cx="28" cy="26" r="14" fill="#78350F" stroke="#F59E0B" stroke-width="1"/>
        <text x="28" y="30" text-anchor="middle" font-size="12">🔏</text>
        <text x="52" y="24" class="badge-text">AUDITABLE</text>
        <text x="52" y="38" font-family="Inter, sans-serif" font-size="10" fill="#94A3B8">WORM SHA-256 Trails</text>
      </g>

      <!-- Pillar 4: Human-Centered -->
      <g transform="translate(240, 64)">
        <rect width="220" height="52" rx="8" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
        <circle cx="28" cy="26" r="14" fill="#78350F" stroke="#F59E0B" stroke-width="1"/>
        <text x="28" y="30" text-anchor="middle" font-size="12">👥</text>
        <text x="52" y="24" class="badge-text">HUMAN-CENTERED</text>
        <text x="52" y="38" font-family="Inter, sans-serif" font-size="10" fill="#94A3B8">Executive In-the-Loop</text>
      </g>

      <!-- Pillar 5: Ethical -->
      <g transform="translate(0, 128)">
        <rect width="460" height="52" rx="8" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
        <circle cx="28" cy="26" r="14" fill="#78350F" stroke="#F59E0B" stroke-width="1"/>
        <text x="28" y="30" text-anchor="middle" font-size="12">♾️</text>
        <text x="52" y="24" class="badge-text">ETHICAL INTEGRITY</text>
        <text x="52" y="38" font-family="Inter, sans-serif" font-size="10" fill="#94A3B8">Admiralty Scale &amp; Automated Red Team Simulation</text>
      </g>
    </g>

    <!-- Footer URL &amp; Verification Badge -->
    <g transform="translate(0, 395)">
      <line x1="0" y1="0" x2="460" y2="0" stroke="#3f3f46" stroke-width="1"/>
      <text x="0" y="24" font-family="Inter, monospace" font-size="13" font-weight="600" fill="#F59E0B">🔗 https://firekeeper.site</text>
      <text x="460" y="24" text-anchor="end" font-family="Inter, sans-serif" font-size="11" font-weight="500" fill="#10B981">✓ Cryptographically Verified OS</text>
    </g>
  </g>
</svg>`;

// 2. Generate 1000x1000 Square Cover (Exact 1:1 Book Cover Format)
const svgSquare = `<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sqBgGlow" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1c1917" stop-opacity="1"/>
      <stop offset="60%" stop-color="#0c0a09" stop-opacity="1"/>
      <stop offset="100%" stop-color="#050505" stop-opacity="1"/>
    </radialGradient>

    <radialGradient id="sqGoldCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FDE047" stop-opacity="0.9"/>
      <stop offset="35%" stop-color="#D97706" stop-opacity="0.4"/>
      <stop offset="70%" stop-color="#78350F" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="sqGoldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A"/>
      <stop offset="25%" stop-color="#F59E0B"/>
      <stop offset="50%" stop-color="#D97706"/>
      <stop offset="75%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#92400E"/>
    </linearGradient>

    <linearGradient id="sqSpine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.95"/>
      <stop offset="25%" stop-color="#262626" stop-opacity="0.4"/>
      <stop offset="45%" stop-color="#0a0a0a" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
    </linearGradient>

    <filter id="sqGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="sqSoftGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <style>
    .sq-title { font-family: 'Cinzel', 'Trajan Pro', 'Georgia', serif; font-weight: 800; letter-spacing: 0.24em; fill: url(#sqGoldFoil); }
    .sq-subhead { font-family: 'Inter', system-ui, sans-serif; font-weight: 600; letter-spacing: 0.38em; fill: #D97706; }
    .sq-tagline { font-family: 'Inter', system-ui, sans-serif; font-weight: 500; letter-spacing: 0.3em; fill: #FEF08A; }
    .sq-quote { font-family: 'Georgia', serif; font-style: italic; letter-spacing: 0.05em; fill: #E2E8F0; }
    .sq-principle { font-family: 'Inter', system-ui, sans-serif; font-size: 14px; letter-spacing: 0.32em; fill: #94A3B8; }
    .sq-badge { font-family: 'Inter', system-ui, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; fill: #FDE047; }
  </style>

  <!-- Background Base -->
  <rect width="1000" height="1000" fill="#09090b"/>
  <rect width="1000" height="1000" fill="url(#sqBgGlow)"/>

  <!-- Book Hardcover Container -->
  <g transform="translate(100, 40)">
    <!-- Book Shadow -->
    <rect x="25" y="25" width="750" height="890" rx="20" fill="#000000" fill-opacity="0.85" filter="url(#sqGlow)"/>

    <!-- Book Cover Surface (Leather Feel) -->
    <rect x="10" y="10" width="760" height="900" rx="18" fill="#141210" stroke="url(#sqGoldFoil)" stroke-width="2.5"/>
    <rect x="25" y="25" width="730" height="870" rx="12" fill="none" stroke="#F59E0B" stroke-width="1" stroke-opacity="0.5"/>

    <!-- Spine and Bookmark Ribbon / Strap -->
    <rect x="10" y="10" width="30" height="900" rx="4" fill="url(#sqSpine)"/>
    <rect x="670" y="10" width="22" height="900" fill="#0a0a0a" stroke="#262626" stroke-width="0.8"/>
    
    <!-- Bookmark Ribbon Tab at bottom -->
    <polygon points="20,910 20,950 35,935 50,950 50,910" fill="#1c1917" stroke="url(#sqGoldFoil)" stroke-width="1"/>

    <!-- Top Celestial Flame Emblem -->
    <g transform="translate(390, 130)" filter="url(#sqSoftGlow)">
      <circle cx="0" cy="0" r="52" stroke="url(#sqGoldFoil)" stroke-width="1" fill="none" stroke-dasharray="4, 4"/>
      <circle cx="0" cy="0" r="42" stroke="#FEF08A" stroke-width="1.2" fill="none" opacity="0.7"/>
      <circle cx="0" cy="0" r="32" stroke="url(#sqGoldFoil)" stroke-width="0.8" fill="none"/>
      
      <!-- Glowing Flame -->
      <path d="M 0 -28 C 10 -16 22 -6 22 10 C 22 22 12 32 0 32 C -12 32 -22 22 -22 10 C -22 -2 -12 -12 -6 -20 C -6 -6 0 4 6 6 C 8 0 4 -12 0 -28 Z" fill="url(#sqGoldFoil)"/>
      <circle cx="0" cy="8" r="5" fill="#FFFBEB" filter="url(#sqGlow)"/>
    </g>

    <!-- Main Title -->
    <text x="390" y="245" text-anchor="middle" class="sq-title" font-size="44" filter="url(#sqSoftGlow)">FIREKEEPER</text>
    
    <!-- PCA Subtitle with dividers -->
    <line x1="120" y1="285" x2="300" y2="285" stroke="url(#sqGoldFoil)" stroke-width="1.8"/>
    <text x="390" y="295" text-anchor="middle" class="sq-title" font-size="34" letter-spacing="0.32em">PCA</text>
    <line x1="480" y1="285" x2="660" y2="285" stroke="url(#sqGoldFoil)" stroke-width="1.8"/>

    <text x="390" y="332" text-anchor="middle" class="sq-subhead" font-size="14.5">PUNN COGNITIVE ARCHITECTURE</text>
    <text x="390" y="365" text-anchor="middle" class="sq-tagline" font-size="12">THINK DEEPLY  •  DECIDE WISELY  •  LEAVE NO TRACE</text>

    <!-- Center Neural Network Head Wireframe &amp; Core -->
    <g transform="translate(390, 485)">
      <!-- Ambient Glow Core -->
      <circle cx="0" cy="0" r="90" fill="url(#sqGoldCore)"/>

      <circle cx="0" cy="0" r="95" stroke="url(#sqGoldFoil)" stroke-width="0.8" stroke-opacity="0.5" stroke-dasharray="3, 5" fill="none"/>
      <circle cx="0" cy="0" r="70" stroke="#F59E0B" stroke-width="1" stroke-opacity="0.7" fill="none"/>
      <circle cx="0" cy="0" r="42" stroke="url(#sqGoldFoil)" stroke-width="1.2" fill="none"/>

      <!-- Radiant Center -->
      <circle cx="0" cy="0" r="10" fill="#FEF08A" filter="url(#sqGlow)"/>

      <!-- Synaptic Matrix -->
      <line x1="0" y1="0" x2="-48" y2="-38" stroke="#FBBF24" stroke-width="1" stroke-opacity="0.8"/>
      <line x1="0" y1="0" x2="48" y2="-38" stroke="#FBBF24" stroke-width="1" stroke-opacity="0.8"/>
      <line x1="0" y1="0" x2="-60" y2="28" stroke="#FBBF24" stroke-width="1" stroke-opacity="0.8"/>
      <line x1="0" y1="0" x2="60" y2="28" stroke="#FBBF24" stroke-width="1" stroke-opacity="0.8"/>
      <line x1="0" y1="0" x2="0" y2="-65" stroke="#FBBF24" stroke-width="1" stroke-opacity="0.8"/>
      <line x1="0" y1="0" x2="0" y2="65" stroke="#FBBF24" stroke-width="1" stroke-opacity="0.8"/>

      <line x1="-48" y1="-38" x2="0" y2="-65" stroke="#F59E0B" stroke-width="0.8" stroke-opacity="0.6"/>
      <line x1="48" y1="-38" x2="0" y2="-65" stroke="#F59E0B" stroke-width="0.8" stroke-opacity="0.6"/>
      <line x1="-60" y1="28" x2="0" y2="65" stroke="#F59E0B" stroke-width="0.8" stroke-opacity="0.6"/>
      <line x1="60" y1="28" x2="0" y2="65" stroke="#F59E0B" stroke-width="0.8" stroke-opacity="0.6"/>
      <line x1="-48" y1="-38" x2="-60" y2="28" stroke="#F59E0B" stroke-width="0.8" stroke-opacity="0.6"/>
      <line x1="48" y1="-38" x2="60" y2="28" stroke="#F59E0B" stroke-width="0.8" stroke-opacity="0.6"/>

      <circle cx="-48" cy="-38" r="4.5" fill="#FDE68A"/>
      <circle cx="48" cy="-38" r="4.5" fill="#FDE68A"/>
      <circle cx="-60" cy="28" r="4.5" fill="#FDE68A"/>
      <circle cx="60" cy="28" r="4.5" fill="#FDE68A"/>
      <circle cx="0" cy="-65" r="4.5" fill="#FDE68A"/>
      <circle cx="0" cy="65" r="4.5" fill="#FDE68A"/>
    </g>

    <!-- Quotes and Philosophy -->
    <text x="390" y="640" text-anchor="middle" font-size="24" fill="#D97706" font-weight="bold">“</text>
    <text x="390" y="670" text-anchor="middle" class="sq-quote" font-size="18">"We don't replace judgment.</text>
    <text x="390" y="698" text-anchor="middle" class="sq-quote" font-size="18">We illuminate it."</text>
    <text x="390" y="738" text-anchor="middle" class="sq-principle">— THE FIREKEEPER PRINCIPLE —</text>

    <!-- Bottom Signature Branding -->
    <line x1="140" y1="785" x2="640" y2="785" stroke="url(#sqGoldFoil)" stroke-width="1" stroke-opacity="0.6"/>
    <text x="230" y="812" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-weight="700" font-size="18" fill="url(#sqGoldFoil)" letter-spacing="0.25em">PUNN</text>
    <text x="500" y="806" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600" font-size="13" fill="#D97706" letter-spacing="0.2em">THE FIREKEEPER</text>
    <text x="500" y="824" text-anchor="middle" font-family="Inter, sans-serif" font-size="10.5" fill="#94A3B8" letter-spacing="0.18em">STRATEGIC MYSTIC</text>

    <!-- Right Margin Hex Icons (The 5 Pillars) -->
    <g transform="translate(712, 160)">
      <!-- 1. Cognitive -->
      <g transform="translate(0, 0)">
        <polygon points="20,0 38,10 38,30 20,40 2,30 2,10" fill="#1c1917" stroke="url(#sqGoldFoil)" stroke-width="1"/>
        <text x="20" y="24" text-anchor="middle" font-size="14">🧠</text>
        <text x="20" y="52" text-anchor="middle" class="sq-badge" font-size="8">COGNITIVE</text>
      </g>

      <!-- 2. Governance -->
      <g transform="translate(0, 110)">
        <polygon points="20,0 38,10 38,30 20,40 2,30 2,10" fill="#1c1917" stroke="url(#sqGoldFoil)" stroke-width="1"/>
        <text x="20" y="24" text-anchor="middle" font-size="14">🛡️</text>
        <text x="20" y="52" text-anchor="middle" class="sq-badge" font-size="8">GOVERNANCE</text>
      </g>

      <!-- 3. Auditable -->
      <g transform="translate(0, 220)">
        <polygon points="20,0 38,10 38,30 20,40 2,30 2,10" fill="#1c1917" stroke="url(#sqGoldFoil)" stroke-width="1"/>
        <text x="20" y="24" text-anchor="middle" font-size="14">🔏</text>
        <text x="20" y="52" text-anchor="middle" class="sq-badge" font-size="8">AUDITABLE</text>
      </g>

      <!-- 4. Human-Centered -->
      <g transform="translate(0, 330)">
        <polygon points="20,0 38,10 38,30 20,40 2,30 2,10" fill="#1c1917" stroke="url(#sqGoldFoil)" stroke-width="1"/>
        <text x="20" y="24" text-anchor="middle" font-size="14">👥</text>
        <text x="20" y="52" text-anchor="middle" class="sq-badge" font-size="7.5">HUMAN-CENTERED</text>
      </g>

      <!-- 5. Ethical -->
      <g transform="translate(0, 440)">
        <polygon points="20,0 38,10 38,30 20,40 2,30 2,10" fill="#1c1917" stroke="url(#sqGoldFoil)" stroke-width="1"/>
        <text x="20" y="24" text-anchor="middle" font-size="14">♾️</text>
        <text x="20" y="52" text-anchor="middle" class="sq-badge" font-size="8">ETHICAL</text>
      </g>
    </g>
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
