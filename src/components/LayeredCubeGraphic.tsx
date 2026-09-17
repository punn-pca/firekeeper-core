import React from 'react';

export const LayeredCubeGraphic: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_20px_rgba(245,158,11,0.35)]"
      >
        <defs>
          <linearGradient id="cubeTop1" x1="80" y1="20" x2="80" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e293b" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="cubeTop2" x1="80" y1="56" x2="80" y2="84" gradientUnits="userSpaceOnUse">
            <stop stopColor="#334155" />
            <stop offset="1" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="cubeTop3" x1="80" y1="92" x2="80" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f172a" />
            <stop offset="1" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="amberGlow" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="0.5" stopColor="#d97706" stopOpacity="0.5" />
            <stop offset="1" stopColor="#b45309" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Bottom Layer 3 */}
        <g transform="translate(0, 30)">
          {/* Top Face */}
          <polygon
            points="80,68 128,94 80,120 32,94"
            fill="url(#cubeTop3)"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />
          {/* Left Face */}
          <polygon
            points="32,94 80,120 80,132 32,106"
            fill="#090d16"
            stroke="#f59e0b"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          {/* Right Face */}
          <polygon
            points="80,120 128,94 128,106 80,132"
            fill="#050811"
            stroke="#f59e0b"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
        </g>

        {/* Middle Layer 2 (Glowing Active) */}
        <g transform="translate(0, 10)">
          {/* Top Face */}
          <polygon
            points="80,48 128,74 80,100 32,74"
            fill="url(#cubeTop2)"
            stroke="#f59e0b"
            strokeWidth="1.8"
            strokeOpacity="0.9"
            filter="url(#glow)"
          />
          {/* Left Face */}
          <polygon
            points="32,74 80,100 80,112 32,86"
            fill="#0f172a"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
          {/* Right Face */}
          <polygon
            points="80,100 128,74 128,86 80,112"
            fill="#0b1120"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
          {/* Glowing Inner Core */}
          <circle cx="80" cy="74" r="5" fill="#f59e0b" filter="url(#glow)" />
        </g>

        {/* Top Layer 1 */}
        <g transform="translate(0, -10)">
          {/* Top Face */}
          <polygon
            points="80,28 128,54 80,80 32,54"
            fill="url(#cubeTop1)"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
          {/* Left Face */}
          <polygon
            points="32,54 80,80 80,92 32,66"
            fill="#1e293b"
            stroke="#f59e0b"
            strokeWidth="0.8"
            strokeOpacity="0.5"
          />
          {/* Right Face */}
          <polygon
            points="80,80 128,54 128,66 80,92"
            fill="#141d2d"
            stroke="#f59e0b"
            strokeWidth="0.8"
            strokeOpacity="0.5"
          />
          {/* Center Vertex Grid Lines */}
          <line x1="80" y1="28" x2="80" y2="80" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.5" />
          <line x1="32" y1="54" x2="128" y2="54" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.5" />
        </g>
      </svg>
    </div>
  );
};
