import React from 'react';

interface LoadingOverlayProps {
  /** 0..1 — fraction of assets loaded so far */
  progress: number;
  /** True once loading is fully done — used for an exit fade */
  ready: boolean;
}

/**
 * Cyan multi-ring HUD shown over the canvas area while audio assets stream
 * in. Inline SVG so the progress arc + percentage can be driven directly by
 * React state. Ambient elements (rings, brackets, radar sweep, glitch text)
 * are pure SMIL so they keep animating without React re-renders.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress, ready }) => {
  // Progress arc: radius 220, full circumference ≈ 1382. We use pathLength=100
  // so the dasharray works in percentage units regardless of geometry.
  const clamped = Math.max(0, Math.min(1, progress));
  const pct = Math.round(clamped * 100);
  const dashOffset = 100 - clamped * 100;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        opacity: ready ? 0 : 1,
        transform: ready ? 'scale(1.05)' : 'scale(1)',
        transition: 'opacity 0.45s ease-out, transform 0.45s ease-out',
      }}
    >
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full max-w-[560px] max-h-[560px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glow filter — soft cyan halo */}
          <filter id="loadGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>

          {/* Radar sweep gradient — bright at hub, fades to nothing at rim */}
          <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer tick ring (60 small ticks) */}
        <g stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0">
          <animate attributeName="opacity" values="0;0.85" begin="0.15s" dur="0.4s" fill="freeze" />
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
            const x1 = 300 + Math.cos(angle) * 264;
            const y1 = 300 + Math.sin(angle) * 264;
            const x2 = 300 + Math.cos(angle) * 274;
            const y2 = 300 + Math.sin(angle) * 274;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>

        {/* Outer glow ring */}
        <circle cx="300" cy="300" r="250" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0">
          <animate attributeName="opacity" values="0;0.85" begin="0.05s" dur="0.3s" fill="freeze" />
          <animate
            attributeName="r"
            values="250;253;250"
            dur="1.5s"
            repeatCount="indefinite"
            begin="0.8s"
          />
        </circle>

        {/* Inner mid-gap ring — 270° arc with bottom gap (240°→300° empty) */}
        <path
          d="M 300 80 A 220 220 0 1 1 190.18 489.43"
          fill="none"
          stroke="#0e7490"
          strokeWidth="2"
          opacity="0"
        >
          <animate attributeName="opacity" values="0;0.7" begin="0.1s" dur="0.3s" fill="freeze" />
        </path>

        {/* PROGRESS ARC — controlled by React state */}
        <circle
          cx="300"
          cy="300"
          r="220"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="6"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100 100"
          strokeDashoffset={dashOffset}
          transform="rotate(-90 300 300)"
          filter="url(#loadGlow)"
          style={{ transition: 'stroke-dashoffset 0.25s ease-out' }}
        />

        {/* 4-corner brackets framing the inner area */}
        <g stroke="#67e8f9" strokeWidth="3" fill="none" strokeLinecap="square" strokeLinejoin="miter" opacity="0">
          <animate attributeName="opacity" values="0;1" begin="0.1s" dur="0.15s" fill="freeze" />
          <path d="M 145 175 L 145 145 L 175 145" />
          <path d="M 425 145 L 455 145 L 455 175" />
          <path d="M 145 425 L 145 455 L 175 455" />
          <path d="M 455 425 L 455 455 L 425 455" />
        </g>

        {/* Radar sweep line — full radius, rotates 360° in 2s loop */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0.6" begin="0.8s" dur="0.4s" fill="freeze" />
          <line x1="300" y1="300" x2="540" y2="300" stroke="url(#radarGrad)" strokeWidth="3">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="-90 300 300"
              to="270 300 300"
              dur="2.5s"
              repeatCount="indefinite"
              begin="0.8s"
            />
          </line>
        </g>

        {/* "INITIALIZING" text — drawn as plain SVG text to keep React
            re-renders from interfering with per-letter SMIL stagger. */}
        <text
          x="300"
          y="320"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="ui-monospace, 'SF Mono', Menlo, monospace"
          fontSize="32"
          fontWeight="800"
          letterSpacing="6"
          style={{ filter: 'drop-shadow(0 0 10px #22d3ee) drop-shadow(0 0 4px #67e8f9)' }}
        >
          INITIALIZING
        </text>

        {/* Live percentage readout, drawn as plain SVG text since it changes
            every frame and SMIL letterforms would be overkill. */}
        <text
          x="300"
          y="370"
          textAnchor="middle"
          fill="#67e8f9"
          fontFamily="ui-monospace, 'SF Mono', Menlo, monospace"
          fontSize="22"
          fontWeight="700"
          letterSpacing="4"
          style={{ filter: 'drop-shadow(0 0 6px #22d3ee)' }}
        >
          {pct.toString().padStart(3, '0')}%
        </text>

        {/* Underline beneath percentage */}
        <line
          x1="240"
          y1="386"
          x2="360"
          y2="386"
          stroke="#22d3ee"
          strokeWidth="1.5"
          opacity="0.6"
        />
      </svg>
    </div>
  );
};
