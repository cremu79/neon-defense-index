
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Entity, EntityType, GameState, Vector2, GRID_SIZE, TargetPriority } from '../types';
import { COLORS, BUILD_COSTS, TOWER_STATS, ENEMY_STATS, INITIAL_ENERGY, INITIAL_BASE_HP, REFUND_RATE, TECH_STATS, BASE_TOWER_COUNT } from '../constants';
import { HUD } from './HUD';
import { BuildMenu } from './BuildMenu';
import { RefreshCw, Trash2, X, ArrowUpCircle, ArrowRight, Crosshair, Signal, HeartCrack, Activity, Timer } from 'lucide-react';

// --- Helper Math ---
const distance = (a: Vector2, b: Vector2) => Math.hypot(a.x - b.x, a.y - b.y);
const normalize = (v: Vector2): Vector2 => {
  const mag = Math.hypot(v.x, v.y);
  return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag };
};

// --- Game Component ---
export const GameEngine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mutable Game State (Refs for performance in game loop)
  const state = useRef<GameState>({
    entities: [],
    wave: 1,
    energy: INITIAL_ENERGY,
    baseHp: INITIAL_BASE_HP,
    maxBaseHp: INITIAL_BASE_HP,
    isGameOver: false,
    waveInProgress: false,
    enemiesToSpawn: [],
    spawnTimer: 0,
    prepTimer: 20000,
    globalUpgrades: {
        economyLevel: 1,
        durabilityLevel: 1,
    }
  });

  // React State for UI updates (synced occasionally or on events)
  const [uiState, setUiState] = useState({
    energy: INITIAL_ENERGY,
    baseHp: INITIAL_BASE_HP,
    wave: 1,
    isGameOver: false,
    waveInProgress: false,
    prepTimer: 20000,
    globalUpgrades: { economyLevel: 1, durabilityLevel: 1 },
    towerCount: 0,
    maxTowerCount: BASE_TOWER_COUNT
  });
  
  const [buildMode, setBuildMode] = useState<EntityType | null>(null);
  const [mousePos, setMousePos] = useState<Vector2>({ x: 0, y: 0 });
  
  // Info Card State
  const [infoCard, setInfoCard] = useState<{ entity: Entity; x: number; y: number } | null>(null);
  const infoCardRef = useRef<HTMLDivElement>(null);

  // Calculate Dynamic Tower Limit
  const getMaxTowerCount = (wave: number) => {
      return BASE_TOWER_COUNT + Math.floor((wave - 1) / 10) * 5;
  };

  // Initialize Game
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    // Center snap
    const centerX = Math.floor(width / 2 / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
    const centerY = Math.floor(height / 2 / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;

    // Create Base
    const base: Entity = {
      id: 'base',
      type: EntityType.BASE,
      pos: { x: centerX, y: centerY },
      size: GRID_SIZE, // Base is slightly larger
      color: COLORS.NEON_BLUE,
      hp: INITIAL_BASE_HP,
      maxHp: INITIAL_BASE_HP,
      rotation: 0,
      level: 1,
      cost: 0
    };
    
    // Create initial walls around base
    const walls: Entity[] = [];
    const gridCx = Math.floor(centerX / GRID_SIZE);
    const gridCy = Math.floor(centerY / GRID_SIZE);

    const wallLayout = [
      {x: -2, y: -2}, {x: -1, y: -2}, {x: 0, y: -2}, {x: 1, y: -2}, {x: 2, y: -2},
      {x: -2, y: 2}, {x: -1, y: 2}, {x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2},
      {x: -2, y: -1}, {x: -2, y: 0}, {x: -2, y: 1},
      {x: 2, y: -1}, {x: 2, y: 0}, {x: 2, y: 1},
    ];
    
    wallLayout.forEach((offset, i) => {
       const stats = TOWER_STATS[EntityType.WALL];
       walls.push({
         id: `wall-init-${i}`,
         type: EntityType.WALL,
         pos: { x: (gridCx + offset.x) * GRID_SIZE + GRID_SIZE/2, y: (gridCy + offset.y) * GRID_SIZE + GRID_SIZE/2 },
         size: GRID_SIZE / 2 - 2,
         color: COLORS.NEON_BLUE,
         hp: stats.hp!,
         maxHp: stats.hp!,
         rotation: 0,
         level: 1,
         cost: BUILD_COSTS[EntityType.WALL]
       });
    });

    state.current = {
      entities: [base, ...walls],
      wave: 1,
      energy: INITIAL_ENERGY,
      baseHp: INITIAL_BASE_HP,
      maxBaseHp: INITIAL_BASE_HP,
      isGameOver: false,
      waveInProgress: false, 
      enemiesToSpawn: [],
      spawnTimer: 0,
      prepTimer: 20000, 
      globalUpgrades: {
          economyLevel: 1,
          durabilityLevel: 1,
      }
    };
    
    syncUi();
  }, []);

  const generateWave = (waveNum: number): EntityType[] => {
    const enemies: EntityType[] = [];
    const isBossLevel = waveNum % 5 === 0;
    
    if (isBossLevel) {
      enemies.push(EntityType.ENEMY_BOSS);
      for(let i=0; i< waveNum * 2; i++) enemies.push(EntityType.ENEMY_ZOMBIE);
    } else {
      // Check if we should spawn ranged enemies (Start from Wave 3)
      const canSpawnRanged = waveNum >= 3;
      
      const count = 5 + Math.floor(waveNum * 1.5); // Linear increase for count
      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        if (waveNum > 2 && i % 5 === 0) {
            enemies.push(EntityType.ENEMY_TANK);
        } else if (canSpawnRanged && rand > 0.7) {
            enemies.push(EntityType.ENEMY_RANGED);
        } else {
            enemies.push(EntityType.ENEMY_ZOMBIE);
        }
      }
    }
    return enemies;
  };

  const syncUi = () => {
    setUiState({
      energy: state.current.energy,
      baseHp: state.current.baseHp,
      wave: state.current.wave,
      isGameOver: state.current.isGameOver,
      waveInProgress: state.current.waveInProgress,
      prepTimer: state.current.prepTimer,
      globalUpgrades: { ...state.current.globalUpgrades },
      towerCount: state.current.entities.filter(e => e.type.startsWith('TOWER')).length,
      maxTowerCount: getMaxTowerCount(state.current.wave)
    });
  };

  // Keyboard Handler for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setBuildMode(null);
            setInfoCard(null);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (state.current.entities.length === 0) initGame();
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let animationFrameId: number;
    let lastTime = performance.now();

    const update = (dt: number) => {
      const s = state.current;
      if (s.isGameOver) return;

      // 1. Game Flow & Spawning
      if (!s.waveInProgress) {
          const prevSec = Math.ceil(s.prepTimer / 1000);
          s.prepTimer -= dt;
          const currSec = Math.ceil(s.prepTimer / 1000);

          if (currSec !== prevSec) {
              syncUi();
          }

          if (s.prepTimer <= 0) {
              s.waveInProgress = true;
              s.enemiesToSpawn = generateWave(s.wave);
              s.spawnTimer = 0;
              syncUi();
          }
      } else {
          s.spawnTimer -= dt;
          if (s.spawnTimer <= 0 && s.enemiesToSpawn.length > 0) {
              const type = s.enemiesToSpawn.shift()!;
              spawnEnemy(type, canvas.width, canvas.height);
              s.spawnTimer = type === EntityType.ENEMY_BOSS ? 2000 : 1000 - Math.min(800, s.wave * 50);
          } else if (s.enemiesToSpawn.length === 0 && !s.entities.some(e => e.type.startsWith('ENEMY'))) {
              s.waveInProgress = false;
              s.wave++;
              s.energy += (50 + s.wave * 10) * (1 + (s.globalUpgrades.economyLevel - 1) * TECH_STATS[EntityType.TECH_ECONOMY].effectPerLevel); // Eco bonus applied here too
              s.prepTimer = 5000; 
              syncUi();
          }
      }

      // 2. Entity Logic
      const projectilesToAdd: Entity[] = [];
      const particlesToAdd: Entity[] = [];

      s.entities.forEach(entity => {
        // --- Enemy Logic ---
        if (entity.type.startsWith('ENEMY')) {
          // Apply Slow Effect
          if (entity.freezeTimer && entity.freezeTimer > 0) {
             entity.freezeTimer -= dt;
             const slow = entity.freezeStrength || 0;
             entity.speed = (entity.baseSpeed || 1) * (1 - slow);
          } else {
             entity.speed = entity.baseSpeed || 1;
          }

          const base = s.entities.find(e => e.type === EntityType.BASE);
          if (base) {
            const dir = normalize({ x: base.pos.x - entity.pos.x, y: base.pos.y - entity.pos.y });
            let avoid = {x:0, y:0};
            s.entities.forEach(other => {
              if (other !== entity && other.type.startsWith('ENEMY')) {
                 const d = distance(entity.pos, other.pos);
                 if (d < entity.size + other.size) {
                   avoid.x += (entity.pos.x - other.pos.x);
                   avoid.y += (entity.pos.y - other.pos.y);
                 }
              }
            });
            const avoidDir = normalize(avoid);
            
            // Ranged AI Logic
            if (entity.type === EntityType.ENEMY_RANGED) {
                const range = entity.range || 100; // Correct default used here
                // Find closest structure
                const targets = s.entities.filter(t => 
                    (t.type === EntityType.BASE || t.type === EntityType.WALL || t.type.startsWith('TOWER'))
                );
                let closestTarget: Entity | null = null;
                let minDst = Infinity;
                
                targets.forEach(t => {
                    const d = distance(entity.pos, t.pos);
                    if (d < minDst) {
                        minDst = d;
                        closestTarget = t;
                    }
                });

                if (closestTarget && minDst <= range) {
                    // Stop and Shoot
                    entity.rotation = Math.atan2(closestTarget.pos.y - entity.pos.y, closestTarget.pos.x - entity.pos.x);
                    
                    if ((entity.lastFired || 0) + 2000 < performance.now()) {
                         projectilesToAdd.push({
                            id: `eproj-${Math.random()}`,
                            type: EntityType.PROJECTILE,
                            pos: { ...entity.pos },
                            velocity: normalize({ x: closestTarget.pos.x - entity.pos.x, y: closestTarget.pos.y - entity.pos.y }),
                            speed: 4,
                            damage: entity.damage || 10,
                            size: 4,
                            color: COLORS.NEON_ORANGE,
                            hp: 1,
                            maxHp: 1,
                            rotation: entity.rotation,
                            isEnemyProjectile: true
                         });
                         entity.lastFired = performance.now();
                    }
                } else {
                    // Move closer
                    entity.pos.x += (dir.x + avoidDir.x * 0.5) * (entity.speed || 1);
                    entity.pos.y += (dir.y + avoidDir.y * 0.5) * (entity.speed || 1);
                    entity.rotation = Math.atan2(dir.y, dir.x);
                }

            } else {
                // Melee Logic
                entity.pos.x += (dir.x + avoidDir.x * 0.5) * (entity.speed || 1);
                entity.pos.y += (dir.y + avoidDir.y * 0.5) * (entity.speed || 1);
                entity.rotation = Math.atan2(dir.y, dir.x);

                const targets = s.entities.filter(t => 
                  (t.type === EntityType.BASE || t.type === EntityType.WALL || t.type.startsWith('TOWER')) && 
                  distance(entity.pos, t.pos) < (entity.size + t.size + 5)
                );
                
                targets.sort((a, b) => {
                    if (a.type === EntityType.WALL) return -1;
                    if (b.type === EntityType.WALL) return 1;
                    if (a.type === EntityType.BASE) return -1;
                    if (b.type === EntityType.BASE) return 1;
                    return 0;
                });

                const target = targets[0];

                if (target) {
                  entity.pos.x -= dir.x * (entity.speed || 1); 
                  entity.pos.y -= dir.y * (entity.speed || 1);
                  
                  if ((entity.lastFired || 0) + 1000 < performance.now()) {
                    target.hp -= (entity.damage || 10);
                    entity.lastFired = performance.now();
                    createParticle(particlesToAdd, target.pos, '#ff0000', 5);
                    
                    if (target.type === EntityType.BASE) {
                      s.baseHp = target.hp;
                      syncUi();
                      if (s.baseHp <= 0) endGame();
                    }
                    
                    if (target.hp <= 0) {
                        target.remove = true;
                        if (target.type === EntityType.WALL) {
                            // Check for mounted towers (Sniper or Bomb)
                            const mounted = s.entities.find(e => 
                                (e.type === EntityType.TOWER_SNIPER || e.type === EntityType.TOWER_BOMB) && 
                                !e.remove &&
                                distance(e.pos, target.pos) < 5
                            );
                            if (mounted) {
                                mounted.hp = Math.floor(mounted.hp * 0.8);
                                createParticle(particlesToAdd, mounted.pos, COLORS.NEON_RED, 10);
                            }
                        }
                    }
                  }
                }
            }
            
            // Check for Traps (Applies to all enemies)
            const trapped = s.entities.find(t => t.type === EntityType.ITEM_TRAP && !t.remove && distance(t.pos, entity.pos) < (t.size + entity.size));
            if (trapped) {
                trapped.remove = true;
                createParticle(particlesToAdd, trapped.pos, COLORS.NEON_RED, 20);
                // Trap Explosion
                const enemies = s.entities.filter(e => e.type.startsWith('ENEMY') && !e.remove);
                enemies.forEach(e => {
                   if (distance(e.pos, trapped.pos) < (trapped.blastRadius || 50) + e.size) {
                       e.hp -= (trapped.damage || 500);
                       handleEnemyDeath(e, s);
                   }
                });
            }
          }
        }

        // --- Tower Logic ---
        if (entity.type.startsWith('TOWER')) {
          if (!entity.lastFired) entity.lastFired = 0;
          const range = entity.range || 200;
          const cooldown = entity.cooldown || 1000;
          const damage = entity.damage || 10;

          // Reloading Logic
          if (entity.isReloading) {
              entity.reloadTimer = (entity.reloadTimer || 0) + dt;
              if (entity.reloadTimer >= (entity.reloadTime || 2000)) {
                  entity.currentAmmo = entity.maxAmmo;
                  entity.isReloading = false;
                  entity.reloadTimer = 0;
              }
          } else if (entity.currentAmmo === 0 && entity.maxAmmo && entity.maxAmmo > 0) {
              // Trigger reload if out of ammo (fail safe)
              entity.isReloading = true;
              entity.reloadTimer = 0;
          }

          // Can only fire if not reloading and cooldown met
          if (!entity.isReloading && performance.now() - entity.lastFired > cooldown) {
             
             // Find targets in range
             const targets = s.entities
               .filter(e => e.type.startsWith('ENEMY'))
               .filter(e => distance(e.pos, entity.pos) <= range);
             
             if (targets.length > 0) {
               // Check ammo
               if (entity.currentAmmo !== undefined && entity.currentAmmo > 0) {
                   
                   // Target Priority Logic
                   targets.sort((a, b) => {
                       const distA = distance(a.pos, entity.pos);
                       const distB = distance(b.pos, entity.pos);
                       switch (entity.priority) {
                           case TargetPriority.FURTHEST: return distB - distA;
                           case TargetPriority.WEAKEST: return (a.hp - b.hp) || (distA - distB);
                           case TargetPriority.STRONGEST: return (b.hp - a.hp) || (distA - distB);
                           case TargetPriority.CLOSEST: default: return distA - distB;
                       }
                   });

                   const target = targets[0];
                   
                   entity.rotation = Math.atan2(target.pos.y - entity.pos.y, target.pos.x - entity.pos.x);
                   entity.lastFired = performance.now();
                   
                   // Consume Ammo
                   entity.currentAmmo--;
                   if (entity.currentAmmo <= 0) {
                       entity.isReloading = true;
                       entity.reloadTimer = 0;
                   }

                   // Fire
                   if (entity.type === EntityType.TOWER_TESLA) {
                      createLightning(particlesToAdd, entity.pos, target.pos);
                      target.hp -= damage;
                      handleEnemyDeath(target, s);

                      let currentSource = target;
                      let hitIds = new Set<string>([target.id]);
                      const chainRange = 150;
                      const chainCount = 3;

                      for(let i=0; i<chainCount; i++) {
                          const neighbors = s.entities.filter(e => 
                              e.type.startsWith('ENEMY') && 
                              !hitIds.has(e.id) && 
                              !e.remove &&
                              distance(e.pos, currentSource.pos) < chainRange
                          ).sort((a, b) => distance(a.pos, currentSource.pos) - distance(b.pos, currentSource.pos));

                          if (neighbors.length > 0) {
                              const next = neighbors[0];
                              createLightning(particlesToAdd, currentSource.pos, next.pos);
                              next.hp -= damage; 
                              handleEnemyDeath(next, s);
                              hitIds.add(next.id);
                              currentSource = next;
                          } else {
                              break;
                          }
                      }
                   } else {
                      projectilesToAdd.push({
                        id: `proj-${Math.random()}`,
                        type: EntityType.PROJECTILE,
                        pos: { ...entity.pos },
                        targetId: target.id, 
                        velocity: normalize({ x: target.pos.x - entity.pos.x, y: target.pos.y - entity.pos.y }),
                        speed: entity.type === EntityType.TOWER_BOMB ? 5 : 8,
                        damage: damage,
                        size: entity.type === EntityType.TOWER_BOMB ? 6 : 3,
                        color: entity.color,
                        hp: 1,
                        maxHp: 1,
                        rotation: entity.rotation,
                        blastRadius: entity.blastRadius, // Pass blast radius to projectile
                        freezeStrength: entity.freezeStrength // Pass freeze stats
                      });
                   }
               } else if (entity.currentAmmo !== undefined && entity.currentAmmo <= 0) {
                   entity.isReloading = true;
                   entity.reloadTimer = 0;
               }
             }
          }
        }

        // --- Projectile Logic ---
        if (entity.type === EntityType.PROJECTILE) {
           entity.pos.x += entity.velocity!.x * entity.speed!;
           entity.pos.y += entity.velocity!.y * entity.speed!;
           
           if (entity.isEnemyProjectile) {
               // Check collision with structures
               const hit = s.entities.find(e => 
                   (e.type === EntityType.BASE || e.type === EntityType.WALL || e.type.startsWith('TOWER')) && 
                   !e.remove &&
                   distance(e.pos, entity.pos) < (e.size + entity.size)
               );
               if (hit) {
                   hit.hp -= entity.damage!;
                   createParticle(particlesToAdd, hit.pos, COLORS.NEON_RED, 3);
                   if (hit.type === EntityType.BASE) {
                       s.baseHp = hit.hp;
                       syncUi();
                       if (s.baseHp <= 0) endGame();
                   }
                   if (hit.hp <= 0) {
                       hit.remove = true;
                       if (hit.type === EntityType.WALL) {
                           const mounted = s.entities.find(m => 
                               (m.type === EntityType.TOWER_SNIPER || m.type === EntityType.TOWER_BOMB) && 
                               !m.remove &&
                               distance(m.pos, hit.pos) < 5
                           );
                           if (mounted) mounted.hp = Math.floor(mounted.hp * 0.8);
                       }
                   }
                   entity.remove = true;
               }

           } else {
               // Friendly Projectile
               const hit = s.entities.find(e => e.type.startsWith('ENEMY') && distance(e.pos, entity.pos) < (e.size + entity.size));
               if (hit) {
                 
                 if (entity.blastRadius) {
                     // Bomb Logic
                     createParticle(particlesToAdd, entity.pos, COLORS.NEON_ORANGE, 15);
                     const enemies = s.entities.filter(e => e.type.startsWith('ENEMY') && !e.remove);
                     enemies.forEach(e => {
                         if (distance(e.pos, entity.pos) < entity.blastRadius! + e.size) {
                             e.hp -= entity.damage!;
                             handleEnemyDeath(e, s);
                         }
                     });
                 } else {
                     // Normal Logic
                     hit.hp -= entity.damage!;
                     if (entity.freezeStrength) {
                         hit.freezeTimer = 2000; // 2s freeze
                         hit.freezeStrength = entity.freezeStrength;
                     }
                     createParticle(particlesToAdd, hit.pos, entity.color, 3);
                     handleEnemyDeath(hit, s);
                 }
    
                 entity.remove = true;
               }
           }
           
           if (entity.pos.x < 0 || entity.pos.x > canvas.width || entity.pos.y < 0 || entity.pos.y > canvas.height) {
             entity.remove = true;
           }
        }
        
        if (entity.type === EntityType.PARTICLE) {
            entity.hp -= 0.05; 
            if (entity.hp <= 0) entity.remove = true;
        }
        if (entity.type === EntityType.LIGHTNING) {
            entity.hp -= 0.15; 
            if (entity.hp <= 0) entity.remove = true;
        }
      });

      s.entities = s.entities.filter(e => !e.remove);
      s.entities.push(...projectilesToAdd, ...particlesToAdd);
    };

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#050505'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#1a1a2e';
      
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += GRID_SIZE) { 
          ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); 
      }
      for (let y = 0; y < canvas.height; y += GRID_SIZE) { 
          ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); 
      }
      ctx.stroke();
      
      ctx.fillStyle = '#262642';
      for (let x = 0; x < canvas.width; x += GRID_SIZE) {
          for (let y = 0; y < canvas.height; y += GRID_SIZE) {
              ctx.fillRect(x - 1, y - 1, 2, 2);
          }
      }

      const sortedEntities = [...state.current.entities].sort((a, b) => {
          if (a.type === EntityType.WALL && b.type.startsWith('TOWER')) return -1;
          if (a.type.startsWith('TOWER') && b.type === EntityType.WALL) return 1;
          if (a.type === EntityType.ITEM_TRAP) return -1;
          return 0;
      });

      sortedEntities.forEach(e => {
        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);
        ctx.rotate(e.rotation);

        ctx.shadowBlur = 10;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        ctx.strokeStyle = e.color;

        switch (e.type) {
          case EntityType.BASE:
            ctx.fillStyle = COLORS.NEON_BLUE;
            ctx.fillRect(-e.size/2, -e.size/2, e.size, e.size);
            ctx.strokeRect(-e.size/2 - 4, -e.size/2 - 4, e.size + 8, e.size + 8);
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0,0, e.size/4, 0, Math.PI*2); ctx.fill();
            break;
          case EntityType.WALL:
            ctx.strokeRect(-e.size, -e.size, e.size*2, e.size*2);
            ctx.fillStyle = `${e.color}33`; 
            ctx.fillRect(-e.size, -e.size, e.size*2, e.size*2);
            ctx.beginPath(); 
            ctx.moveTo(-e.size, -e.size); ctx.lineTo(e.size, e.size);
            ctx.moveTo(e.size, -e.size); ctx.lineTo(-e.size, e.size);
            ctx.strokeStyle = `${e.color}66`;
            ctx.stroke();
            break;
          case EntityType.TOWER_BASIC:
          case EntityType.TOWER_SNIPER:
          case EntityType.TOWER_RAPID:
          case EntityType.TOWER_BOMB:
          case EntityType.TOWER_ICE:
            if (e.type === EntityType.TOWER_SNIPER || e.type === EntityType.TOWER_BOMB) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(-e.size+2, -e.size+2, (e.size*2)-4, (e.size*2)-4);
            }
            ctx.strokeRect(-e.size, -e.size, e.size*2, e.size*2);
            const barrelLen = e.type === EntityType.TOWER_SNIPER ? e.size * 2 : e.size * 1.2;
            const barrelW = e.type === EntityType.TOWER_BOMB ? 8 : e.type === EntityType.TOWER_SNIPER ? 2 : 4;
            
            ctx.lineWidth = barrelW;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(barrelLen, 0); ctx.stroke();
            
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(0,0, 4, 0, Math.PI*2); ctx.fill();
            
            if (e.type === EntityType.TOWER_ICE) {
                ctx.fillStyle = COLORS.NEON_ICE;
                ctx.beginPath(); ctx.arc(0,0, 2, 0, Math.PI*2); ctx.fill();
            }
            break;
          case EntityType.TOWER_TESLA:
             ctx.strokeRect(-e.size, -e.size, e.size*2, e.size*2);
             ctx.beginPath(); ctx.arc(0,0, e.size/1.5, 0, Math.PI*2); ctx.stroke();
             ctx.fillStyle = '#fff';
             ctx.beginPath(); ctx.arc(0,0, 4, 0, Math.PI*2); ctx.fill();
             break;
          case EntityType.ITEM_TRAP:
             ctx.beginPath(); ctx.arc(0, 0, e.size, 0, Math.PI*2); ctx.strokeStyle = COLORS.NEON_RED; ctx.stroke();
             ctx.beginPath(); ctx.arc(0, 0, e.size/2, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,0,0,0.3)'; ctx.fill();
             break;
          case EntityType.ENEMY_ZOMBIE:
          case EntityType.ENEMY_TANK:
          case EntityType.ENEMY_BOSS:
          case EntityType.ENEMY_RANGED:
            // Freeze effect visual
            if (e.freezeTimer && e.freezeTimer > 0) {
                ctx.shadowColor = COLORS.NEON_ICE;
                ctx.strokeStyle = COLORS.NEON_ICE;
            }
            if (e.type === EntityType.ENEMY_ZOMBIE) {
                ctx.beginPath();
                ctx.arc(0, -8, 4, 0, Math.PI*2); 
                ctx.moveTo(0, -4); ctx.lineTo(0, 6); 
                ctx.moveTo(0, 0); ctx.lineTo(-6, 4); 
                ctx.moveTo(0, 0); ctx.lineTo(6, 4);
                ctx.moveTo(0, 6); ctx.lineTo(-4, 12); 
                ctx.moveTo(0, 6); ctx.lineTo(4, 12);
                ctx.stroke();
            } else if (e.type === EntityType.ENEMY_TANK) {
                ctx.fillRect(-12, -12, 24, 24);
                ctx.strokeStyle = e.freezeTimer && e.freezeTimer > 0 ? COLORS.NEON_ICE : '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(-12, -12, 24, 24);
            } else if (e.type === EntityType.ENEMY_RANGED) {
                ctx.beginPath();
                ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0); ctx.closePath();
                ctx.stroke();
            } else { // Boss
                ctx.lineWidth = 3;
                ctx.strokeRect(-20, -30, 40, 50);
                ctx.strokeRect(-35, -35, 15, 20);
                ctx.strokeRect(20, -35, 15, 20);
                ctx.strokeRect(-10, -50, 20, 20);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-5, -45, 10, 4);
            }
            break;
          case EntityType.PROJECTILE:
            ctx.beginPath(); ctx.arc(0, 0, e.size, 0, Math.PI*2); ctx.fill();
            break;
          case EntityType.PARTICLE:
            ctx.globalAlpha = e.hp; 
            if (e.color === COLORS.NEON_GREEN) {
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -3); ctx.lineTo(0, 3);
                ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
                ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(0, 0, Math.random() * 5, 0, Math.PI*2); ctx.fill();
            }
            ctx.globalAlpha = 1;
            break;
          case EntityType.LIGHTNING:
            if (e.targetPos) {
                const tx = e.targetPos.x - e.pos.x;
                const ty = e.targetPos.y - e.pos.y;
                const d = Math.hypot(tx, ty);
                const segments = Math.max(3, Math.floor(d / 20));
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                for(let i=1; i<segments; i++) {
                    const t = i / segments;
                    const jitter = (Math.random() - 0.5) * 30;
                    const nx = -ty / d;
                    const ny = tx / d;
                    ctx.lineTo(tx * t + nx * jitter, ty * t + ny * jitter);
                }
                ctx.lineTo(tx, ty);
                ctx.shadowBlur = 15;
                ctx.shadowColor = COLORS.NEON_PURPLE;
                ctx.strokeStyle = `rgba(188, 19, 254, ${e.hp})`; 
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = `rgba(255, 255, 255, ${e.hp})`;
                ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI*2); ctx.fill();
            }
            break;
        }
        
        ctx.rotate(-e.rotation); // Undo rotation for bars

        // Draw Health Bars
        if (e.hp < e.maxHp && e.type !== EntityType.PROJECTILE && e.type !== EntityType.PARTICLE && e.type !== EntityType.LIGHTNING) {
           const w = e.size * 2;
           const barY = -e.size - 8;
           ctx.fillStyle = '#555';
           ctx.fillRect(-w/2, barY, w, 3);
           const pct = e.hp / e.maxHp;
           ctx.fillStyle = pct > 0.5 ? '#00ff00' : pct > 0.25 ? '#ffff00' : '#ff0000';
           ctx.fillRect(-w/2, barY, w * pct, 3);
        }

        // Draw Reload Bar
        if (e.type.startsWith('TOWER') && e.isReloading && e.reloadTime) {
            const w = e.size * 2;
            const barY = -e.size - 14;
            ctx.fillStyle = '#333';
            ctx.fillRect(-w/2, barY, w, 2);
            const reloadPct = (e.reloadTimer || 0) / e.reloadTime;
            ctx.fillStyle = COLORS.NEON_BLUE;
            ctx.fillRect(-w/2, barY, w * reloadPct, 2);
            
            // Optional text
            ctx.font = '8px monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('RELOAD', 0, barY - 2);
        }

        ctx.restore();
      });
      
      // Draw Range Indicator for Selected Entity
      if (infoCard && infoCard.entity && infoCard.entity.range) {
          const ent = infoCard.entity;
          ctx.save();
          ctx.translate(ent.pos.x, ent.pos.y);
          ctx.beginPath();
          ctx.arc(0, 0, ent.range, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([8, 6]);
          ctx.stroke();
          ctx.restore();
      }

      // Draw Build Preview
      if (buildMode && mousePos) {
          if (buildMode === EntityType.ITEM_REPAIR) {
              ctx.save();
              ctx.translate(mousePos.x, mousePos.y);
              const hovered = state.current.entities.filter(e => 
                  (e.type === EntityType.BASE || e.type === EntityType.WALL || e.type.startsWith('TOWER')) &&
                  Math.abs(e.pos.x - mousePos.x) < e.size + 10 && 
                  Math.abs(e.pos.y - mousePos.y) < e.size + 10
              );
              const canRepair = hovered.some(h => h.hp < h.maxHp);
              ctx.beginPath();
              ctx.arc(0, 0, 20, 0, Math.PI * 2);
              ctx.fillStyle = canRepair ? 'rgba(10, 255, 10, 0.2)' : 'rgba(100, 100, 100, 0.2)';
              ctx.fill();
              ctx.strokeStyle = canRepair ? COLORS.NEON_GREEN : '#666';
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.restore();
          } else {
              const snapX = Math.floor(mousePos.x / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2;
              const snapY = Math.floor(mousePos.y / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2;
              
              ctx.save();
              ctx.translate(snapX, snapY);
              const range = (TOWER_STATS[buildMode as keyof typeof TOWER_STATS] as any)?.range;
              if (range) {
                  ctx.beginPath();
                  ctx.arc(0, 0, range, 0, Math.PI * 2);
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                  ctx.fill();
                  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                  ctx.lineWidth = 1;
                  ctx.setLineDash([5, 5]);
                  ctx.stroke();
              }
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#fff';
              ctx.strokeStyle = '#fff';
              ctx.setLineDash([]);
              const size = GRID_SIZE/2 - 2;
              ctx.strokeRect(-size, -size, size*2, size*2);
              
              // Visual indicator if over limit
              const isTower = buildMode.startsWith('TOWER');
              if (isTower) {
                  const towerCount = state.current.entities.filter(e => e.type.startsWith('TOWER')).length;
                  const maxTowers = getMaxTowerCount(state.current.wave);
                  if (towerCount >= maxTowers) {
                      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                      ctx.fillRect(-size, -size, size*2, size*2);
                      ctx.font = '10px monospace';
                      ctx.fillStyle = '#fff';
                      ctx.fillText('MAX', -8, 4);
                  }
              }

              ctx.restore();
          }
      }
    };

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      update(dt);
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [buildMode, mousePos]); 

  const spawnEnemy = (type: EntityType, w: number, h: number) => {
    let x, y;
    if (Math.random() < 0.5) {
       x = Math.random() < 0.5 ? -50 : w + 50;
       y = Math.random() * h;
    } else {
       x = Math.random() * w;
       y = Math.random() < 0.5 ? -50 : h + 50;
    }
    
    const currentWave = state.current.wave;
    // 1.5x stats every 5 waves
    const tier = Math.floor((currentWave - 1) / 5);
    const multiplier = Math.pow(1.5, tier);
    
    const stats = ENEMY_STATS[type as keyof typeof ENEMY_STATS];
    const baseHp = stats?.hp || 100;
    const baseDmg = stats?.damage || 10;
    const baseSpeed = stats?.speed || 1;

    state.current.entities.push({
      id: `enemy-${Date.now()}-${Math.random()}`,
      type,
      pos: { x, y },
      size: stats?.size || 12,
      color: stats?.color || '#fff',
      hp: Math.floor(baseHp * multiplier),
      maxHp: Math.floor(baseHp * multiplier),
      speed: baseSpeed,
      baseSpeed: baseSpeed,
      damage: Math.floor(baseDmg * multiplier),
      rotation: 0,
      range: (stats as any).attackRange, // Set specific attack range if available
    });
  };

  const handleEnemyDeath = (enemy: Entity, s: GameState) => {
      if (enemy.hp <= 0 && !enemy.remove) {
          enemy.remove = true; 
          const score = ENEMY_STATS[enemy.type as keyof typeof ENEMY_STATS]?.score || 10;
          
          // Economy Upgrade Multiplier
          const ecoLevel = s.globalUpgrades.economyLevel || 1;
          const ecoMult = 1 + (ecoLevel - 1) * TECH_STATS[EntityType.TECH_ECONOMY].effectPerLevel;
          
          s.energy += Math.floor(score * ecoMult);
          syncUi();
      }
  };

  const createParticle = (list: Entity[], pos: Vector2, color: string, count: number) => {
      for(let i=0; i<count; i++) {
          list.push({
              id: `p-${Math.random()}`,
              type: EntityType.PARTICLE,
              pos: { ...pos, x: pos.x + (Math.random()-0.5)*10, y: pos.y + (Math.random()-0.5)*10 },
              size: 2,
              color: color,
              hp: 1, 
              maxHp: 1,
              rotation: 0
          });
      }
  };
  
  const createLightning = (list: Entity[], start: Vector2, end: Vector2) => {
      list.push({
         id: `light-${Math.random()}`,
         type: EntityType.LIGHTNING,
         pos: { ...start },
         targetPos: { ...end },
         size: 2,
         color: COLORS.NEON_PURPLE,
         hp: 1,
         maxHp: 1,
         rotation: 0
      });
  };

  const endGame = () => {
    state.current.isGameOver = true;
    syncUi();
  };

  const performSell = () => {
      if (!infoCard) return;
      const { entity } = infoCard;
      
      const index = state.current.entities.findIndex(e => e.id === entity.id);
      if (index !== -1) {
          const ent = state.current.entities[index];
          state.current.entities.splice(index, 1);
          
          const tempParticles: Entity[] = [];
          createParticle(tempParticles, ent.pos, COLORS.NEON_YELLOW, 10);
          state.current.entities.push(...tempParticles);
          
          const totalCost = ent.cost || BUILD_COSTS[ent.type as keyof typeof BUILD_COSTS] || 0;
          state.current.energy += Math.floor(totalCost * REFUND_RATE);
          syncUi();
      }
      setInfoCard(null);
  };
  
  const performUpgrade = () => {
      if (!infoCard) return;
      const { entity } = infoCard;
      const upgradeCost = Math.floor((entity.cost || BUILD_COSTS[entity.type as keyof typeof BUILD_COSTS] || 0));
      
      if (state.current.energy >= upgradeCost) {
          const index = state.current.entities.findIndex(e => e.id === entity.id);
          if (index !== -1) {
              const ent = state.current.entities[index];
              state.current.energy -= upgradeCost;
              
              ent.level = (ent.level || 1) + 1;
              ent.cost = (ent.cost || 0) + upgradeCost; 
              
              ent.maxHp = Math.floor(ent.maxHp * 1.25);
              ent.hp = ent.maxHp; 
              
              if (ent.damage) ent.damage = Math.floor(ent.damage * 1.25);
              if (ent.range) ent.range = Math.floor(ent.range * 1.05);
              if (ent.cooldown) ent.cooldown = Math.max(100, Math.floor(ent.cooldown * 0.95));
              if (ent.maxAmmo) ent.maxAmmo = Math.floor(ent.maxAmmo * 1.2); // Upgrade ammo capacity
              if (ent.reloadTime) ent.reloadTime = Math.max(500, Math.floor(ent.reloadTime * 0.9)); // 10% faster reload
              
              const tempParticles: Entity[] = [];
              createParticle(tempParticles, ent.pos, COLORS.NEON_GREEN, 15);
              state.current.entities.push(...tempParticles);
              
              syncUi();
              setInfoCard({ ...infoCard, entity: { ...ent } });
          }
      }
  };

  const cyclePriority = () => {
      if (!infoCard) return;
      const { entity } = infoCard;
      if (!entity.type.startsWith('TOWER')) return;

      const index = state.current.entities.findIndex(e => e.id === entity.id);
      if (index !== -1) {
          const ent = state.current.entities[index];
          const priorities = [TargetPriority.CLOSEST, TargetPriority.FURTHEST, TargetPriority.WEAKEST, TargetPriority.STRONGEST];
          const currentIdx = priorities.indexOf(ent.priority || TargetPriority.CLOSEST);
          const nextIdx = (currentIdx + 1) % priorities.length;
          ent.priority = priorities[nextIdx];
          setInfoCard({ ...infoCard, entity: { ...ent } });
      }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
      if (state.current.isGameOver) return;
      if (infoCard && infoCardRef.current?.contains(e.target as Node)) return;

      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (buildMode === EntityType.ITEM_REPAIR) {
           const hoveredEntities = state.current.entities.filter(ent => 
              (ent.type === EntityType.BASE || ent.type === EntityType.WALL || ent.type.startsWith('TOWER')) &&
              Math.abs(ent.pos.x - x) < ent.size + 10 && Math.abs(ent.pos.y - y) < ent.size + 10
           );
           let targetToRepair: Entity | null = null;
           let minHpPct = 1.1;
           hoveredEntities.forEach(ent => {
               if (ent.hp < ent.maxHp) {
                   const pct = ent.hp / ent.maxHp;
                   if (pct < minHpPct) {
                       minHpPct = pct;
                       targetToRepair = ent;
                   }
               }
           });
           if (targetToRepair) {
               const cost = BUILD_COSTS[EntityType.ITEM_REPAIR];
               if (state.current.energy >= cost) {
                   const ent = targetToRepair as Entity;
                   state.current.energy -= cost;
                   const repairAmount = Math.floor(ent.maxHp * 0.3) + 50;
                   ent.hp = Math.min(ent.maxHp, ent.hp + repairAmount);
                   const particles: Entity[] = [];
                   createParticle(particles, ent.pos, COLORS.NEON_GREEN, 8);
                   state.current.entities.push(...particles);
                   syncUi();
                   if (ent.type === EntityType.BASE) {
                       state.current.baseHp = ent.hp;
                       syncUi();
                   }
               }
           }
           return; 
      }

      if (buildMode) {
          if (buildMode === EntityType.TECH_ECONOMY || buildMode === EntityType.TECH_DURABILITY) {
              return; 
          }

          // Check Tower Limit (Walls, Trap and Items don't count)
          if (buildMode.startsWith('TOWER')) {
              const currentTowers = state.current.entities.filter(e => e.type.startsWith('TOWER')).length;
              const maxTowers = getMaxTowerCount(state.current.wave);
              if (currentTowers >= maxTowers) return;
          }

          const cost = BUILD_COSTS[buildMode];
          if (state.current.energy >= cost) {
              const snapX = Math.floor(x / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2;
              const snapY = Math.floor(mousePos.y / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2;
              const existingAtPos = state.current.entities.filter(ent => 
                  Math.abs(ent.pos.x - snapX) < 5 && Math.abs(ent.pos.y - snapY) < 5
              );

              const hasWall = existingAtPos.some(e => e.type === EntityType.WALL);
              const hasTower = existingAtPos.some(e => e.type.startsWith('TOWER'));
              const isBase = existingAtPos.some(e => e.type === EntityType.BASE);

              let canBuild = false;
              
              // Trap Logic (can be placed anywhere walkable except base/walls/towers? actually traps usually go on floor)
              if (buildMode === EntityType.ITEM_TRAP) {
                  if (!isBase && !hasWall && !hasTower) canBuild = true;
              } else if (buildMode === EntityType.TOWER_SNIPER || buildMode === EntityType.TOWER_BOMB) {
                  if (isBase) canBuild = false;
                  else if (hasTower) canBuild = false;
                  else if (hasWall) canBuild = true; // Allow on wall
                  else canBuild = true; 
              } else {
                  if (!hasWall && !hasTower && !isBase) canBuild = true;
              }

              if (canBuild) {
                  state.current.energy -= cost;
                  const baseStats = TOWER_STATS[buildMode as keyof typeof TOWER_STATS] as any;
                  
                  state.current.entities.push({
                      id: `bld-${Date.now()}`,
                      type: buildMode,
                      pos: { x: snapX, y: snapY },
                      size: buildMode === EntityType.ITEM_TRAP ? GRID_SIZE/3 : GRID_SIZE / 2 - 4,
                      color: baseStats?.color || '#fff',
                      hp: baseStats?.hp || 50,
                      maxHp: baseStats?.hp || 50,
                      rotation: 0,
                      level: 1,
                      cost: cost,
                      damage: baseStats.damage,
                      range: baseStats.range,
                      cooldown: baseStats.cooldown,
                      priority: TargetPriority.CLOSEST,
                      // Init Ammo
                      maxAmmo: baseStats.maxAmmo,
                      currentAmmo: baseStats.maxAmmo,
                      reloadTime: baseStats.reloadTime,
                      isReloading: false,
                      reloadTimer: 0,
                      // Special
                      blastRadius: baseStats.blastRadius,
                      freezeStrength: baseStats.freezeStrength
                  });
                  syncUi();
              }
          }
          return; 
      }

      const entitiesAtClick = state.current.entities.filter(ent => {
          if (ent.type === EntityType.BASE) return false; 
          if (ent.type === EntityType.WALL || ent.type.startsWith('TOWER') || ent.type === EntityType.ITEM_TRAP) {
              const hitSize = ent.size + 5;
              return Math.abs(ent.pos.x - x) < hitSize && Math.abs(ent.pos.y - y) < hitSize;
          }
          return false;
      });

      if (entitiesAtClick.length > 0) {
          entitiesAtClick.sort((a, b) => {
              if (a.type.startsWith('TOWER')) return -1;
              if (b.type.startsWith('TOWER')) return 1;
              return 0;
          });
          const clickedEntity = entitiesAtClick[0];
          setInfoCard({
              entity: clickedEntity,
              x: clickedEntity.pos.x,
              y: clickedEntity.pos.y
          });
      } else {
          setInfoCard(null);
      }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      if (buildMode) setBuildMode(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
  };

  const handleTechPurchase = (type: EntityType) => {
      const s = state.current;
      if (type === EntityType.TECH_ECONOMY) {
           const level = s.globalUpgrades.economyLevel;
           const cost = Math.floor(BUILD_COSTS[EntityType.TECH_ECONOMY] * Math.pow(TECH_STATS[EntityType.TECH_ECONOMY].costScale, level - 1));
           if (s.energy >= cost) {
               s.energy -= cost;
               s.globalUpgrades.economyLevel++;
               syncUi();
           }
      } else if (type === EntityType.TECH_DURABILITY) {
           const level = s.globalUpgrades.durabilityLevel;
           const cost = Math.floor(BUILD_COSTS[EntityType.TECH_DURABILITY] * Math.pow(TECH_STATS[EntityType.TECH_DURABILITY].costScale, level - 1));
           if (s.energy >= cost) {
               s.energy -= cost;
               s.globalUpgrades.durabilityLevel++;
               
               // Apply Max HP buff immediately
               const oldMax = s.maxBaseHp;
               s.maxBaseHp = Math.floor(INITIAL_BASE_HP * (1 + (s.globalUpgrades.durabilityLevel - 1) * TECH_STATS[EntityType.TECH_DURABILITY].effectPerLevel));
               s.baseHp += (s.maxBaseHp - oldMax); // Heal the difference
               
               // Find base and update it too
               const base = s.entities.find(e => e.type === EntityType.BASE);
               if (base) {
                   base.maxHp = s.maxBaseHp;
                   base.hp = s.baseHp;
               }

               syncUi();
           }
      }
  };

  const renderInfoCard = () => {
      if (!infoCard) return null;
      const { entity, x, y } = infoCard;
      const cost = entity.cost || BUILD_COSTS[entity.type as keyof typeof BUILD_COSTS] || 0;
      const refund = Math.floor(cost * REFUND_RATE);
      const upgradeCost = Math.floor(cost);
      const isWall = entity.type === EntityType.WALL;
      const isTower = entity.type.startsWith('TOWER');
      
      let left = x + 30;
      let top = y - 50;
      if (left > window.innerWidth - 200) left = x - 220;
      if (top < 10) top = y + 30;

      const nextDmg = entity.damage ? Math.floor(entity.damage * 1.25) : 0;
      const nextRange = entity.range ? Math.floor(entity.range * 1.05) : 0;
      const nextHp = Math.floor(entity.maxHp * 1.25);
      const nextAmmo = entity.maxAmmo ? Math.floor(entity.maxAmmo * 1.2) : 0;
      const currentReload = (entity.reloadTime || 0) / 1000;
      const nextReload = entity.reloadTime ? (Math.max(500, Math.floor(entity.reloadTime * 0.9)) / 1000) : 0;
      
      const getPriorityIcon = () => {
          switch(entity.priority) {
              case TargetPriority.FURTHEST: return <Signal className="w-3 h-3" />;
              case TargetPriority.WEAKEST: return <HeartCrack className="w-3 h-3" />;
              case TargetPriority.STRONGEST: return <Activity className="w-3 h-3" />;
              case TargetPriority.CLOSEST: default: return <Crosshair className="w-3 h-3" />;
          }
      };

      return (
          <div 
            ref={infoCardRef}
            className="absolute z-40 bg-gray-900/95 border border-cyan-500 rounded-lg shadow-[0_0_20px_rgba(0,243,255,0.3)] p-3 flex flex-col gap-2 w-64 backdrop-blur-md pointer-events-auto animate-in fade-in zoom-in-95 duration-200 cursor-default"
            style={{ left, top }}
          >
              <div className="text-sm text-cyan-300 font-bold uppercase border-b border-gray-700 pb-1 mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <span>{entity.type.replace(/TOWER_|ITEM_/, '').replace('WALL', 'BARRIER')}</span>
                     <span className="text-xs text-yellow-400 font-mono bg-yellow-900/30 px-1 rounded">LVL {entity.level || 1}</span>
                  </div>
                  <button onClick={() => setInfoCard(null)} className="text-gray-400 hover:text-white hover:bg-red-900/50 rounded transition-colors">
                    <X size={14} />
                  </button>
              </div>
              
              <div className="space-y-1 text-xs font-mono text-gray-300 group-hover:text-gray-100">
                  <div className="flex justify-between items-center">
                      <span>Health:</span>
                      <div className="text-right flex items-center gap-1">
                         <span className={entity.hp < entity.maxHp ? 'text-red-400' : 'text-green-400'}>
                            {Math.ceil(entity.hp)}/{entity.maxHp}
                         </span>
                         <span className="text-gray-500"><ArrowRight size={10} /></span>
                         <span className="text-green-600/80">{nextHp}</span>
                      </div>
                  </div>
                  {!isWall && entity.type !== EntityType.ITEM_TRAP && (
                      <>
                        <div className="flex justify-between items-center">
                            <span>Damage:</span>
                            <div className="text-right flex items-center gap-1">
                                <span className="text-white">{entity.damage}</span>
                                <span className="text-gray-500"><ArrowRight size={10} /></span>
                                <span className="text-green-600/80">{nextDmg}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Range:</span>
                            <div className="text-right flex items-center gap-1">
                                <span className="text-white">{entity.range}</span>
                                <span className="text-gray-500"><ArrowRight size={10} /></span>
                                <span className="text-green-600/80">{nextRange}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Ammo:</span>
                            <div className="text-right flex items-center gap-1">
                                <span className={`${(entity.currentAmmo || 0) < 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                    {entity.currentAmmo}/{entity.maxAmmo}
                                </span>
                                <span className="text-gray-500"><ArrowRight size={10} /></span>
                                <span className="text-green-600/80">{nextAmmo}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Reload:</span>
                            <div className="text-right flex items-center gap-1">
                                <span className="text-white">{currentReload.toFixed(1)}s</span>
                                <span className="text-gray-500"><ArrowRight size={10} /></span>
                                <span className="text-green-600/80">{nextReload.toFixed(1)}s</span>
                            </div>
                        </div>
                      </>
                  )}
              </div>
              
              {isTower && (
                  <button 
                    onClick={cyclePriority}
                    className="mt-1 flex items-center justify-between px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 text-xs text-gray-300 transition-colors"
                  >
                      <span className="flex items-center gap-1 text-[10px]">
                          TARGETING:
                      </span>
                      <span className="flex items-center gap-1 text-cyan-300 font-bold">
                          {getPriorityIcon()}
                          {entity.priority || 'CLOSEST'}
                      </span>
                  </button>
              )}

              <button 
                  onClick={performUpgrade}
                  disabled={state.current.energy < upgradeCost}
                  className="group/upg mt-2 flex items-center justify-between px-3 py-2 bg-cyan-900/30 hover:bg-cyan-800/60 text-cyan-200 rounded border border-cyan-900/50 hover:border-cyan-400 transition-all text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <span className="flex items-center gap-2"><ArrowUpCircle className="w-3 h-3" /> UPGRADE</span>
                  <span className="text-yellow-400 font-mono">-{upgradeCost}</span>
              </button>

              <button 
                  onClick={performSell}
                  className="flex items-center justify-between px-3 py-2 bg-red-900/30 hover:bg-red-900/60 text-red-200 rounded border border-red-900/50 hover:border-red-500 transition-all text-xs font-bold group cursor-pointer"
              >
                  <span className="flex items-center gap-2"><Trash2 className="w-3 h-3" /> Dismantle</span>
                  <span className="text-yellow-400 font-mono">+{refund}</span>
              </button>
          </div>
      );
  };

  return (
    <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden cursor-crosshair"
        onMouseMove={handleMouseMove}
        onContextMenu={handleContextMenu}
    >
      <HUD 
        baseHp={uiState.baseHp} 
        maxBaseHp={state.current.maxBaseHp} 
        energy={uiState.energy} 
        wave={uiState.wave} 
        waveInProgress={uiState.waveInProgress}
        prepTimer={uiState.prepTimer}
        towerCount={uiState.towerCount}
        maxTowerCount={uiState.maxTowerCount}
      />
      
      {uiState.isGameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-red-500 mb-4 neon-text">GAME OVER</h1>
            <p className="text-white text-xl mb-8">Waves Survived: {uiState.wave - 1}</p>
            <button 
               onClick={() => window.location.reload()}
               className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow-[0_0_15px_#06b6d4] transition-all"
            >
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      )}
      
      {renderInfoCard()}

      <canvas 
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="block w-full h-full bg-[#050505]"
      />

      <BuildMenu 
        selectedType={buildMode} 
        onSelect={(t) => { 
            if (t === EntityType.TECH_ECONOMY || t === EntityType.TECH_DURABILITY) {
                handleTechPurchase(t);
            } else {
                setBuildMode(t); 
                setInfoCard(null); 
            }
        }} 
        energy={uiState.energy}
        globalUpgrades={uiState.globalUpgrades}
        towerCount={state.current.entities.filter(e => e.type.startsWith('TOWER')).length}
        maxTowerCount={uiState.maxTowerCount}
      />
    </div>
  );
};
