export type GameState = 'IDLE' | 'PLAYING' | 'WON' | 'LOST' | 'COLLAPSED';

export interface Segment {
  id: number;
  isSafe: boolean;
  bonusMultiplier?: number;
  isDestroyed?: boolean;
}

export interface Meteor {
  id: number;
  x: number;
  y: number;
  targetSegmentId: number;
  speed: number;
  size: number;
  angle: number;
  progress: number; // 0 to 1
}

export interface RoundData {
  segments: Segment[];
  collapseWave: number;
  multiplier: number;
}

export const SEGMENT_COUNT = 16;

export const MULTIPLIERS = [1.2, 1.6, 2.3, 3.5, 5.2, 7.8, 11.5, 17.0, 25.0, 40.0, 65.0, 100.0];

export function getMultiplier(wave: number): number {
  if (wave < 1) return 1;
  if (wave <= MULTIPLIERS.length) return MULTIPLIERS[wave - 1];
  return MULTIPLIERS[MULTIPLIERS.length - 1] * Math.pow(1.5, wave - MULTIPLIERS.length);
}

export function getSafeProbability(wave: number): number {
  if (wave <= 2) return 0.64;
  if (wave <= 4) return 0.46;
  if (wave <= 6) return 0.325;
  return 0.19;
}

export function generateSegments(wave: number): Segment[] {
  const prob = getSafeProbability(wave);
  return Array.from({ length: SEGMENT_COUNT }, (_, i) => ({
    id: i,
    isSafe: Math.random() < prob
  }));
}

export function generateCollapseWave(): number {
  // Weighted towards 3-7 waves
  const rand = Math.random();
  if (rand < 0.1) return 2;
  if (rand < 0.3) return 3;
  if (rand < 0.6) return 4;
  if (rand < 0.8) return 5;
  if (rand < 0.9) return 7;
  return 10 + Math.floor(Math.random() * 5);
}
