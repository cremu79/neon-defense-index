
import { EntityType } from './types';

export const COLORS = {
  NEON_BLUE: '#00f3ff',
  NEON_GREEN: '#0aff0a',
  NEON_RED: '#ff003c',
  NEON_PURPLE: '#bc13fe',
  NEON_YELLOW: '#f5ff00',
  NEON_ORANGE: '#ff7b00',
  NEON_ICE: '#a5f3fc',
  BG_GRID: '#1a1a2e',
};

export const BUILD_COSTS = {
  [EntityType.TOWER_BASIC]: 50,
  [EntityType.TOWER_RAPID]: 120,
  [EntityType.TOWER_SNIPER]: 750,
  [EntityType.TOWER_TESLA]: 900,
  [EntityType.TOWER_BOMB]: 400,
  [EntityType.TOWER_ICE]: 500,
  [EntityType.WALL]: 50,
  [EntityType.ITEM_REPAIR]: 30,
  [EntityType.ITEM_TRAP]: 100,
  // Initial costs for global upgrades
  [EntityType.TECH_ECONOMY]: 5000,
  [EntityType.TECH_DURABILITY]: 2500,
};

export const TECH_STATS = {
  [EntityType.TECH_ECONOMY]: { costScale: 1.5, effectPerLevel: 0.2 }, // +20% energy per level
  [EntityType.TECH_DURABILITY]: { costScale: 1.5, effectPerLevel: 0.25 }, // +25% max hp per level
};

export const TOWER_STATS = {
  [EntityType.TOWER_BASIC]: { 
    range: 200, damage: 20, cooldown: 800, color: COLORS.NEON_BLUE, hp: 100,
    maxAmmo: 20, reloadTime: 2000 
  },
  [EntityType.TOWER_RAPID]: { 
    range: 150, damage: 8, cooldown: 150, color: COLORS.NEON_YELLOW, hp: 80,
    maxAmmo: 60, reloadTime: 3000
  },
  [EntityType.TOWER_SNIPER]: { 
    range: 400, damage: 200, cooldown: 2000, color: COLORS.NEON_RED, hp: 60,
    maxAmmo: 5, reloadTime: 4000
  },
  [EntityType.TOWER_TESLA]: { 
    range: 180, damage: 30, cooldown: 1000, color: COLORS.NEON_PURPLE, hp: 150,
    maxAmmo: 15, reloadTime: 2500
  },
  [EntityType.TOWER_BOMB]: { 
    range: 250, damage: 60, cooldown: 2500, color: COLORS.NEON_ORANGE, hp: 120,
    maxAmmo: 8, reloadTime: 3500, blastRadius: 50 // Covers 3x3 grid (approx 100px diameter)
  },
  [EntityType.TOWER_ICE]: { 
    range: 320, damage: 5, cooldown: 300, color: COLORS.NEON_ICE, hp: 90,
    maxAmmo: 40, reloadTime: 2000, freezeStrength: 0.5 // 50% slow
  },
  [EntityType.WALL]: { hp: 300, color: '#3b82f6' }, // HP Increased from 200 to 300
  [EntityType.ITEM_TRAP]: { hp: 50, damage: 500, blastRadius: 50, color: COLORS.NEON_RED } // blastRadius 50 for 3x3
};

export const ENEMY_STATS = {
  [EntityType.ENEMY_ZOMBIE]: { hp: 30, speed: 1.5, damage: 5, score: 10, color: COLORS.NEON_GREEN, size: 12 },
  [EntityType.ENEMY_TANK]: { hp: 150, speed: 0.8, damage: 15, score: 30, color: COLORS.NEON_RED, size: 18 },
  [EntityType.ENEMY_BOSS]: { hp: 2000, speed: 0.4, damage: 100, score: 500, color: COLORS.NEON_PURPLE, size: 45 },
  [EntityType.ENEMY_RANGED]: { hp: 60, speed: 1.2, damage: 10, score: 20, color: COLORS.NEON_ORANGE, size: 14, attackRange: 100 },
};

export const INITIAL_ENERGY = 350;
export const INITIAL_BASE_HP = 1000;
export const REFUND_RATE = 0.7;
export const BASE_TOWER_COUNT = 20;
