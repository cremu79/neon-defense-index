
export interface Vector2 {
  x: number;
  y: number;
}

export enum EntityType {
  BASE = 'BASE',
  WALL = 'WALL',
  TOWER_BASIC = 'TOWER_BASIC',
  TOWER_SNIPER = 'TOWER_SNIPER',
  TOWER_TESLA = 'TOWER_TESLA',
  TOWER_RAPID = 'TOWER_RAPID',
  TOWER_BOMB = 'TOWER_BOMB',
  TOWER_ICE = 'TOWER_ICE',
  ENEMY_ZOMBIE = 'ENEMY_ZOMBIE',
  ENEMY_TANK = 'ENEMY_TANK',
  ENEMY_BOSS = 'ENEMY_BOSS',
  ENEMY_RANGED = 'ENEMY_RANGED',
  PROJECTILE = 'PROJECTILE',
  PARTICLE = 'PARTICLE',
  LIGHTNING = 'LIGHTNING',
  ITEM_REPAIR = 'ITEM_REPAIR',
  ITEM_TRAP = 'ITEM_TRAP',
  TECH_ECONOMY = 'TECH_ECONOMY',
  TECH_DURABILITY = 'TECH_DURABILITY',
}

export enum TargetPriority {
  CLOSEST = 'CLOSEST',
  FURTHEST = 'FURTHEST',
  WEAKEST = 'WEAKEST',
  STRONGEST = 'STRONGEST',
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  targetPos?: Vector2; // Added for lightning visuals
  size: number; // Radius
  color: string;
  hp: number;
  maxHp: number;
  rotation: number;
  remove?: boolean;
  
  // Upgrade System
  level?: number;
  cost?: number;

  // Combat stats
  damage?: number;
  range?: number;
  cooldown?: number;
  lastFired?: number;
  targetId?: string | null;
  priority?: TargetPriority; 
  
  // Ammo & Reload
  maxAmmo?: number;
  currentAmmo?: number;
  reloadTime?: number; // in ms
  reloadTimer?: number; // current progress
  isReloading?: boolean;

  // AoE & Effects
  blastRadius?: number;
  freezeStrength?: number; // 0 to 1 (percentage slow)
  freezeTimer?: number; // ms remaining

  // Movement
  velocity?: Vector2;
  speed?: number;
  baseSpeed?: number; // To calculate slow
  
  // Visuals
  glowColor?: string;
  pulse?: number;
  
  // Projectile flags
  isEnemyProjectile?: boolean;
}

export interface GlobalUpgrades {
  economyLevel: number;
  durabilityLevel: number;
}

export interface GameState {
  entities: Entity[];
  wave: number;
  energy: number;
  baseHp: number;
  maxBaseHp: number;
  isGameOver: boolean;
  waveInProgress: boolean;
  enemiesToSpawn: EntityType[];
  spawnTimer: number;
  prepTimer: number;
  globalUpgrades: GlobalUpgrades;
}

export const GRID_SIZE = 30;