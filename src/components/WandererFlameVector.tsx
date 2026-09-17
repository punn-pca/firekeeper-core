import React from 'react';

export interface WandererFlameVectorProps {
  className?: string;
}

export const WandererFlameVector: React.FC<WandererFlameVectorProps> = ({
  className = 'w-full max-w-[420px] h-auto',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Ambient Glow Behind Vector */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/15 via-orange-600/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <svg
        viewBox="0 0 500 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
      >
        <defs>
          {/* Celestial Ring Gradient */}
          <linearGradient id="ringGrad" x1="50" y1="50" x2="350" y2="250" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" stopOpacity="0.7" />
            <stop offset="0.5" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0.05" />
          </linearGradient>

          {/* Flame Gradients */}
          <linearGradient id="flameOuter" x1="290" y1="210" x2="290" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f97316" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#fde047" />
          </linearGradient>

          <linearGradient id="flameInner" x1="290" y1="210" x2="290" y2="175" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde047" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>

          <radialGradient id="fireGlow" cx="290" cy="200" r="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="0.6" stopColor="#ea580c" stopOpacity="0.15" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Cliff Gradients */}
          <linearGradient id="cliffGrad" x1="200" y1="180" x2="480" y2="350" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e293b" />
            <stop offset="0.4" stopColor="#0f172a" />
            <stop offset="1" stopColor="#090d16" />
          </linearGradient>

          <linearGradient id="cliffEdge" x1="150" y1="180" x2="480" y2="220" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="0.3" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="1" stopColor="#64748b" stopOpacity="0.2" />
          </linearGradient>

          {/* Wanderer Silhouette Gradient */}
          <linearGradient id="wandererGrad" x1="220" y1="110" x2="250" y2="210" gradientUnits="userSpaceOnUse">
            <stop stopColor="#020617" />
            <stop offset="1" stopColor="#090d16" />
          </linearGradient>

          <filter id="flameBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Starry Galaxy Dots (Constellations) */}
        <g opacity="0.65">
          <circle cx="60" cy="40" r="1.5" fill="#fde047" />
          <circle cx="120" cy="25" r="1" fill="#ffffff" />
          <circle cx="180" cy="65" r="1.5" fill="#ffffff" />
          <circle cx="95" cy="90" r="0.8" fill="#38bdf8" />
          <circle cx="230" cy="35" r="1.2" fill="#ffffff" />
          <circle cx="340" cy="50" r="1.8" fill="#fbbf24" />
          <circle cx="410" cy="30" r="1" fill="#ffffff" />
          <circle cx="460" cy="70" r="1.5" fill="#38bdf8" />
          <circle cx="390" cy="110" r="1.2" fill="#ffffff" />
          <circle cx="150" cy="140" r="1" fill="#ffffff" />
          <circle cx="40" cy="160" r="1.2" fill="#ffffff" />
          <line x1="60" y1="40" x2="120" y2="25" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
          <line x1="120" y1="25" x2="180" y2="65" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
          <line x1="340" y1="50" x2="410" y2="30" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
        </g>

        {/* 2. Celestial Orbital Crescent Arc Lines */}
        <path
          d="M 20 180 A 180 180 0 0 1 380 60"
          stroke="url(#ringGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <path
          d="M 60 220 A 160 160 0 0 1 350 90"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeOpacity="0.6"
          filter="url(#flameBlur)"
        />
        <path
          d="M 80 240 A 140 140 0 0 1 320 110"
          stroke="#38bdf8"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* Distant Mountain Peak Silhouettes */}
        <polygon
          points="10,270 90,190 170,270"
          fill="#0c1322"
          stroke="#1e293b"
          strokeWidth="0.8"
          opacity="0.7"
        />
        <polygon
          points="110,280 190,175 270,280"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="0.8"
          opacity="0.8"
        />

        {/* 3. Mountain Cliff & Precipice Ground (Right side) */}
        <polygon
          points="160,240 210,205 280,205 340,215 420,235 490,260 500,360 140,360"
          fill="url(#cliffGrad)"
        />
        {/* Cliff Top Edge Highlight */}
        <path
          d="M 160 240 L 210 205 L 280 205 L 340 215 L 420 235 L 490 260"
          stroke="url(#cliffEdge)"
          strokeWidth="2"
          fill="none"
        />
        {/* Cliff Crevices & Texture Details */}
        <path
          d="M 210 205 L 230 260 M 280 205 L 295 275 M 340 215 L 330 290 M 420 235 L 440 310"
          stroke="#334155"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* 4. Glowing Campfire & Radiant Embers */}
        {/* Ambient Fire Aura Glow */}
        <circle cx="295" cy="195" r="70" fill="url(#fireGlow)" />

        {/* Campfire Wood Logs */}
        <line x1="278" y1="210" x2="312" y2="204" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
        <line x1="280" y1="205" x2="310" y2="209" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />

        {/* Outer Flame */}
        <path
          d="M 295 155 C 285 175 275 185 278 205 C 280 212 310 212 312 205 C 315 185 305 170 295 155 Z"
          fill="url(#flameOuter)"
          filter="url(#flameBlur)"
        />
        {/* Inner Bright Flame Core */}
        <path
          d="M 295 168 C 288 180 284 190 286 204 C 288 208 302 208 304 204 C 306 190 302 180 295 168 Z"
          fill="url(#flameInner)"
        />
        {/* Rising Spark Embers */}
        <circle cx="292" cy="148" r="1.5" fill="#fde047" className="animate-ping" />
        <circle cx="300" cy="138" r="1" fill="#f97316" />
        <circle cx="288" cy="130" r="1.2" fill="#fbbf24" />
        <circle cx="296" cy="120" r="0.8" fill="#fef08a" />

        {/* 5. Wanderer (Person Standing) Vector Silhouette */}
        <g transform="translate(10, 0)">
          {/* Standing Shadow on Ground */}
          <ellipse cx="232" cy="208" rx="14" ry="3" fill="#000000" opacity="0.6" />

          {/* Boots / Legs */}
          <path d="M 228 185 L 227 207 M 236 185 L 237 207" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

          {/* Long Flowing Cloak / Robe Body */}
          <path
            d="M 226 135 C 220 150 218 175 220 190 C 224 192 242 192 244 190 C 246 175 244 150 238 135 Z"
            fill="url(#wandererGrad)"
          />

          {/* Cloak Folds & Firelight Highlight on Back/Edge */}
          <path
            d="M 238 135 C 244 150 246 175 244 190"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeOpacity="0.8"
            fill="none"
          />

          {/* Hooded Head */}
          <path
            d="M 226 128 C 226 118 232 112 236 112 C 240 112 244 118 244 128 C 244 135 226 135 226 128 Z"
            fill="#020617"
          />
          {/* Face/Hood Rim Warm Reflection */}
          <path
            d="M 238 116 C 242 120 243 126 242 130"
            stroke="#fbbf24"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Wanderer Walking Staff (Optional Iconic Detail) */}
          <line
            x1="248" y1="120"
            x2="249" y2="208"
            stroke="#78350f"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Staff Head Gem Glow */}
          <circle cx="248" cy="120" r="2.5" fill="#38bdf8" filter="url(#flameBlur)" />
        </g>
      </svg>
    </div>
  );
};
