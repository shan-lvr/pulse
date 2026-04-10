import React from 'react';

/**
 * Round-end result banners — ported verbatim from
 * /Users/shan/.gemini/antigravity/scratch/pulse_game_results.html
 *
 * Three separate inline SVG React components (WinnerBanner,
 * CollapsedBanner, BustedBanner) so the original CSS animations
 * and @keyframes run live in-page. The SVGs share the Orbitron
 * font that's pre-loaded via index.html.
 *
 * Every visual element from the source HTML is preserved exactly —
 * the 20-layer 3D extrusion, chrome gradients, glow/shadow filters,
 * scan-line overlay, flare sweep, decorative stars / hazard sign /
 * cyber glitch decals, and keyframe timings.
 *
 * The only edits vs. the source HTML:
 *   • keyframe/class names prefixed with `rb-` so they don't collide
 *     with the PulseLogo keyframes on the same page
 *   • each banner has unique filter/gradient/pattern ids (already
 *     scoped in the source) kept as-is
 */

/* ------------------------------------------------------------------ */
/*  WINNER                                                            */
/* ------------------------------------------------------------------ */
export const WinnerBanner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <style>{`
      .rb-winner-svg { font-family: 'Orbitron', sans-serif; }
      .rb-winner-side {
        fill: url(#rb-side-winner);
        stroke: #261a00;
        stroke-width: 0.5px;
        stroke-linejoin: round;
      }
      .rb-winner-top {
        fill: url(#rb-top-winner);
        stroke: rgba(255, 255, 255, 0.9);
        stroke-width: 2px;
        stroke-linejoin: round;
        filter: url(#rb-glow-winner);
      }
      .rb-winner-anim {
        transform-origin: 0px 0px;
        animation: rb-winner-pulse 1.8s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
      }
      @keyframes rb-winner-pulse {
        0%   { transform: scale(1); filter: drop-shadow(0 0 0px #ffcc00); }
        10%  { transform: scale(1.08); filter: drop-shadow(0 0 25px rgba(255,200,0,0.8)) brightness(1.2); }
        18%  { transform: scale(1.01); filter: drop-shadow(0 0 5px rgba(255,200,0,0.3)); }
        28%  { transform: scale(1.12); filter: drop-shadow(0 0 40px rgba(255,200,0,1)) brightness(1.4); }
        40%  { transform: scale(1); filter: drop-shadow(0 0 0px #ffcc00); }
        100% { transform: scale(1); filter: drop-shadow(0 0 0px #ffcc00); }
      }
      .rb-winner-flare {
        transform: skewX(-30deg);
        animation: rb-w-flare-sweep 3s ease-in-out infinite;
      }
      @keyframes rb-w-flare-sweep {
        0%   { transform: translateX(-400px) skewX(-30deg); opacity: 0; }
        15%  { transform: translateX(-400px) skewX(-30deg); opacity: 0; }
        35%  { transform: translateX(500px) skewX(-30deg); opacity: 1; }
        55%  { transform: translateX(500px) skewX(-30deg); opacity: 0; }
        100% { transform: translateX(500px) skewX(-30deg); opacity: 0; }
      }
      .rb-winner-star {
        transform-origin: 0px 0px;
        animation: rb-w-stars-pulse 3s cubic-bezier(0.4, 0.0, 0.2, 1) infinite alternate;
      }
      @keyframes rb-w-stars-pulse {
        0%   { transform: scale(0.5) rotate(0deg); opacity: 0.2; }
        100% { transform: scale(1.3) rotate(90deg); opacity: 1; filter: drop-shadow(0 0 10px #ffcc00); }
      }
    `}</style>
    <svg viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible', display: 'block', width: '100%', height: 'auto' }}>
      <defs>
        <text id="rb-text-winner" className="rb-winner-svg" x="0" y="0" fontWeight="900" fontSize="140" textAnchor="middle" dominantBaseline="central" letterSpacing="18">WINNER</text>
        <linearGradient id="rb-top-winner" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#ffe680" />
          <stop offset="48%" stopColor="#cca300" />
          <stop offset="50%" stopColor="#4d3500" />
          <stop offset="52%" stopColor="#ffcc00" />
          <stop offset="100%" stopColor="#fff5cc" />
        </linearGradient>
        <linearGradient id="rb-side-winner" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#805b00" />
          <stop offset="50%" stopColor="#332400" />
          <stop offset="100%" stopColor="#0d0900" />
        </linearGradient>
        <filter id="rb-glow-winner" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="blur1" />
          <feGaussianBlur stdDeviation="25" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="rb-shadow-winner" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="15" />
        </filter>
        <pattern id="rb-scanlines-winner" patternUnits="userSpaceOnUse" width="6" height="6">
          <line x1="0" y1="0" x2="6" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        </pattern>
        <clipPath id="rb-clip-winner">
          <use href="#rb-text-winner" x="0" y="0" />
        </clipPath>
      </defs>

      <g transform="translate(500, 200)">
        <g className="rb-winner-anim">
          <g transform="translate(-380, -90)" className="rb-winner-star">
            <path d="M 0 -35 Q 0 0 35 0 Q 0 0 0 35 Q 0 0 -35 0 Q 0 0 0 -35" fill="#ffdd33" filter="url(#rb-glow-winner)" />
            <circle cx="0" cy="0" r="5" fill="#ffffff" />
          </g>
          <g transform="translate(380, 90)" className="rb-winner-star" style={{ animationDelay: '-1.5s' }}>
            <path d="M 0 -25 Q 0 0 25 0 Q 0 0 0 25 Q 0 0 -25 0 Q 0 0 0 -25" fill="#ffdd33" filter="url(#rb-glow-winner)" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />
          </g>

          <use href="#rb-text-winner" x="-35" y="35" fill="rgba(0,0,0,0.8)" filter="url(#rb-shadow-winner)" opacity="1" />

          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <use key={`w-ex-${n}`} href="#rb-text-winner" x={-n} y={n} className="rb-winner-side" />
          ))}

          <use href="#rb-text-winner" x="0" y="0" className="rb-winner-top" />
          <use href="#rb-text-winner" x="0" y="0" fill="url(#rb-scanlines-winner)" />

          <g clipPath="url(#rb-clip-winner)">
            <rect x="-40" y="-150" width="80" height="300" fill="rgba(255,255,255,0.9)" filter="url(#rb-glow-winner)" className="rb-winner-flare" />
            <rect x="-10" y="-150" width="20" height="300" fill="#ffffff" filter="url(#rb-glow-winner)" className="rb-winner-flare" />
          </g>
        </g>
      </g>
    </svg>
  </div>
);

/* ------------------------------------------------------------------ */
/*  COLLAPSED                                                         */
/* ------------------------------------------------------------------ */
export const CollapsedBanner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <style>{`
      .rb-collapse-svg { font-family: 'Orbitron', sans-serif; }
      .rb-collapse-side {
        fill: url(#rb-side-collapse);
        stroke: #001f33;
        stroke-width: 0.5px;
        stroke-linejoin: round;
      }
      .rb-collapse-top {
        fill: url(#rb-top-collapse);
        stroke: rgba(255, 255, 255, 0.7);
        stroke-width: 2px;
        stroke-linejoin: round;
        filter: url(#rb-glow-collapse);
      }
      .rb-collapse-anim {
        transform-origin: 0px 0px;
        animation: rb-glitch-beat 2.5s infinite;
      }
      @keyframes rb-glitch-beat {
        0%   { transform: scale(1) skew(0deg); filter: brightness(1) hue-rotate(0deg); opacity: 1; }
        2%   { transform: translate(-4px, 2px) scale(1.02) skew(5deg); filter: brightness(1.5) hue-rotate(30deg); opacity: 1; }
        4%   { transform: scale(1) skew(0deg); filter: brightness(1); opacity: 1; }
        6%   { transform: translate(5px, -3px) scale(0.98) skew(-10deg); filter: drop-shadow(0 0 15px cyan) invert(0.2); opacity: 0.9; }
        8%   { transform: scale(1) skew(0deg); filter: brightness(1); opacity: 1; }
        30%  { transform: scale(1) skew(0deg); opacity: 1; }
        40%  { transform: scale(1) skew(0deg); filter: drop-shadow(0 0 0px cyan); opacity: 1; }
        41%  { opacity: 0.3; transform: translate(2px, 2px); }
        43%  { opacity: 1; transform: translate(-2px, -2px); }
        45%  { opacity: 0.5; filter: drop-shadow(0 0 20px rgba(0,255,255,0.8)); }
        47%  { transform: scale(1) skew(0deg); opacity: 1; }
        100% { transform: scale(1) skew(0deg); opacity: 1; }
      }
      .rb-collapse-tech {
        animation: rb-flicker 4s infinite alternate;
      }
      @keyframes rb-flicker {
        0%   { opacity: 0.8; }
        8%   { opacity: 0.1; }
        12%  { opacity: 1; }
        40%  { opacity: 0.9; }
        100% { opacity: 0.5; }
      }
    `}</style>
    <svg viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible', display: 'block', width: '100%', height: 'auto' }}>
      <defs>
        <text id="rb-text-collapse" className="rb-collapse-svg" x="0" y="0" fontWeight="900" fontSize="130" textAnchor="middle" dominantBaseline="central" letterSpacing="14">COLLAPSED</text>
        <linearGradient id="rb-top-collapse" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#b3ecff" />
          <stop offset="48%" stopColor="#0099cc" />
          <stop offset="50%" stopColor="#001a26" />
          <stop offset="52%" stopColor="#00bfff" />
          <stop offset="100%" stopColor="#e6f9ff" />
        </linearGradient>
        <linearGradient id="rb-side-collapse" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#005980" />
          <stop offset="50%" stopColor="#002233" />
          <stop offset="100%" stopColor="#00090d" />
        </linearGradient>
        <filter id="rb-glow-collapse" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur1" />
          <feGaussianBlur stdDeviation="20" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="rb-shadow-collapse" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="15" />
        </filter>
        <pattern id="rb-scanlines-collapse" patternUnits="userSpaceOnUse" width="8" height="8">
          <line x1="0" y1="0" x2="8" y2="0" stroke="rgba(0,255,255,0.2)" strokeWidth="2" />
        </pattern>
      </defs>

      <g transform="translate(500, 200)">
        <g className="rb-collapse-anim">
          <g className="rb-collapse-tech" stroke="rgba(0, 255, 255, 0.4)" strokeWidth="2" fill="none">
            <polyline points="-420,-60 -380,-60 -360,-40" />
            <rect x="-420" y="-30" width="10" height="10" fill="rgba(0,255,255,0.4)" />
            <polyline points="420,60 380,60 360,40" />
            <rect x="410" y="20" width="10" height="10" fill="rgba(0,255,255,0.4)" />
            <line x1="-150" y1="-120" x2="-50" y2="-120" strokeWidth="4" strokeDasharray="10 10" />
            <line x1="50" y1="120" x2="150" y2="120" strokeWidth="4" strokeDasharray="5 15 20 5" />
          </g>

          <use href="#rb-text-collapse" x="-30" y="30" fill="rgba(0,0,0,0.8)" filter="url(#rb-shadow-collapse)" />

          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <use key={`c-ex-${n}`} href="#rb-text-collapse" x={-n} y={n} className="rb-collapse-side" />
          ))}

          <use href="#rb-text-collapse" x="0" y="0" className="rb-collapse-top" />
          <use href="#rb-text-collapse" x="0" y="0" fill="url(#rb-scanlines-collapse)" />
        </g>
      </g>
    </svg>
  </div>
);

/* ------------------------------------------------------------------ */
/*  BUSTED                                                            */
/* ------------------------------------------------------------------ */
export const BustedBanner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <style>{`
      .rb-busted-svg { font-family: 'Orbitron', sans-serif; }
      .rb-busted-side {
        fill: url(#rb-side-busted);
        stroke: #260000;
        stroke-width: 0.5px;
        stroke-linejoin: round;
      }
      .rb-busted-top {
        fill: url(#rb-top-busted);
        stroke: rgba(255, 100, 100, 0.9);
        stroke-width: 2px;
        stroke-linejoin: round;
        filter: url(#rb-glow-busted);
      }
      .rb-busted-anim {
        transform-origin: 0px 0px;
        animation: rb-bust-slam 2.2s cubic-bezier(0.8, 0, 0.2, 1) infinite;
      }
      @keyframes rb-bust-slam {
        0%   { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,0,0,0.5)); }
        20%  { transform: scale(1.1); filter: drop-shadow(0 0 30px rgba(255,0,0,1)) brightness(1.3); }
        25%  { transform: scale(0.95); filter: drop-shadow(0 0 0px transparent); }
        30%  { transform: scale(1.05); filter: drop-shadow(0 0 20px rgba(255,0,0,0.8)); }
        40%  { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,0,0,0.5)); }
        100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,0,0,0.5)); }
      }
      .rb-hazard-flash {
        animation: rb-hz-flash 2.2s cubic-bezier(0.8, 0, 0.2, 1) infinite;
      }
      @keyframes rb-hz-flash {
        0%   { opacity: 0.2; }
        20%  { opacity: 1; filter: drop-shadow(0 0 15px red); transform: scale(1.05); }
        25%  { opacity: 0.1; transform: scale(0.95); }
        30%  { opacity: 0.6; transform: scale(1.02); }
        40%  { opacity: 0.2; transform: scale(1); }
        100% { opacity: 0.2; transform: scale(1); }
      }
    `}</style>
    <svg viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible', display: 'block', width: '100%', height: 'auto' }}>
      <defs>
        <text id="rb-text-busted" className="rb-busted-svg" x="0" y="0" fontWeight="900" fontSize="150" textAnchor="middle" dominantBaseline="central" letterSpacing="22">BUSTED</text>
        <linearGradient id="rb-top-busted" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#ff9999" />
          <stop offset="48%" stopColor="#cc0000" />
          <stop offset="50%" stopColor="#4d0000" />
          <stop offset="52%" stopColor="#ff3333" />
          <stop offset="100%" stopColor="#ffe6e6" />
        </linearGradient>
        <linearGradient id="rb-side-busted" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#800000" />
          <stop offset="50%" stopColor="#330000" />
          <stop offset="100%" stopColor="#0d0000" />
        </linearGradient>
        <filter id="rb-glow-busted" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="blur1" />
          <feGaussianBlur stdDeviation="25" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="rb-shadow-busted" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="15" />
        </filter>
        <pattern id="rb-scanlines-busted" patternUnits="userSpaceOnUse" width="10" height="10">
          <line x1="0" y1="0" x2="10" y2="10" stroke="rgba(255,0,0,0.15)" strokeWidth="2" />
        </pattern>
      </defs>

      <g transform="translate(500, 200)">
        <g className="rb-busted-anim">
          <g transform="translate(0, -110)" className="rb-hazard-flash">
            <path d="M 0 -35 L 40 35 L -40 35 Z" fill="rgba(255,0,0,0.2)" stroke="#ff4d4d" strokeWidth="4" filter="url(#rb-glow-busted)" />
            <text x="0" y="16" fontFamily="sans-serif" fontWeight="bold" fontSize="35" fill="#ff4d4d" textAnchor="middle">!</text>
          </g>

          <use href="#rb-text-busted" x="-35" y="35" fill="rgba(0,0,0,0.8)" filter="url(#rb-shadow-busted)" opacity="1" />

          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <use key={`b-ex-${n}`} href="#rb-text-busted" x={-n} y={n} className="rb-busted-side" />
          ))}

          <use href="#rb-text-busted" x="0" y="0" className="rb-busted-top" />
          <use href="#rb-text-busted" x="0" y="0" fill="url(#rb-scanlines-busted)" />

          <g className="rb-hazard-flash" stroke="#ff4d4d" strokeWidth="12" fill="none" strokeLinecap="square">
            <path d="M -410 -60 L -450 -60 L -450 60 L -410 60" />
            <path d="M 410 -60 L 450 -60 L 450 60 L 410 60" />
          </g>
        </g>
      </g>
    </svg>
  </div>
);
