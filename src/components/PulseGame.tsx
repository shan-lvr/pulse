import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PulseCanvas } from './PulseCanvas';
import { StarBackground } from './StarBackground';
import { BurningStar } from './BurningStar';
import { MusicVisualizer } from './MusicVisualizer';
import { PRESET_WHITELIST } from '../lib/vfx/preset-whitelist';
import { 
  GameState, 
  generateSegments, 
  generateCollapseWave, 
  getMultiplier, 
  SEGMENT_COUNT,
  MULTIPLIERS
} from '../lib/game-logic';
import { soundManager } from '../lib/sounds';
import { Coins, Zap, ShieldAlert, Trophy, History, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

// Mock toast since sonner was deleted
const toast = {
  success: (msg: string, options?: any) => console.log('Success:', msg, options),
  error: (msg: string, options?: any) => console.log('Error:', msg, options),
};

// Custom Button component to replace deleted shadcn button
const CustomButton = ({ children, className, ...props }: any) => (
  <button 
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default function PulseGame() {
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [wave, setWave] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [segments, setSegments] = useState(generateSegments(1));
  const [collapseWave, setCollapseWave] = useState(0);
  const [bonusTotal, setBonusTotal] = useState(0);
  const [history, setHistory] = useState<{ multiplier: number, won: boolean, amount: number }[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [vizEnabled, setVizEnabled] = useState(true);

  const gameLoopRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastBonusSegmentId = useRef<number | null>(null);
  const lastPlayedWaveRef = useRef<number>(0);
  const lastPulseTimeRef = useRef<number>(0);
  // Live rotation mirror so cashOut() always uses the latest value, not the
  // potentially one-frame-stale React state.
  const rotationRef = useRef<number>(0);
  const waveDuration = 2000; // 2 seconds per wave
  const rotationSpeed = 180; // Degrees per second

  const startGame = () => {
    if (betAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    setBalance(prev => prev - betAmount);
    setGameState('PLAYING');
    setWave(1);
    lastPlayedWaveRef.current = 1;
    soundManager.play('bgm'); // Start background music
    soundManager.play('waveStart'); // Play sound for the first wave
    setProgress(0);
    setRotation(0);
    rotationRef.current = 0;
    setBonusTotal(0);
    lastBonusSegmentId.current = null;
    setSegments(generateSegments(1));
    setCollapseWave(generateCollapseWave());
    startTimeRef.current = performance.now();
    lastPulseTimeRef.current = performance.now();
  };

  const cashOut = () => {
    if (gameState !== 'PLAYING') return;

    // Use the live ref so the landing segment matches whatever the canvas
    // was showing at the instant the user clicked CASH OUT.
    const liveRotation = rotationRef.current;
    const normalizedRotation = ((liveRotation % 360) + 360) % 360;
    const segmentIndex = Math.floor(normalizedRotation / (360 / SEGMENT_COUNT));
    const isSafe = segments[segmentIndex].isSafe;
    const baseMultiplier = getMultiplier(wave);
    const finalMultiplier = baseMultiplier + bonusTotal;

    if (isSafe) {
      const winAmount = betAmount * finalMultiplier;
      setBalance(prev => prev + winAmount);
      setGameState('WON');
      soundManager.stop('bgm');
      soundManager.play('win');
      setHistory(prev => [{ multiplier: finalMultiplier, won: true, amount: winAmount }, ...prev].slice(0, 10));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success(`Cashed out at ${finalMultiplier.toFixed(1)}x! Won $${winAmount.toFixed(2)}`);
    } else {
      setGameState('LOST');
      soundManager.stop('bgm');
      soundManager.play('collapse');
      setHistory(prev => [{ multiplier: finalMultiplier, won: false, amount: betAmount }, ...prev].slice(0, 10));
      toast.error("Hit a dead zone!");
    }
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      const update = (time: number) => {
        const elapsed = time - startTimeRef.current;
        const currentWave = Math.floor(elapsed / waveDuration) + 1;
        const currentProgress = (elapsed % waveDuration) / waveDuration;
        const currentRotation = (elapsed / 1000) * rotationSpeed;

        if (currentWave > collapseWave) {
          setGameState('COLLAPSED');
          soundManager.stop('bgm');
          soundManager.play('collapse');
          setHistory(prev => [{ multiplier: 0, won: false, amount: betAmount }, ...prev].slice(0, 10));
          toast.error("Pulse collapsed!");
          return;
        }

        // Rhythmic pulse audio (speeds up with wave intensity)
        const pulseInterval = Math.max(200, 500 - (wave * 20));
        if (time - lastPulseTimeRef.current >= pulseInterval) {
          soundManager.play('pulse');
          lastPulseTimeRef.current = time;
        }

        // Check for bonus collection
        const normalizedRotation = ((currentRotation % 360) + 360) % 360;
        const segmentIndex = Math.floor(normalizedRotation / (360 / SEGMENT_COUNT));
        const currentSegment = segments[segmentIndex];

        if (currentSegment?.bonusMultiplier && lastBonusSegmentId.current !== segmentIndex) {
          const bonus = currentSegment.bonusMultiplier;
          setBonusTotal(prev => prev + bonus);
          lastBonusSegmentId.current = segmentIndex;
          soundManager.play('bonus');
          toast.success(`BONUS COLLECTED: +${bonus.toFixed(1)}x`, {
            icon: '💎',
            duration: 1000
          });
        }

        if (currentWave !== wave && lastPlayedWaveRef.current !== currentWave) {
          setWave(currentWave);
          lastPlayedWaveRef.current = currentWave;
          soundManager.play('waveStart');
          const newSegments = generateSegments(currentWave);
          
          // Randomly add a bonus segment (20% chance per wave)
          if (Math.random() < 0.2) {
            const bonusIdx = Math.floor(Math.random() * SEGMENT_COUNT);
            newSegments[bonusIdx].bonusMultiplier = 0.5 + Math.random() * 1.5;
            lastBonusSegmentId.current = null; // Reset for the new wave's bonus
          }
          
          setSegments(newSegments);
        }
        setProgress(currentProgress);
        setRotation(currentRotation);
        rotationRef.current = currentRotation;
        gameLoopRef.current = requestAnimationFrame(update);
      };

      gameLoopRef.current = requestAnimationFrame(update);
    } else {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, wave, collapseWave, betAmount, segments, bonusTotal]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.toggle(!newMuted);
    if (newMuted) {
      soundManager.stop('bgm');
    } else if (gameState === 'PLAYING') {
      soundManager.play('bgm');
    }
  };

  const currentMultiplier = getMultiplier(wave);
  const intensity = Math.min(wave / 10, 1.5);
  const nextMultiplier = getMultiplier(wave + 1);
  const timeLeft = Math.max(0, (waveDuration - (progress * waveDuration)) / 1000);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 relative overflow-hidden bg-[#020617]">
      <StarBackground gameState={gameState} />
      <div className="atmosphere" />
      <MusicVisualizer
        enabled={vizEnabled && !isMuted}
        opacity={0.45}
        blendMode="screen"
        presetWhitelist={PRESET_WHITELIST}
      />
      
      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center z-10 gap-2">
        <div className="flex flex-col">
          <div className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-sky-400/60 uppercase">Bet</div>
          <div className="text-lg md:text-2xl font-display font-black text-white glow-blue">${betAmount.toFixed(2)}</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-5xl font-display font-black tracking-tighter text-white glow-blue italic">PULSE</div>
          <div className="ui-line w-24 md:w-48 mt-1" />
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={toggleMute}
              className="p-1.5 md:p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              {isMuted ? <VolumeX className="w-3 h-3 md:w-4 md:h-4" /> : <Volume2 className="w-3 h-3 md:w-4 md:h-4" />}
            </button>
            <div className="flex flex-col items-end">
              <div className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-sky-400/60 uppercase">Next</div>
              <div className="flex items-center gap-1 md:gap-3">
                <span className="text-sm md:text-xl font-display font-bold text-white/80">{timeLeft.toFixed(1)}s</span>
                <span className="text-lg md:text-2xl font-display font-black text-orange-500 glow-orange">{nextMultiplier.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <motion.div
        animate={gameState === 'PLAYING' ? {
          x: [0, -1 * intensity * 2, 1 * intensity * 2, -0.5 * intensity * 2, 0.5 * intensity * 2, 0],
          y: [0, 1 * intensity * 2, -1 * intensity * 2, 0.5 * intensity * 2, -0.5 * intensity * 2, 0],
        } : { x: 0, y: 0 }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          ease: "linear"
        }}
        className="flex-1 w-full flex items-center justify-center relative"
      >
        {/* Center Canvas — true page-center alignment */}
        <div className="relative w-full max-w-[640px] aspect-square mx-auto flex items-center justify-center">
          <PulseCanvas
            wave={wave}
            progress={progress}
            gameState={gameState}
            rotation={rotation}
            segments={segments}
            showSegments={gameState !== 'PLAYING' && gameState !== 'IDLE'}
            collapseWave={collapseWave}
          />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="relative flex flex-col items-center justify-center">
              <div
                className="absolute z-0"
                style={{ opacity: gameState === 'PLAYING' ? 0 : 1, transition: 'opacity 0.4s' }}
              >
                <BurningStar wave={wave} gameState={gameState} />
              </div>
              <motion.div 
                key={wave}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 text-3xl md:text-[40px] font-display font-black text-white glow-blue italic tracking-tighter"
              >
                {(currentMultiplier + bonusTotal).toFixed(1)}x
              </motion.div>
              {bonusTotal > 0 && (
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="relative z-10 text-sm md:text-xl font-display font-bold text-yellow-500 glow-yellow mt-1 md:mt-2"
                >
                  +{bonusTotal.toFixed(1)}x BONUS
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-6xl flex flex-col gap-4 md:gap-6 z-10 mb-2 md:mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center md:items-end px-4 gap-4 md:gap-0">
          <div className="flex flex-col items-center md:items-start order-2 md:order-1">
            <div className="flex flex-col mb-1 items-center md:items-start">
              <div className="text-lg md:text-2xl font-display font-black text-green-500 glow-green tracking-tighter">SAFE ZONE</div>
              <div className="text-[7px] md:text-[8px] font-bold tracking-[0.2em] text-green-400/60 uppercase">Cash out here!</div>
            </div>
            <div className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-sky-400/60 uppercase">Payout</div>
            <div className="text-2xl md:text-3xl font-display font-black text-white glow-blue italic">${(betAmount * (currentMultiplier + bonusTotal)).toFixed(2)}</div>
          </div>

          <div className="flex flex-col items-center gap-3 md:gap-4 order-1 md:order-2">
            {gameState === 'PLAYING' ? (
              <button 
                onClick={cashOut}
                className="cash-out-btn w-full md:w-auto px-10 md:px-20 py-4 md:py-5 rounded-full text-2xl md:text-4xl font-display font-black text-white italic tracking-tighter uppercase"
              >
                CASH OUT
              </button>
            ) : (gameState === 'WON' || gameState === 'LOST' || gameState === 'COLLAPSED') ? (
              <div className="flex flex-col items-center gap-3 md:gap-4 w-full">
                <div className="hidden md:block h-[42px]" />
                <button 
                  onClick={() => setGameState('IDLE')}
                  className="bg-sky-600 hover:bg-sky-500 w-full md:w-auto px-10 md:px-20 py-4 md:py-5 rounded-full text-xl md:text-3xl font-display font-black text-white italic tracking-tight shadow-[0_0_30px_rgba(14,165,233,0.3)] transition-all uppercase"
                >
                  CONTINUE
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 md:gap-4 w-full">
                <div className="flex gap-1 md:gap-2 bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/10 w-full md:w-auto justify-center">
                  {[10, 25, 50, 100].map(amt => (
                    <CustomButton 
                      key={amt}
                      onClick={() => setBetAmount(amt)}
                      className={`font-display text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 flex-1 md:flex-none ${betAmount === amt ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'text-white/40 hover:text-white/60'}`}
                    >
                      ${amt}
                    </CustomButton>
                  ))}
                </div>
                <button 
                  onClick={startGame}
                  disabled={betAmount <= 0 || betAmount > balance}
                  className="bg-sky-600 hover:bg-sky-500 w-full md:w-auto px-10 md:px-20 py-4 md:py-5 rounded-full text-xl md:text-3xl font-display font-black text-white italic tracking-tight shadow-[0_0_30px_rgba(14,165,233,0.3)] transition-all uppercase"
                >
                  PLACE BET
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center md:items-end order-3">
            <div className="flex flex-col items-center md:items-end mb-1">
              <div className="text-lg md:text-2xl font-display font-black text-red-500 glow-red tracking-tighter">HIDDEN DEAD ZONE</div>
              <div className="text-[7px] md:text-[8px] font-bold tracking-[0.2em] text-red-400/60 uppercase">Instant Loss!</div>
            </div>
            <div className="h-6 md:h-8 flex items-end">
              {wave >= collapseWave - 1 && gameState === 'PLAYING' && (
                <motion.div 
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="flex items-center gap-1 md:gap-2 text-red-500 font-display font-bold text-xs md:text-sm glow-red"
                >
                  <ShieldAlert className="w-3 h-3 md:w-4 md:h-4" />
                  ! COLLAPSE IMMINENT !
                </motion.div>
              )}
            </div>
            <div className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-sky-400/60 uppercase mt-1 md:mt-2">Balance</div>
            <div className="text-lg md:text-xl font-display font-bold text-white/60">${balance.toFixed(2)}</div>
          </div>
        </div>

        {/* Waves History Footer */}
        <div className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-2 md:p-3 flex items-center gap-3 md:gap-6 overflow-hidden">
          <div className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase shrink-0">Waves</div>
          <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar pb-1">
            {MULTIPLIERS.slice(0, 10).map((m, i) => {
              const isActive = i + 1 === wave;
              const isPast = i + 1 < wave;
              return (
                <div 
                  key={i} 
                  className={`flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-lg border transition-all shrink-0 ${
                    isActive 
                      ? 'bg-white/20 border-white/40 scale-105 md:scale-110 z-10 shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                      : isPast 
                        ? 'bg-white/5 border-white/10 opacity-60' 
                        : 'bg-transparent border-white/5 opacity-30'
                  }`}
                >
                  <span className={`text-xs md:text-sm font-display font-bold ${isActive ? 'text-white glow-blue' : 'text-white/80'}`}>
                    {m.toFixed(1)}x
                  </span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-lg border border-white/5 opacity-20 shrink-0">
              <span className="text-xs md:text-sm font-display font-bold text-white/50 italic">???</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background visualizer toggle (bottom-right, fixed) */}
      <button
        onClick={() => setVizEnabled(v => !v)}
        aria-label={vizEnabled ? 'Disable background visualizer' : 'Enable background visualizer'}
        title={vizEnabled ? 'Disable background FX' : 'Enable background FX'}
        className="fixed bottom-3 right-3 z-[60] text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1.5 rounded-md border border-white/15 bg-black/50 backdrop-blur-md text-white/70 hover:text-white hover:bg-black/70 transition-colors"
      >
        FX {vizEnabled ? 'ON' : 'OFF'}
      </button>

      {/* Result Overlay */}
      <AnimatePresence>
        {(gameState === 'WON' || gameState === 'LOST' || gameState === 'COLLAPSED') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] pointer-events-none"
          >
            <div className="flex flex-col items-center">
              <div className={`text-4xl md:text-7xl font-display font-black italic mb-2 ${gameState === 'WON' ? 'text-green-500 glow-green' : 'text-red-500 glow-red'}`}>
                {gameState === 'WON' ? 'WINNER!' : gameState === 'COLLAPSED' ? 'COLLAPSED' : 'BUSTED'}
              </div>
              {gameState === 'WON' && (
                <div className="text-xl md:text-3xl font-display text-white">
                  +${(betAmount * (currentMultiplier + bonusTotal)).toFixed(2)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
