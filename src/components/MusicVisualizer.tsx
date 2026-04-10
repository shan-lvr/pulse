/**
 * Music Visualizer — Butterchurn (Milkdrop) overlay.
 *
 * Transparent WebGL visualization that reacts to Howler's master audio
 * output (BGM + SFX). Sits as a full-screen background behind the game.
 *
 * Ported from spincraft/src/components/game/MusicVisualizer.tsx — stripped
 * of the discovery-slot specific props (bgmBypass, sfxGainNode, preset
 * picker callbacks) since this project only needs a single ambient layer.
 */
import { useEffect, useRef, useState, memo, type CSSProperties } from 'react';
import { Howler } from 'howler';

interface MusicVisualizerProps {
  /** Whether visualization is enabled */
  enabled: boolean;
  /** Opacity of the overlay (0-1) */
  opacity?: number;
  /** CSS blend mode */
  blendMode?: CSSProperties['mixBlendMode'];
  /** Optional fixed preset name; if omitted a random curated preset is used */
  presetName?: string;
  /** Extra className merged onto the canvas (for positioning) */
  className?: string;
  /** Explicit z-index */
  zIndex?: number;
}

export const MusicVisualizer = memo(function MusicVisualizer({
  enabled,
  opacity = 0.45,
  blendMode = 'screen',
  presetName,
  className = 'absolute inset-0 w-full h-full pointer-events-none',
  zIndex = 0,
}: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vizRef = useRef<unknown>(null);
  const rafRef = useRef<number>(0);
  const analyserNodesRef = useRef<AudioNode[]>([]);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    let destroyed = false;

    async function init() {
      try {
        const butterchurn = (await import('butterchurn')).default;
        const butterchurnPresets = (await import('butterchurn-presets')).default;

        if (destroyed || !canvasRef.current) return;

        // Ensure Howler's Web Audio context is initialized. Touching Howler.ctx
        // lazily creates the AudioContext if it doesn't exist yet.
        const howlerCtx = Howler.ctx;
        const masterGain = (Howler as unknown as { masterGain: GainNode }).masterGain;

        if (!howlerCtx || !masterGain) {
          console.warn('[MusicViz] Howler Web Audio context not available');
          setSupported(false);
          return;
        }

        const canvas = canvasRef.current;
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // Reuse Howler's AudioContext so analyser taps stay in sync with BGM/SFX.
        const visualizer = butterchurn.createVisualizer(howlerCtx, canvas, {
          width,
          height,
          meshWidth: 24,
          meshHeight: 18,
          pixelRatio: window.devicePixelRatio || 1,
        });

        // Analyser taps on Howler's masterGain (mono + stereo L/R)
        const analyserMono = howlerCtx.createAnalyser();
        analyserMono.fftSize = 1024;
        analyserMono.smoothingTimeConstant = 0.0;
        masterGain.connect(analyserMono); // dead-end tap (no output routing)

        const splitter = howlerCtx.createChannelSplitter(2);
        const analyserL = howlerCtx.createAnalyser();
        analyserL.fftSize = 1024;
        analyserL.smoothingTimeConstant = 0.0;
        const analyserR = howlerCtx.createAnalyser();
        analyserR.fftSize = 1024;
        analyserR.smoothingTimeConstant = 0.0;
        masterGain.connect(splitter);
        splitter.connect(analyserL, 0);
        splitter.connect(analyserR, 1);
        analyserNodesRef.current = [analyserMono, splitter, analyserL, analyserR];

        const timeMono = new Uint8Array(1024);
        const timeL = new Uint8Array(1024);
        const timeR = new Uint8Array(1024);

        // Load presets
        const presets = butterchurnPresets.getPresets();

        // Add custom preset #100 (bass-reactive geometric pulse)
        try {
          const customPreset = (await import('../lib/vfx/custom-preset-100.json')).default;
          presets['#100 — Neon Geometric Pulse'] = customPreset;
        } catch {
          /* custom preset optional */
        }

        // Curated preset pool — picks atmospheric/flowing ones that pair with
        // a dark cosmic game backdrop.
        const presetNames = Object.keys(presets).sort();
        let pool = presetNames.filter(n =>
          /Geiss|flexi|martin|Aderrasi|Rovastar|shifter|Zylot|cosmic|fractal/i.test(n)
        );
        if (pool.length === 0) pool = presetNames;

        const chosen = presetName && presets[presetName]
          ? presetName
          : pool[Math.floor(Math.random() * pool.length)];
        visualizer.loadPreset(presets[chosen], 0.5);

        // Prominent, styled log so the active preset is easy to spot in the console.
        console.log(
          '%c[MusicViz] ACTIVE PRESET%c ' + chosen,
          'background:#0ea5e9;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold',
          'color:#f59e0b;font-weight:bold',
        );
        // Expose on window for quick inspection: `window.__pulseViz.preset`
        (window as unknown as { __pulseViz?: unknown }).__pulseViz = {
          preset: chosen,
          presetCount: presetNames.length,
          poolSize: pool.length,
        };

        vizRef.current = visualizer;

        // ~30fps render loop
        let lastRender = 0;
        function render(now: number) {
          if (destroyed) return;
          if (now - lastRender >= 33) {
            lastRender = now;
            if (vizRef.current) {
              analyserMono.getByteTimeDomainData(timeMono);
              analyserL.getByteTimeDomainData(timeL);
              analyserR.getByteTimeDomainData(timeR);
              (vizRef.current as { render: (opts?: unknown) => void }).render({
                audioLevels: {
                  timeByteArray: timeMono,
                  timeByteArrayL: timeL,
                  timeByteArrayR: timeR,
                },
              });
            }
          }
          rafRef.current = requestAnimationFrame(render);
        }
        rafRef.current = requestAnimationFrame(render);
      } catch (e) {
        console.warn('[MusicViz] Init failed:', (e as Error).message);
        setSupported(false);
      }
    }

    init();

    return () => {
      destroyed = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      vizRef.current = null;
      for (const node of analyserNodesRef.current) {
        try { node.disconnect(); } catch { /* ok */ }
      }
      analyserNodesRef.current = [];
    };
  }, [enabled, presetName]);

  // Handle resize — match the canvas's layout box, not necessarily the window.
  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const handleResize = () => {
      if (!vizRef.current || !canvas) return;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      (vizRef.current as { setRendererSize: (w: number, h: number) => void })
        .setRendererSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);
    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, [enabled]);

  if (!enabled || !supported) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        opacity,
        mixBlendMode: blendMode,
        zIndex,
      }}
    />
  );
});
