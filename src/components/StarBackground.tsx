import React, { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface StarBackgroundProps {
  gameState?: string;
}

export const StarBackground: React.FC<StarBackgroundProps> = ({ gameState }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const isWinning = gameState === 'WON';

  // Generate individual special stars that can pulse
  const specialStars = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 3,
    }));
  }, []);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Parallax offsets for different layers
  const layer1X = useTransform(springX, [-500, 500], [20, -20]);
  const layer1Y = useTransform(springY, [-500, 500], [20, -20]);
  
  const layer2X = useTransform(springX, [-500, 500], [40, -40]);
  const layer2Y = useTransform(springY, [-500, 500], [40, -40]);
  
  const layer3X = useTransform(springX, [-500, 500], [60, -60]);
  const layer3Y = useTransform(springY, [-500, 500], [60, -60]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set(clientX - innerWidth / 2);
      mouseY.set(clientY - innerHeight / 2);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#020617]">
      {/* Layer 1: Small, slow stars (Deep background) */}
      <motion.div
        style={{ x: layer1X, y: layer1Y }}
        className="absolute inset-[-100px]"
      >
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 80px 120px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 110px 10px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 150px 150px, #fff, rgba(0,0,0,0))',
            backgroundSize: '200px 200px',
          }}
        />
      </motion.div>

      {/* Layer 2: Medium stars */}
      <motion.div
        style={{ x: layer2X, y: layer2Y }}
        className="absolute inset-[-100px]"
      >
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(2px 2px at 50px 50px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 150px 150px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 250px 250px, #fff, rgba(0,0,0,0))',
            backgroundSize: '300px 300px',
          }}
        />
      </motion.div>

      {/* Layer 3: Large, bright stars (Foreground) */}
      <motion.div
        style={{ x: layer3X, y: layer3Y }}
        className="absolute inset-[-100px]"
      >
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(3px 3px at 100px 100px, #fff, rgba(0,0,0,0)), radial-gradient(3px 3px at 400px 400px, #fff, rgba(0,0,0,0))',
            backgroundSize: '500px 500px',
          }}
        />
      </motion.div>

      {/* Special Pulsing Stars */}
      <div className="absolute inset-0">
        {specialStars.map((star) => (
          <motion.div
            key={star.id}
            initial={{ opacity: 0.2, scale: 1 }}
            animate={{ 
              opacity: isWinning ? [0.4, 1, 0.4] : [0.2, 0.6, 0.2],
              scale: isWinning ? [1, 2.5, 1] : [1, 1.2, 1],
            }}
            transition={{ 
              duration: isWinning ? 0.3 : star.duration, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: isWinning ? Math.random() * 0.2 : star.delay
            }}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              boxShadow: isWinning ? '0 0 10px white' : 'none',
            }}
          />
        ))}
      </div>

      {/* Nebula / Glow effects */}
      <motion.div 
        animate={{ opacity: isWinning ? 0.6 : 0.3 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(14,165,233,0.15),_transparent_70%)]" 
      />
      <motion.div 
        animate={{ opacity: isWinning ? 0.5 : 0.2 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(236,72,153,0.1),_transparent_50%)]" 
      />
      <motion.div 
        animate={{ opacity: isWinning ? 0.5 : 0.2 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(34,197,94,0.1),_transparent_50%)]" 
      />
    </div>
  );
};
