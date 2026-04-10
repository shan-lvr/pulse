import React, { useEffect, useRef } from 'react';

interface PulseLogoProps {
  /** Increment to trigger one letter to play its Y-flip animation. */
  flipNonce: number;
  className?: string;
}

/**
 * PULSE wordmark — 3D-feeling block letters with chunky cyan glow.
 *
 * On every change to `flipNonce`, exactly ONE letter is triggered to play
 * its Y-axis hologram flip animation. Letters cycle P → U → L → S → E → P…
 *
 * Animation is driven by SMIL `<animateTransform begin="indefinite">` on
 * each letter, triggered programmatically via `beginElement()`. Each
 * letter has its own animation node, so triggering letter U does not
 * touch letter P's in-flight animation — they run independently and
 * naturally finish.
 *
 * SMIL also handles the rotation pivot correctly: with the letter paths
 * drawn around local (0,0) and the parent group doing the translate,
 * `type="scale"` with no center argument naturally pivots around (0,0)
 * which IS the letter's geometric center → never drifts sideways into
 * a neighbor letter's slot.
 */
const LETTERS = [
  { id: 'P', cx: 120 },
  { id: 'U', cx: 255 },
  { id: 'L', cx: 385 },
  { id: 'S', cx: 515 },
  { id: 'E', cx: 650 },
] as const;

const FLIP_DURATION_S = 20;

export const PulseLogo: React.FC<PulseLogoProps> = ({ flipNonce, className }) => {
  // One ref per letter for the scale animateTransform; one for opacity.
  // SMIL elements typed as SVGAnimationElement so we can call beginElement().
  const flipRefs = useRef<(SVGAnimationElement | null)[]>([null, null, null, null, null]);
  const glowRefs = useRef<(SVGAnimationElement | null)[]>([null, null, null, null, null]);
  const cycleRef = useRef(0);
  const lastNonceRef = useRef(flipNonce);

  useEffect(() => {
    if (flipNonce === lastNonceRef.current) return;
    lastNonceRef.current = flipNonce;

    const idx = cycleRef.current % LETTERS.length;
    cycleRef.current += 1;

    try {
      flipRefs.current[idx]?.beginElement();
      glowRefs.current[idx]?.beginElement();
    } catch {
      /* SMIL beginElement not available — gracefully degrade */
    }
  }, [flipNonce]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 240"
      width="800"
      height="240"
      className={className}
    >
      <defs>
        {/* Letter glyph paths drawn around local (0,0) — pivot is the letter center */}
        <path id="pl-P" d="M -42 50 L -42 -50 L 43 -50 L 43 -5 L -42 -5" />
        <path id="pl-U" d="M -45 -50 L -45 35 L -25 50 L 25 50 L 45 35 L 45 -50" />
        <path id="pl-L" d="M -35 -50 L -35 50 L 35 50" />
        <path id="pl-S" d="M 40 -50 L -40 -50 L -40 -5 L 40 -5 L 40 50 L -40 50" />
        <path id="pl-E" d="M 35 -50 L -35 -50 L -35 -5 L 25 -5 M -35 -5 L -35 50 L 35 50" />

        <filter id="pl-haloFar" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="pl-haloNear" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <filter id="pl-coreShine" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" />
        </filter>

        {/* 9-pass letter stack with extruded depth shadow for 3D feel */}
        {LETTERS.map((l) => (
          <symbol key={l.id} id={`pl-stack-${l.id}`} overflow="visible">
            {/* 1: outermost cyan halo */}
            <use href={`#pl-${l.id}`} stroke="#0e7490" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#pl-haloFar)" opacity="0.55" />
            {/* 2: mid cyan aura */}
            <use href={`#pl-${l.id}`} stroke="#22d3ee" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#pl-haloNear)" opacity="0.85" />
            {/* 3-6: extruded depth — 4 progressively-lighter offset shadow layers */}
            <g transform="translate(8 10)">
              <use href={`#pl-${l.id}`} stroke="#020617" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
            <g transform="translate(6 8)">
              <use href={`#pl-${l.id}`} stroke="#0c1a2b" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
            <g transform="translate(4 5)">
              <use href={`#pl-${l.id}`} stroke="#082f49" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
            <g transform="translate(2 3)">
              <use href={`#pl-${l.id}`} stroke="#0c4a6e" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
            {/* 7: cyan rim */}
            <use href={`#pl-${l.id}`} stroke="#67e8f9" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#pl-haloNear)" opacity="0.95" />
            {/* 8: thick white core */}
            <use href={`#pl-${l.id}`} stroke="#ffffff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#pl-coreShine)" />
            {/* 9: sharp white inner */}
            <use href={`#pl-${l.id}`} stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </symbol>
        ))}
      </defs>

      {LETTERS.map((l, i) => (
        <g key={l.id} transform={`translate(${l.cx} 120)`}>
          <g>
            {/* Y-axis flip via scaleX cosine wave — pivots around local (0,0)
                which is the letter's geometric center. begin="indefinite" so
                the animation only fires when beginElement() is called from
                React on each round-start. */}
            <animateTransform
              ref={(el) => {
                flipRefs.current[i] = el;
              }}
              attributeName="transform"
              attributeType="XML"
              type="scale"
              values="1 1; 0 1; -1 1; 0 1; 1 1"
              keyTimes="0; 0.25; 0.5; 0.75; 1"
              calcMode="spline"
              keySplines="0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1"
              dur={`${FLIP_DURATION_S}s`}
              fill="freeze"
              begin="indefinite"
              restart="always"
            />
            {/* Glow throb in lockstep with the flip */}
            <animate
              ref={(el) => {
                glowRefs.current[i] = el;
              }}
              attributeName="opacity"
              values="0.85; 1; 0.92; 1; 0.85"
              keyTimes="0; 0.25; 0.5; 0.75; 1"
              dur={`${FLIP_DURATION_S}s`}
              fill="freeze"
              begin="indefinite"
              restart="always"
            />
            <use href={`#pl-stack-${l.id}`} opacity="0.85" />
          </g>
        </g>
      ))}
    </svg>
  );
};
