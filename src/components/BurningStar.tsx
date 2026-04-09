import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface BurningStarProps {
  wave: number;
  gameState: string;
}

export const BurningStar: React.FC<BurningStarProps> = ({ wave, gameState }) => {
  // Calculate intensity based on wave (1 to 10+)
  const intensity = Math.min(wave / 10, 1.5);
  const isActive = gameState === 'PLAYING';
  
  // Base size and scaling
  const baseSize = 40;
  const scale = 1 + intensity * 1.5;
  
  // Generate random embers
  const embers = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      angle: (i / 12) * Math.PI * 2 + Math.random() * 0.5,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 1.5,
      size: 1 + Math.random() * 2,
    }));
  }, []);

  // Generate solar flares
  const flares = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      rotation: i * 90 + Math.random() * 45,
      delay: Math.random() * 3,
    }));
  }, []);

  // Main Star Body
  const pulseDuration = Math.max(0.2, 0.5 - (wave * 0.02));

  const isExploding = gameState === 'COLLAPSED' || gameState === 'LOST';

  // Generate explosion fragments
  const fragments = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      angle: (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
      distance: 100 + Math.random() * 200,
      size: 5 + Math.random() * 15,
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 720,
    }));
  }, []);

  return (
    <div className="flex items-center justify-center pointer-events-none relative">
      {/* SVG Filters for Turbulence and Displacement */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="sun-turbulence">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="1">
              <animate attributeName="baseFrequency" dur="60s" values="0.02;0.03;0.02" repeatCount="indefinite" />
              <animate attributeName="seed" dur="20s" values="1;100;1" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="8" />
          </filter>
          
          <filter id="flare-turbulence">
            <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" />
          </filter>
        </defs>
      </svg>

      {/* Explosion Effect Layer */}
      {isExploding && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          {/* Shockwave */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute rounded-full border-4 border-orange-500"
            style={{ width: baseSize, height: baseSize }}
          />
          
          {/* Fragments */}
          {fragments.map((frag) => (
            <motion.div
              key={frag.id}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: frag.rotation }}
              animate={{ 
                x: Math.cos(frag.angle) * frag.distance,
                y: Math.sin(frag.angle) * frag.distance,
                scale: 0,
                opacity: 0,
                rotate: frag.rotation + frag.spin
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute bg-gradient-to-br from-yellow-400 to-red-600"
              style={{
                width: frag.size,
                height: frag.size,
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                boxShadow: '0 0 10px #f97316',
              }}
            />
          ))}

          {/* Central Flash */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute rounded-full bg-white"
            style={{ width: baseSize * 2, height: baseSize * 2, filter: 'blur(20px)' }}
          />

          {/* Burst Embers */}
          {Array.from({ length: 30 }).map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 150;
            return (
              <motion.div
                key={`burst-${i}`}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ 
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                  opacity: 0,
                  scale: 0
                }}
                transition={{ duration: 0.5 + Math.random() * 0.5, ease: "easeOut" }}
                className="absolute rounded-full bg-yellow-500"
                style={{ width: 2, height: 2, boxShadow: '0 0 5px #fbbf24' }}
              />
            );
          })}
        </div>
      )}

      {/* Star Content Wrapper - Fades out on explosion */}
      <motion.div
        animate={{ 
          opacity: isExploding ? 0 : 1,
          scale: isExploding ? 1.5 : 1
        }}
        transition={{ duration: 0.2 }}
        className="relative flex items-center justify-center"
      >
        {/* Outer Atmospheric Glow */}
        <motion.div
          animate={{
            scale: [scale, scale * 1.2, scale],
            opacity: isActive ? [0.1, 0.2, 0.1] : 0.05,
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            width: baseSize * 4,
            height: baseSize * 4,
            background: 'radial-gradient(circle, rgba(255, 69, 0, 0.15) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Solar Flares */}
        {flares.map((flare) => (
          <motion.div
            key={flare.id}
            animate={{
              rotate: [flare.rotation, flare.rotation + 360],
              scale: [1, 1.3, 1],
              opacity: isActive ? [0.15, 0.3, 0.15] : 0,
            }}
            transition={{
              rotate: { duration: 25 + flare.id * 5, repeat: Infinity, ease: "linear" },
              scale: { duration: 4 + flare.id, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute"
            style={{
              width: baseSize * 3 * scale,
              height: baseSize * 0.4 * scale,
              background: 'linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.2), transparent)',
              filter: 'url(#flare-turbulence) blur(4px)',
              transformOrigin: 'center center',
            }}
          />
        ))}

        {/* Corona Layer 1 (Turbulent) */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [scale * 1.1, scale * 1.2, scale * 1.1],
          }}
          transition={{
            rotate: { duration: 40, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute rounded-full"
          style={{
            width: baseSize * 1.8 * scale,
            height: baseSize * 1.8 * scale,
            background: 'radial-gradient(circle, rgba(255, 69, 0, 0.3) 0%, rgba(255, 0, 0, 0.1) 60%, transparent 80%)',
            filter: 'url(#sun-turbulence) blur(2px)',
          }}
        />

        {/* Corona Layer 2 (Reversed Turbulence) */}
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [scale * 1.05, scale * 1.15, scale * 1.05],
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute rounded-full"
          style={{
            width: baseSize * 1.6 * scale,
            height: baseSize * 1.6 * scale,
            background: 'radial-gradient(circle, rgba(255, 165, 0, 0.25) 0%, rgba(255, 69, 0, 0.15) 50%, transparent 70%)',
            filter: 'url(#sun-turbulence) blur(1px)',
          }}
        />

        {/* Main Sun Body */}
        <motion.div
          animate={{
            scale: isActive ? [1, 1.03, 1] : 1,
          }}
          transition={{
            duration: pulseDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full z-10"
          style={{
            width: baseSize * scale,
            height: baseSize * scale,
            opacity: 0.6,
            background: 'radial-gradient(circle, #fff 0%, #fff7ed 10%, #fbbf24 30%, #f97316 60%, #ea580c 85%, #991b1b 100%)',
            boxShadow: `
              0 0 ${20 * scale}px #fbbf24,
              0 0 ${40 * scale}px #f97316,
              0 0 ${60 * scale}px #ea580c,
              inset 0 0 ${15 * scale}px rgba(0,0,0,0.3)
            `,
          }}
        />

        {/* Core Brightness */}
        <motion.div
          animate={{
            opacity: [0.4, 0.6, 0.4],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 0.1,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute rounded-full z-20"
          style={{
            width: baseSize * 0.4 * scale,
            height: baseSize * 0.4 * scale,
            background: 'white',
            filter: 'blur(8px)',
            boxShadow: '0 0 20px white',
          }}
        />
      </motion.div>

      {/* Embers Particle System */}
      {isActive && embers.map((ember) => (
        <motion.div
          key={ember.id}
          initial={{ 
            x: 0, 
            y: 0, 
            opacity: 0,
            scale: 1
          }}
          animate={{
            x: Math.cos(ember.angle) * (baseSize * 2 * scale),
            y: Math.sin(ember.angle) * (baseSize * 2 * scale),
            opacity: [0, 1, 1, 0],
            scale: [1, 1.5, 0.5],
          }}
          transition={{
            duration: ember.duration,
            repeat: Infinity,
            delay: ember.delay,
            ease: "easeOut",
          }}
          className="absolute rounded-full z-30"
          style={{
            width: ember.size,
            height: ember.size,
            background: Math.random() > 0.5 ? '#fbbf24' : '#f97316',
            boxShadow: `0 0 5px ${Math.random() > 0.5 ? '#fbbf24' : '#f97316'}`,
          }}
        />
      ))}

      {/* Heat Haze Distortion */}
      <motion.div 
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: baseSize * scale * 3.5,
          height: baseSize * scale * 3.5,
          backdropFilter: `blur(${intensity * 6}px)`,
          WebkitBackdropFilter: `blur(${intensity * 6}px)`,
          opacity: isActive ? 0.4 : 0,
          zIndex: 5,
        }}
      />
    </div>
  );
};
