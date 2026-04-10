import React, { useEffect, useRef, useState } from 'react';

interface PulseLogoProps {
  /** Increment to trigger one letter to play its Y-flip animation. */
  flipNonce: number;
  className?: string;
}

/**
 * PULSE wordmark — chunky cyan-cored block letters with a thick layered
 * glow. Each round-start (incoming `flipNonce` change) triggers exactly
 * ONE letter to do a slow Y-axis hologram flip; the wordmark is otherwise
 * static. Letters cycle P → U → L → S → E → P …
 */
const LETTERS = [
  { id: 'P', cx: 120 },
  { id: 'U', cx: 255 },
  { id: 'L', cx: 385 },
  { id: 'S', cx: 515 },
  { id: 'E', cx: 650 },
] as const;

const FLIP_DURATION_MS = 20000; // 30% of the previous 6s × ~1/0.3

export const PulseLogo: React.FC<PulseLogoProps> = ({ flipNonce, className }) => {
  // Track which letter index should currently be playing its animation,
  // and a remount-key so React can replay the CSS animation on the same
  // letter if the same nonce comes around again later.
  const [active, setActive] = useState<{ idx: number; key: number } | null>(null);
  const cycleCountRef = useRef(0);
  const lastNonceRef = useRef(flipNonce);

  useEffect(() => {
    if (flipNonce === lastNonceRef.current) return;
    lastNonceRef.current = flipNonce;

    // Pick the next letter in the cycle
    const idx = cycleCountRef.current % LETTERS.length;
    cycleCountRef.current += 1;

    setActive({ idx, key: flipNonce });

    const tid = window.setTimeout(() => {
      setActive((cur) => (cur && cur.key === flipNonce ? null : cur));
    }, FLIP_DURATION_MS + 50);
    return () => window.clearTimeout(tid);
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
        {/* Letter paths drawn around local (0,0) */}
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
          <feGaussianBlur stdDeviation="1.2" />
        </filter>

        {LETTERS.map((l) => (
          <symbol key={l.id} id={`pl-stack-${l.id}`} overflow="visible">
            <use href={`#pl-${l.id}`} stroke="#0e7490" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#pl-haloFar)"  opacity="0.55" />
            <use href={`#pl-${l.id}`} stroke="#22d3ee" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#pl-haloNear)" opacity="0.85" />
            <use href={`#pl-${l.id}`} stroke="#67e8f9" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#pl-haloNear)" opacity="0.95" />
            <use href={`#pl-${l.id}`} stroke="#ffffff" strokeWidth="9"  strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#pl-coreShine)" />
            <use href={`#pl-${l.id}`} stroke="#ffffff" strokeWidth="4"  strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </symbol>
        ))}
      </defs>

      {/* CSS keyframe definitions live in <style> inside the SVG so the
          inline component is fully self-contained. */}
      <style>{`
        @keyframes pl-flip {
          0%   { transform: scale(1, 1);  }
          25%  { transform: scale(0, 1);  }
          50%  { transform: scale(-1, 1); }
          75%  { transform: scale(0, 1);  }
          100% { transform: scale(1, 1);  }
        }
        @keyframes pl-glow {
          0%, 100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
        .pl-letter-active {
          transform-origin: 0 0;
          transform-box: fill-box;
          animation: pl-flip ${FLIP_DURATION_MS}ms cubic-bezier(.42,0,.58,1) 1, pl-glow ${FLIP_DURATION_MS}ms ease-in-out 1;
        }
      `}</style>

      {LETTERS.map((l, i) => {
        const isActive = active?.idx === i;
        // The remount key for the active letter includes the nonce so the
        // CSS animation restarts cleanly even if the same letter is
        // re-triggered later.
        const groupKey = isActive ? `${l.id}-flip-${active!.key}` : `${l.id}-static`;
        return (
          <g key={groupKey} transform={`translate(${l.cx} 120)`}>
            <g className={isActive ? 'pl-letter-active' : ''} opacity={isActive ? undefined : 0.85}>
              <use href={`#pl-stack-${l.id}`} />
            </g>
          </g>
        );
      })}
    </svg>
  );
};
