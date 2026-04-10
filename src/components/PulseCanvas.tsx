import React, { useEffect, useRef } from 'react';
import { SEGMENT_COUNT, Segment, GameState } from '../lib/game-logic';

interface PulseCanvasProps {
  wave: number;
  progress: number;
  gameState: GameState;
  /** Continuous rotation in degrees (0 starts at the top, grows clockwise) */
  rotation: number;
  segments: Segment[];
  /** When true, segments reveal their safe/dead/void state */
  showSegments: boolean;
  /** Wave index at which the ring will collapse — drives the outer danger arc */
  collapseWave: number;
}

/**
 * AAA-quality Pulse roulette canvas.
 *
 * Architecture (outer → inner):
 *   1. Drifting background particles (red / cyan)
 *   2. Outer dual tick arcs:
 *        - Right side (cyan) : current wave progress
 *        - Left  side (red)  : danger accumulation (wave / collapseWave)
 *   3. Outer rim glow ring (solid thin circle)
 *   4. Segment band (16 rounded-rect segments)
 *        - Hidden   : dark slate with cyan outline
 *        - Scanner  : bright cyan fill (the segment the pointer is currently over)
 *        - Bonus    : amber outlined with "+x.xx" label
 *        - Revealed : green (safe) / red (dead)
 *        - Destroyed: black with red cracks
 *   5. Inner rim glow ring
 *   6. Center energy burst (PLAYING only):
 *        - 32 radial rays with time-based shimmer
 *        - Horizontal lens flare bar
 *        - Bright core with multi-stop radial gradient
 *        - Expanding pulse wave synced to `progress`
 *
 * The animation loop is owned by the canvas (independent of React re-renders)
 * and reads the latest props through a ref, so per-frame shimmer/ray motion
 * stays smooth even when props change only once per wave tick.
 */
export const PulseCanvas: React.FC<PulseCanvasProps> = ({
  wave,
  progress,
  gameState,
  rotation,
  segments = [],
  showSegments,
  collapseWave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep the latest props accessible inside the animation loop without
  // restarting the RAF on every render.
  const propsRef = useRef({
    wave,
    progress,
    gameState,
    rotation,
    segments,
    showSegments,
    collapseWave,
  });
  propsRef.current = {
    wave,
    progress,
    gameState,
    rotation,
    segments,
    showSegments,
    collapseWave,
  };

  const particlesRef = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      twinkle: number;
    }[]
  >([]);

  useEffect(() => {
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 90 }, () => {
        const isRed = Math.random() > 0.55;
        return {
          x: Math.random() * 800,
          y: Math.random() * 800,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.6 + 0.4,
          color: isRed ? '#ef4444' : '#22d3ee',
          twinkle: Math.random() * Math.PI * 2,
        };
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI scaling. Canvas is wider than tall so the horizontal lens flare
    // can extend past the segment ring without being clipped at the edges.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const logicalW = 1200;
    const logicalH = 800;
    canvas.width = logicalW * dpr;
    canvas.height = logicalH * dpr;
    ctx.scale(dpr, dpr);

    let rafId = 0;

    const drawBackgroundParticles = (now: number) => {
      const particles = particlesRef.current;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.04;
        if (p.x < -5) p.x = logicalW + 5;
        if (p.x > logicalW + 5) p.x = -5;
        if (p.y < -5) p.y = logicalH + 5;
        if (p.y > logicalH + 5) p.y = -5;
        const flicker = 0.5 + 0.5 * Math.sin(p.twinkle);
        ctx.globalAlpha = 0.25 + 0.45 * flicker;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    /** Draw a radial tick arc (used for the outer cyan/red progress arcs). */
    const drawTickArc = (
      cx: number,
      cy: number,
      innerR: number,
      outerR: number,
      startAngle: number,
      endAngle: number,
      color: string,
      glow: string,
      progressFrac: number, // 0..1 — how much of the arc is lit
      tickCount: number,
    ) => {
      const sweep = endAngle - startAngle;
      const lit = Math.max(0, Math.min(1, progressFrac));
      const litTicks = Math.round(tickCount * lit);

      ctx.save();
      ctx.translate(cx, cy);

      for (let i = 0; i < tickCount; i++) {
        const t = (i + 0.5) / tickCount;
        const angle = startAngle + sweep * t;
        const isLit = i < litTicks;
        if (!isLit) continue;
        const x1 = Math.cos(angle) * innerR;
        const y1 = Math.sin(angle) * innerR;
        const x2 = Math.cos(angle) * outerR;
        const y2 = Math.sin(angle) * outerR;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = glow;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    /** Rounded rect segment in polar coordinates — approximated with canvas arcs. */
    const drawSegmentBlock = (
      startA: number,
      endA: number,
      innerR: number,
      outerR: number,
    ) => {
      const pad = 0.035; // wider gap between segments → more "block" feel
      ctx.beginPath();
      ctx.arc(0, 0, outerR, startA + pad, endA - pad);
      ctx.arc(0, 0, innerR, endA - pad, startA + pad, true);
      ctx.closePath();
    };

    const render = (now: number) => {
      const {
        wave: pWave,
        progress: pProgress,
        gameState: pState,
        rotation: pRotation,
        segments: pSegments,
        showSegments: pShow,
        collapseWave: pCollapse,
      } = propsRef.current;

      ctx.clearRect(0, 0, logicalW, logicalH);

      const cx = logicalW / 2;
      const cy = logicalH / 2;
      const outerRingR = 310;
      const innerRingR = 232;
      const segOuter = 298;
      const segInner = 244;
      const bandGapOuter = 272; // split within the segment band for inner detail

      // --- 1. background particles ---
      drawBackgroundParticles(now);

      // --- 2. outer dual tick arcs ---
      // Right (cyan): current wave progress  – sweeps 0 → 1 inside the wave
      // Left (red)  : danger accumulation     – wave / collapseWave
      const waveProgress = Math.max(
        0,
        Math.min(1, pState === 'PLAYING' ? pProgress : 0),
      );
      const danger =
        pState === 'PLAYING' && pCollapse > 0
          ? Math.max(0, Math.min(1, (pWave - 1 + pProgress) / pCollapse))
          : 0;

      // Right cyan arc: from top (-π/2) clockwise down to bottom-right
      drawTickArc(
        cx,
        cy,
        segOuter + 18,
        segOuter + 62,
        -Math.PI / 2 + 0.12,
        Math.PI * 0.55,
        '#22d3ee',
        '#22d3ee',
        waveProgress,
        56,
      );
      // Left red arc: from top counter-clockwise to bottom-left
      drawTickArc(
        cx,
        cy,
        segOuter + 18,
        segOuter + 62,
        -Math.PI / 2 - 0.12,
        -Math.PI * 1.55,
        '#ef4444',
        '#ef4444',
        danger,
        56,
      );

      // --- 3. outer rim glow ring ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, outerRingR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // --- 4. segment band ---
      // Which segment is the scanner pointer currently over?
      const normRot = ((pRotation % 360) + 360) % 360;
      const liveIdx = Math.floor(normRot / (360 / SEGMENT_COUNT));

      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i < SEGMENT_COUNT; i++) {
        const startA = (i * 2 * Math.PI) / SEGMENT_COUNT - Math.PI / 2;
        const endA = ((i + 1) * 2 * Math.PI) / SEGMENT_COUNT - Math.PI / 2;
        const seg = pSegments[i];
        const isBonus = !!seg?.bonusMultiplier;
        const isDestroyed = !!seg?.isDestroyed;
        const isScanner = pState === 'PLAYING' && i === liveIdx;

        drawSegmentBlock(startA, endA, segInner, segOuter);

        if (isDestroyed) {
          ctx.fillStyle = 'rgba(15, 15, 20, 0.92)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          // cracks
          ctx.save();
          ctx.clip();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          const midA = (startA + endA) / 2;
          for (let k = 0; k < 4; k++) {
            const r1 = segInner + Math.random() * (segOuter - segInner);
            const r2 = segInner + Math.random() * (segOuter - segInner);
            const a1 = midA + (Math.random() - 0.5) * 0.25;
            const a2 = midA + (Math.random() - 0.5) * 0.25;
            ctx.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
            ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
          }
          ctx.stroke();
          ctx.restore();
        } else if (pShow) {
          // revealed
          const isSafe = !!seg?.isSafe;
          const gradient = ctx.createRadialGradient(0, 0, segInner, 0, 0, segOuter);
          if (isSafe) {
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.55)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.95)');
          } else {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.95)');
          }
          ctx.fillStyle = gradient;
          ctx.shadowBlur = 22;
          ctx.shadowColor = isSafe ? '#22c55e' : '#ef4444';
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = isSafe
            ? 'rgba(134, 239, 172, 0.9)'
            : 'rgba(252, 165, 165, 0.9)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (isScanner) {
          // Scanner-highlighted segment (the one the pointer is over)
          const scannerGrad = ctx.createRadialGradient(
            0,
            0,
            segInner,
            0,
            0,
            segOuter,
          );
          scannerGrad.addColorStop(0, 'rgba(125, 211, 252, 0.55)');
          scannerGrad.addColorStop(1, 'rgba(34, 211, 238, 0.95)');
          ctx.fillStyle = scannerGrad;
          ctx.shadowBlur = 28;
          ctx.shadowColor = '#22d3ee';
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(224, 252, 255, 1)';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (isBonus) {
          ctx.fillStyle = 'rgba(234, 179, 8, 0.28)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.95)';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 14;
          ctx.shadowColor = '#facc15';
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          // default hidden segment
          const hideGrad = ctx.createRadialGradient(
            0,
            0,
            segInner,
            0,
            0,
            segOuter,
          );
          hideGrad.addColorStop(0, 'rgba(30, 41, 59, 0.85)');
          hideGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
          ctx.fillStyle = hideGrad;
          ctx.fill();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // inner separator line across the middle of the segment band
        ctx.beginPath();
        ctx.arc(0, 0, bandGapOuter, startA + 0.02, endA - 0.02);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // labels
        const midA = (startA + endA) / 2;
        if (isDestroyed) {
          ctx.save();
          ctx.rotate(midA + Math.PI / 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.font = 'bold 11px Orbitron, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('VOID', 0, -(segInner + (segOuter - segInner) / 2));
          ctx.restore();
        } else if (pShow) {
          const isSafe = !!seg?.isSafe;
          ctx.save();
          ctx.rotate(midA + Math.PI / 2);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px Orbitron, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowBlur = 6;
          ctx.shadowColor = isSafe ? '#22c55e' : '#ef4444';
          ctx.fillText(
            isSafe ? 'SAFE' : 'DEAD',
            0,
            -(segInner + (segOuter - segInner) / 2),
          );
          ctx.shadowBlur = 0;
          ctx.restore();
        } else if (isBonus) {
          ctx.save();
          ctx.rotate(midA + Math.PI / 2);
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 10px Orbitron, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#fde047';
          ctx.fillText(
            `+${seg?.bonusMultiplier?.toFixed(1)}x`,
            0,
            -(segInner + (segOuter - segInner) / 2),
          );
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      }
      ctx.restore();

      // --- 5. inner rim glow ring ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, innerRingR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // --- 6. center energy burst (PLAYING only, time-animated) ---
      if (pState === 'PLAYING') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalCompositeOperation = 'lighter';

        const t = now / 1000;
        const pulseBeat = 0.5 + 0.5 * Math.sin(t * 3.8); // 0..1
        const intensity = Math.min(1, 0.55 + pWave * 0.05);

        // ---- 6a. long radial rays (outer fan, 36 thin rays) ----
        // Use trapezoid shapes so rays widen at the rim — feels more like
        // light beams than line strokes.
        const bigRayCount = 36;
        for (let i = 0; i < bigRayCount; i++) {
          const angle = (i / bigRayCount) * Math.PI * 2 + t * 0.18;
          const lenFactor =
            0.96 + 0.06 * Math.sin(t * 2.6 + i * 1.7) + 0.04 * pulseBeat;
          const len = (innerRingR - 6) * lenFactor;
          const alphaPulse = 0.5 + 0.5 * Math.sin(t * 3.4 + i * 0.55);
          const alpha = (0.42 + 0.5 * alphaPulse) * intensity;
          const baseW = 1.5;
          const tipW = 22 + 10 * pulseBeat;
          ctx.save();
          ctx.rotate(angle);
          const rayGrad = ctx.createLinearGradient(0, 0, len, 0);
          rayGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          rayGrad.addColorStop(0.4, `rgba(165, 243, 252, ${alpha * 0.85})`);
          rayGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(0, -baseW / 2);
          ctx.lineTo(len, -tipW / 2);
          ctx.lineTo(len, tipW / 2);
          ctx.lineTo(0, baseW / 2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // ---- 6b. fat short rays (cardinal burst, 8 thick rays) ----
        const fatRayCount = 8;
        for (let i = 0; i < fatRayCount; i++) {
          const angle = (i / fatRayCount) * Math.PI * 2 - t * 0.45;
          const len = 200 + 35 * pulseBeat;
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.65 * intensity})`;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 36;
          ctx.shadowColor = '#67e8f9';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // ---- 6c. anamorphic lens flare ----
        // Replaces the old flat "two rectangles" bar with a stack of
        // horizontally-stretched ellipses + central core disc + offset
        // ghost flares + a few sparkles. Layered with `lighter` blending
        // already enabled above so the highlights add up the way real
        // lens reflections do.
        const flarePulse = 0.8 + 0.2 * pulseBeat;

        const drawFlareEllipse = (
          rx: number,
          ry: number,
          stops: Array<[number, string]>,
        ) => {
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
          for (const [o, c] of stops) grad.addColorStop(o, c);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
        };

        // 1. Widest, softest ambient streak — taper from center
        drawFlareEllipse(logicalW * 0.62 * flarePulse, 95 * flarePulse, [
          [0, `rgba(165, 243, 252, ${0.42 * intensity})`],
          [0.18, `rgba(125, 211, 252, ${0.22 * intensity})`],
          [0.55, `rgba(34, 211, 238, ${0.07 * intensity})`],
          [1, 'rgba(34, 211, 238, 0)'],
        ]);

        // 2. Mid streak — narrower, brighter
        drawFlareEllipse(logicalW * 0.5 * flarePulse, 32 * flarePulse, [
          [0, `rgba(255, 255, 255, ${0.85 * intensity})`],
          [0.12, `rgba(224, 252, 255, ${0.7 * intensity})`],
          [0.35, `rgba(125, 211, 252, ${0.3 * intensity})`],
          [1, 'rgba(34, 211, 238, 0)'],
        ]);

        // 3. Sharp anamorphic core line — very thin, very bright
        drawFlareEllipse(logicalW * 0.55 * flarePulse, 3 + 1.5 * pulseBeat, [
          [0, 'rgba(255, 255, 255, 1)'],
          [0.4, `rgba(255, 255, 255, ${0.85 * intensity})`],
          [1, 'rgba(255, 255, 255, 0)'],
        ]);

        // 4. Ghost flares offset along the horizontal axis
        const ghosts = [
          { x: -logicalW * 0.36, r: 28, a: 0.35, c: '165, 243, 252' },
          { x: -logicalW * 0.22, r: 14, a: 0.55, c: '255, 255, 255' },
          { x: -logicalW * 0.08, r: 9,  a: 0.5,  c: '224, 252, 255' },
          { x:  logicalW * 0.08, r: 9,  a: 0.5,  c: '224, 252, 255' },
          { x:  logicalW * 0.22, r: 14, a: 0.55, c: '255, 255, 255' },
          { x:  logicalW * 0.36, r: 28, a: 0.35, c: '165, 243, 252' },
          { x:  logicalW * 0.5,  r: 18, a: 0.3,  c: '125, 211, 252' },
          { x: -logicalW * 0.5,  r: 18, a: 0.3,  c: '125, 211, 252' },
        ];
        for (const g of ghosts) {
          const r = g.r * (0.85 + 0.3 * pulseBeat);
          const ghostGrad = ctx.createRadialGradient(g.x, 0, 0, g.x, 0, r);
          ghostGrad.addColorStop(0, `rgba(${g.c}, ${(g.a * intensity).toFixed(2)})`);
          ghostGrad.addColorStop(0.6, `rgba(${g.c}, ${(g.a * intensity * 0.3).toFixed(2)})`);
          ghostGrad.addColorStop(1, `rgba(${g.c}, 0)`);
          ctx.fillStyle = ghostGrad;
          ctx.beginPath();
          ctx.arc(g.x, 0, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // 5. Tiny sparkle dots drifting near the bright core
        for (let i = 0; i < 10; i++) {
          const seed = i * 0.91;
          const phase = t * 0.6 + seed;
          const sx = Math.cos(phase) * (60 + 50 * Math.sin(t * 0.4 + seed));
          const sy = Math.sin(phase * 1.3 + seed) * 14;
          const sa = (0.5 + 0.5 * Math.sin(phase * 2.1)) * 0.7;
          const sr = 1.6 + Math.sin(phase * 1.7) * 0.8;
          const sparkleGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 4);
          sparkleGrad.addColorStop(0, `rgba(255, 255, 255, ${sa})`);
          sparkleGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = sparkleGrad;
          ctx.beginPath();
          ctx.arc(sx, sy, sr * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // ---- 6d. bright core with multi-stop radial gradient ----
        const coreR = 170 * (0.92 + 0.18 * pulseBeat);
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        coreGrad.addColorStop(0.05, 'rgba(240, 255, 255, 0.98)');
        coreGrad.addColorStop(0.18, 'rgba(165, 243, 252, 0.9)');
        coreGrad.addColorStop(0.35, 'rgba(34, 211, 238, 0.55)');
        coreGrad.addColorStop(0.6, 'rgba(14, 116, 144, 0.18)');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, coreR, 0, Math.PI * 2);
        ctx.fill();

        // ---- 6e. tiny bright pinpoint at dead center ----
        const pinGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        pinGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        pinGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = pinGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';

        // ---- 6f. expanding pulse wave synced to wave progress ----
        // Subtle cyan ring (kept on theme; the orange version clashed with the burst)
        const pulseR = 30 + pProgress * (innerRingR - 30);
        ctx.strokeStyle = `rgba(165, 243, 252, ${0.25 + 0.25 * pulseBeat})`;
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#22d3ee';
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
      } else {
        // idle / revealed: soft central glow only
        ctx.save();
        ctx.translate(cx, cy);
        const idleGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 140);
        idleGrad.addColorStop(0, 'rgba(125, 211, 252, 0.18)');
        idleGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = idleGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 140, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={800}
      className="block w-full h-full max-w-[960px] mx-auto"
    />
  );
};
