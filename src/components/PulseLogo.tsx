import React from 'react';

interface PulseLogoProps {
  /** @deprecated — kept so existing callers compile; the new logo runs a
   * continuous CSS animation loop and no longer needs per-round triggers. */
  flipNonce?: number;
  className?: string;
}

/**
 * PULSE wordmark + mini roulette.
 *
 * Ported verbatim from /Users/shan/.gemini/antigravity/scratch/pulse_logo.html
 * with the same 10:6 viewBox, the same 25-layer 3D extrusion, the same
 * spinning cybernetic roulette frame behind the text, the same orbiting
 * ball, corner brackets, scan-lines, and all CSS keyframe animations
 * (word-beat, roulette-pulse, roulette-spin, ball-orbit, flare, twinkle).
 *
 * The only structural changes vs. the source HTML:
 *   • CSS animation rules are scoped to `.pulse-logo-root` so they can't
 *     collide with other page styles.
 *   • `#glow-intense` filter is explicitly defined (the source HTML
 *     references it without declaring it — browsers silently no-op).
 */
export const PulseLogo: React.FC<PulseLogoProps> = ({ className }) => {
  return (
    <div className={`pulse-logo-root ${className ?? ''}`}>
      <style>{`
        .pulse-logo-root { display: block; line-height: 0; }
        .pulse-logo-root svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 30px rgba(150, 200, 255, 0.05));
          font-family: 'Orbitron', sans-serif;
        }
        .pulse-logo-root .word-beat {
          transform-origin: 0px 0px;
          animation: pl-double-pump 1.5s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
        }
        .pulse-logo-root .roulette-pulse {
          transform-origin: 0px 0px;
          animation: pl-double-pump-ring 1.5s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
        }
        .pulse-logo-root .roulette-spin {
          transform-origin: 0px 0px;
          animation: pl-spin 30s linear infinite;
        }
        .pulse-logo-root .ball-orbit {
          transform-origin: 0px 0px;
          animation: pl-spin-reverse 2.5s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
        }
        .pulse-logo-root .flare {
          animation: pl-flare-sweep 3.5s ease-in-out infinite;
          transform: skewX(-30deg);
        }
        .pulse-logo-root .star {
          animation: pl-twinkle linear infinite;
        }
        .pulse-logo-root .extrusion {
          fill: url(#pl-silver-side);
          stroke: #171b26;
          stroke-width: 0.5px;
          stroke-linejoin: round;
        }
        .pulse-logo-root .top-layer {
          fill: url(#pl-silver-top);
          stroke: rgba(255, 255, 255, 0.9);
          stroke-width: 2.5px;
          stroke-linejoin: round;
          filter: url(#pl-glow);
        }
        .pulse-logo-root .scanline-layer {
          fill: url(#pl-scanlines);
        }

        @keyframes pl-double-pump {
          0%   { transform: scale(1); filter: brightness(1); }
          10%  { transform: scale(1.05); filter: brightness(1.2); }
          18%  { transform: scale(1.01); filter: brightness(1); }
          28%  { transform: scale(1.07); filter: brightness(1.4); }
          40%  { transform: scale(1); filter: brightness(1); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        @keyframes pl-double-pump-ring {
          0%   { transform: scale(1); opacity: 0.5; filter: drop-shadow(0 0 0px #fff); }
          10%  { transform: scale(1.03); opacity: 1; filter: drop-shadow(0 0 15px rgba(200, 220, 255, 0.5)); }
          18%  { transform: scale(1.01); opacity: 0.6; filter: drop-shadow(0 0 0px #fff); }
          28%  { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 25px rgba(200, 220, 255, 0.8)); }
          40%  { transform: scale(1); opacity: 0.5; filter: drop-shadow(0 0 0px #fff); }
          100% { transform: scale(1); opacity: 0.5; filter: drop-shadow(0 0 0px #fff); }
        }
        @keyframes pl-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pl-spin-reverse {
          0%   { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes pl-flare-sweep {
          0%   { transform: translateX(-400px) skewX(-30deg); opacity: 0; }
          15%  { transform: translateX(-400px) skewX(-30deg); opacity: 0; }
          35%  { transform: translateX(450px) skewX(-30deg); opacity: 1; }
          55%  { transform: translateX(450px) skewX(-30deg); opacity: 0; }
          100% { transform: translateX(450px) skewX(-30deg); opacity: 0; }
        }
        @keyframes pl-twinkle {
          0%   { opacity: 0; transform: scale(0.5); }
          50%  { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 5px white); }
          100% { opacity: 0; transform: scale(0.5); }
        }
      `}</style>

      <svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Central text used by extrusion, front face, scan-line clip, and clipPath */}
          <text
            id="pl-pulse-text"
            x="0"
            y="0"
            fontFamily="'Orbitron', sans-serif"
            fontWeight="900"
            fontSize="160"
            textAnchor="middle"
            dominantBaseline="central"
            letterSpacing="18"
          >
            PULSE
          </text>

          <linearGradient id="pl-silver-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#c1cad6" />
            <stop offset="48%" stopColor="#808ca1" />
            <stop offset="50%" stopColor="#1c2331" />
            <stop offset="52%" stopColor="#8a95ab" />
            <stop offset="100%" stopColor="#eef1f5" />
          </linearGradient>

          <linearGradient id="pl-silver-side" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4e5668" />
            <stop offset="50%" stopColor="#2a3140" />
            <stop offset="100%" stopColor="#0a0d14" />
          </linearGradient>

          <radialGradient id="pl-roulette-grad" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="transparent" />
            <stop offset="90%" stopColor="rgba(200, 220, 255, 0.4)" />
            <stop offset="95%" stopColor="rgba(150, 180, 255, 0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <filter id="pl-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Explicit definition for glow-intense (the source HTML referenced
              it without declaring it — browsers silently rendered those
              elements with no filter). */}
          <filter id="pl-glow-intense" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="pl-shadow-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="15" result="blur" />
          </filter>

          <pattern
            id="pl-scanlines"
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
          >
            <line x1="0" y1="0" x2="6" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          </pattern>

          <clipPath id="pl-text-clip">
            <use href="#pl-pulse-text" x="0" y="0" />
          </clipPath>
        </defs>

        {/* Space particles */}
        <g>
          <circle cx="150" cy="120" r="1.5" fill="#fff" className="star" style={{ animationDuration: '3s', animationDelay: '0s' }} />
          <circle cx="850" cy="90"  r="2"   fill="#fff" className="star" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <circle cx="900" cy="480" r="1.5" fill="#fff" className="star" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          <circle cx="120" cy="450" r="2"   fill="#fff" className="star" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }} />
          <circle cx="500" cy="80"  r="1"   fill="#fff" className="star" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <circle cx="350" cy="520" r="1"   fill="#fff" className="star" style={{ animationDuration: '4s', animationDelay: '2s' }} />
          <circle cx="750" cy="500" r="1.5" fill="#fff" className="star" style={{ animationDuration: '3s', animationDelay: '1.2s' }} />
        </g>

        {/* Cybernetic corner frame */}
        <g stroke="rgba(200, 220, 255, 0.2)" strokeWidth="2" fill="none">
          <path d="M 40 60 L 40 40 L 60 40" />
          <circle cx="40" cy="40" r="2.5" fill="rgba(200, 220, 255, 0.4)" />
          <path d="M 960 60 L 960 40 L 940 40" />
          <circle cx="960" cy="40" r="2.5" fill="rgba(200, 220, 255, 0.4)" />
          <path d="M 40 540 L 40 560 L 60 560" />
          <circle cx="40" cy="560" r="2.5" fill="rgba(200, 220, 255, 0.4)" />
          <path d="M 960 540 L 960 560 L 940 560" />
          <circle cx="960" cy="560" r="2.5" fill="rgba(200, 220, 255, 0.4)" />
        </g>

        {/* Tech overlay text */}
        <g fontFamily="monospace" fontSize="10" fill="rgba(200, 220, 255, 0.2)" letterSpacing="2">
          <text x="50" y="52">V_SYS: ONLINE</text>
          <text x="850" y="52">SEQ: 0x8F2A</text>
          <text x="50" y="555">PWR: MAX RNG</text>
          <text x="860" y="555">SYNC: BEAT_OK</text>
        </g>

        {/* Tech crosshairs / scope */}
        <g stroke="rgba(200, 220, 255, 0.08)" strokeWidth="1.5">
          <line x1="500" y1="20" x2="500" y2="70" />
          <line x1="500" y1="530" x2="500" y2="580" />
          <line x1="20" y1="280" x2="70" y2="280" />
          <line x1="930" y1="280" x2="980" y2="280" />
          <circle cx="500" cy="280" r="420" fill="none" strokeDasharray="2 25" stroke="rgba(200, 220, 255, 0.03)" strokeWidth="2" />
        </g>

        {/* Center composition (roulette + text) */}
        <g transform="translate(500, 280)">
          {/* Roulette background (beating) */}
          <g className="roulette-pulse">
            <circle cx="0" cy="0" r="60" fill="rgba(0,0,0,0.8)" filter="url(#pl-shadow-blur)" />

            {/* Spinning wheel structure */}
            <g className="roulette-spin">
              <circle cx="0" cy="0" r="230" fill="url(#pl-roulette-grad)" />
              <circle cx="0" cy="0" r="220" fill="none" stroke="rgba(200, 220, 255, 0.15)" strokeWidth="5" />
              <circle cx="0" cy="0" r="205" fill="none" stroke="rgba(200, 220, 255, 0.08)" strokeWidth="10" />
              <circle cx="0" cy="0" r="185" fill="none" stroke="rgba(200, 220, 255, 0.3)" strokeWidth="18" strokeDasharray="2 29.41" />
              <circle cx="0" cy="0" r="165" fill="none" stroke="rgba(200, 220, 255, 0.15)" strokeWidth="2" />
              <circle cx="0" cy="0" r="150" fill="none" stroke="rgba(200, 220, 255, 0.1)" strokeWidth="1" strokeDasharray="5 15" />

              <g stroke="rgba(200, 220, 255, 0.08)" strokeWidth="2">
                <line x1="0" y1="-165" x2="0" y2="-55" />
                <line x1="0" y1="165" x2="0" y2="55" />
                <line x1="-165" y1="0" x2="-55" y2="0" />
                <line x1="165" y1="0" x2="55" y2="0" />
                <line x1="-116.6" y1="-116.6" x2="-38.8" y2="-38.8" />
                <line x1="116.6" y1="116.6" x2="38.8" y2="38.8" />
                <line x1="-116.6" y1="116.6" x2="-38.8" y2="38.8" />
                <line x1="116.6" y1="-116.6" x2="38.8" y2="-38.8" />
              </g>

              <circle cx="0" cy="0" r="55" fill="none" stroke="rgba(200, 220, 255, 0.15)" strokeWidth="1" />
              <circle cx="0" cy="0" r="45" fill="none" stroke="rgba(200, 220, 255, 0.05)" strokeWidth="15" strokeDasharray="6 6" />
            </g>

            {/* Static center dot */}
            <circle cx="0" cy="0" r="12" fill="#fff" filter="url(#pl-glow-intense)" />
            <circle cx="0" cy="0" r="4" fill="#000" />

            {/* Orbiting ball (counter-rotates) */}
            <g className="ball-orbit">
              <circle cx="0" cy="-210" r="5" fill="#ffffff" filter="url(#pl-glow-intense)" />
              <circle cx="0" cy="-210" r="2" fill="#eeffff" />
              <path
                d="M -2 -210 Q -30 -210 -40 -198"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="3"
                filter="url(#pl-glow)"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* PULSE word — 25-layer 3D extrusion, beats with the ring */}
          <g className="word-beat">
            {/* Deep background shadow */}
            <use href="#pl-pulse-text" x="-35" y="35" fill="rgba(0,0,0,0.8)" filter="url(#pl-shadow-blur)" opacity="1" />

            {/* 25 extrusion layers */}
            {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
              <use key={`ex-${n}`} href="#pl-pulse-text" x={-n} y={n} className="extrusion" />
            ))}

            {/* Front face */}
            <use href="#pl-pulse-text" x="0" y="0" className="top-layer" />
            <use href="#pl-pulse-text" x="0" y="0" className="scanline-layer" />

            {/* Cyber flare sweep clipped to the text */}
            <g clipPath="url(#pl-text-clip)">
              <rect x="-40" y="-200" width="80" height="400" fill="rgba(255,255,255,0.8)" filter="url(#pl-glow)" className="flare" />
              <rect x="-20" y="-200" width="20" height="400" fill="#ffffff" filter="url(#pl-glow-intense)" className="flare" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};
