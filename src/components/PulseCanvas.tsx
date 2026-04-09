import React, { useEffect, useRef } from 'react';
import { SEGMENT_COUNT, Segment, Meteor } from '../lib/game-logic';

interface PulseCanvasProps {
  wave: number;
  progress: number;
  gameState: string;
  rotation: number;
  segments: Segment[];
  showSegments: boolean;
  meteors: Meteor[];
}

export const PulseCanvas: React.FC<PulseCanvasProps> = ({ wave, progress, gameState, rotation, segments = [], showSegments, meteors = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number, y: number, size: number, speed: number, angle: number, color: string }[]>([]);

  useEffect(() => {
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 100 }, () => ({
        x: Math.random() * 800,
        y: Math.random() * 800,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        angle: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
      }));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) * 0.35;

      // Draw background particles
      particlesRef.current.forEach(p => {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw the ring segments
      ctx.save();
      ctx.translate(centerX, centerY);
      
      for (let i = 0; i < SEGMENT_COUNT; i++) {
        const startAngle = (i * 2 * Math.PI) / SEGMENT_COUNT - Math.PI / 2;
        const endAngle = ((i + 1) * 2 * Math.PI) / SEGMENT_COUNT - Math.PI / 2;
        const padding = 0.05; // Small gap between segments
        
        const isSafe = segments[i]?.isSafe;
        const isDestroyed = segments[i]?.isDestroyed;
        const isRevealed = showSegments;
        const bonus = segments[i]?.bonusMultiplier;

        const innerRadius = Math.max(0, maxRadius - 40);
        ctx.beginPath();
        ctx.arc(0, 0, maxRadius, startAngle + padding, endAngle - padding);
        ctx.arc(0, 0, innerRadius, endAngle - padding, startAngle + padding, true);
        ctx.closePath();

        if (isDestroyed) {
          ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw cracks
          ctx.save();
          ctx.clip();
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
          for(let j=0; j<5; j++) {
            ctx.moveTo((Math.random()-0.5)*80, (Math.random()-0.5)*80);
            ctx.lineTo((Math.random()-0.5)*80, (Math.random()-0.5)*80);
          }
          ctx.stroke();
          ctx.restore();
        } else if (isRevealed) {
          ctx.fillStyle = isSafe ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
          ctx.shadowBlur = 15;
          ctx.shadowColor = isSafe ? '#22c55e' : '#ef4444';
        } else if (bonus) {
          // Bonus segment is always visible but distinct
          ctx.fillStyle = 'rgba(234, 179, 8, 0.3)';
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.8)';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#eab308';
        } else {
          ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
          ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw labels if revealed or if it's a bonus
        if (isDestroyed) {
          const midAngle = startAngle + (endAngle - startAngle) / 2;
          const textDist = Math.max(0, maxRadius - 20);
          ctx.save();
          ctx.rotate(midAngle + Math.PI / 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.font = 'bold 10px Orbitron';
          ctx.textAlign = 'center';
          ctx.fillText('VOID', 0, -textDist);
          ctx.restore();
        } else if (isRevealed) {
          const midAngle = startAngle + (endAngle - startAngle) / 2;
          const textDist = Math.max(0, maxRadius - 20);
          ctx.save();
          ctx.rotate(midAngle + Math.PI / 2);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Orbitron';
          ctx.textAlign = 'center';
          ctx.fillText(isSafe ? 'SAFE' : 'DEAD', 0, -textDist);
          ctx.restore();
        } else if (bonus) {
          const midAngle = startAngle + (endAngle - startAngle) / 2;
          const textDist = Math.max(0, maxRadius - 20);
          ctx.save();
          ctx.rotate(midAngle + Math.PI / 2);
          ctx.fillStyle = '#eab308';
          ctx.font = 'bold 10px Orbitron';
          ctx.textAlign = 'center';
          ctx.fillText(`+${bonus.toFixed(1)}x`, 0, -textDist);
          ctx.restore();
        }
      }

      // Inner and Outer glowing rings
      ctx.beginPath();
      ctx.arc(0, 0, maxRadius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      const innerRingRadius = Math.max(0, maxRadius - 45);
      ctx.arc(0, 0, innerRingRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      // Draw meteors
      meteors.forEach(m => {
        const targetAngle = (m.targetSegmentId * 2 * Math.PI) / SEGMENT_COUNT - Math.PI / 2 + (Math.PI / SEGMENT_COUNT);
        const startDist = 600;
        const targetDist = maxRadius;
        const currentDist = startDist - (startDist - targetDist) * m.progress;
        
        const x = centerX + Math.cos(targetAngle) * currentDist;
        const y = centerY + Math.sin(targetAngle) * currentDist;

        // Draw trail
        const trailGradient = ctx.createRadialGradient(x, y, 0, x, y, m.size * 2);
        trailGradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        trailGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = trailGradient;
        ctx.beginPath();
        ctx.arc(x, y, m.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, m.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw flame tail
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(targetAngle + Math.PI);
        const tailGradient = ctx.createLinearGradient(0, 0, m.size * 4, 0);
        tailGradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        tailGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = tailGradient;
        ctx.beginPath();
        ctx.moveTo(0, -m.size/2);
        ctx.lineTo(m.size * 4, 0);
        ctx.lineTo(0, m.size/2);
        ctx.fill();
        ctx.restore();
      });

      // Draw the expanding pulse
      if (gameState === 'PLAYING') {
        const currentRadius = Math.max(0.001, progress * (maxRadius - 45));
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        const pulseGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
        pulseGradient.addColorStop(0, 'transparent');
        pulseGradient.addColorStop(0.8, 'rgba(249, 115, 22, 0.05)');
        pulseGradient.addColorStop(1, 'rgba(249, 115, 22, 0.4)');

        ctx.fillStyle = pulseGradient;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.restore();
      }

      // Scanner head (if playing)
      if (gameState === 'PLAYING') {
        const scanRad = (rotation * Math.PI) / 180 - Math.PI / 2;
        const scanDist = Math.max(0, maxRadius - 20);
        const scanX = centerX + Math.cos(scanRad) * scanDist;
        const scanY = centerY + Math.sin(scanRad) * scanDist;

        ctx.shadowBlur = 20;
        ctx.shadowColor = 'white';
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(scanX, scanY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [wave, progress, gameState, rotation, segments, showSegments, meteors]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={800}
      className="w-full h-full max-w-[500px] max-h-[500px] mx-auto"
    />
  );
};
