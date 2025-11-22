
import React, { useState } from 'react';
import { EntityType } from '../types';
import { BUILD_COSTS, TECH_STATS, TOWER_STATS } from '../constants';
import { Box, Zap, Crosshair, Shield, Hexagon, ChevronDown, ChevronUp, Wrench, TrendingUp, ShieldPlus, ArrowRight, Timer, Disc, Bomb, Snowflake, Target, Cast } from 'lucide-react';

interface BuildMenuProps {
  selectedType: EntityType | null;
  onSelect: (type: EntityType | null) => void;
  energy: number;
  globalUpgrades: { economyLevel: number; durabilityLevel: number };
  towerCount: number;
  maxTowerCount: number;
}

const BuildItem: React.FC<{
  type: EntityType;
  icon: React.ReactNode;
  label: string;
  cost: number;
  selected: boolean;
  canAfford: boolean;
  category?: 'structure' | 'item' | 'tech';
  level?: number; // For tech
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}> = ({ icon, label, cost, selected, canAfford, category = 'structure', level, onClick, onMouseEnter, onMouseLeave }) => {
  
  let colors = {
      border: 'border-cyan-400',
      bg: 'bg-cyan-900/60',
      shadow: 'shadow-[0_0_15px_#22d3ee]',
      text: 'text-cyan-600',
      hoverText: 'group-hover:text-cyan-400',
      selText: 'text-cyan-300',
      accent: 'text-cyan-500'
  };

  if (category === 'item') {
      colors = {
          border: 'border-green-400',
          bg: 'bg-green-900/60',
          shadow: 'shadow-[0_0_15px_#4ade80]',
          text: 'text-green-600',
          hoverText: 'group-hover:text-green-400',
          selText: 'text-green-300',
          accent: 'text-green-500'
      };
  } else if (category === 'tech') {
      colors = {
          border: 'border-purple-400',
          bg: 'bg-purple-900/60',
          shadow: 'shadow-[0_0_15px_#a855f7]',
          text: 'text-purple-600',
          hoverText: 'group-hover:text-purple-400',
          selText: 'text-purple-300',
          accent: 'text-purple-500'
      };
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        relative group flex flex-col items-center justify-center w-14 h-14 border-2 transition-all duration-200
        ${selected 
          ? `${colors.border} ${colors.bg} ${colors.shadow} scale-105 -translate-y-1` 
          : 'border-gray-700 bg-gray-900/80 hover:bg-gray-800'
        }
        ${!canAfford && !selected ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
        ${!selected ? `hover:${colors.border.replace('border-', 'border-')}` : ''}
      `}
    >
      <div className={`mb-1 transition-colors ${selected ? colors.selText : `${colors.text} ${colors.hoverText}`}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-widest leading-none mb-1 ${selected ? 'text-white' : 'text-gray-400'}`}>{label}</span>
      <span className="text-[10px] font-mono text-yellow-400 drop-shadow-md leading-none">{cost}</span>
      
      {/* Tech Level Badge */}
      {category === 'tech' && level && (
          <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[8px] font-bold px-1 rounded-full border border-purple-300">
              L{level}
          </div>
      )}
      
      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-1 h-1 border-t border-l border-current ${colors.accent}`} />
      <div className={`absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current ${colors.accent}`} />
    </button>
  );
};

export const BuildMenu: React.FC<BuildMenuProps> = ({ selectedType, onSelect, energy, globalUpgrades, towerCount, maxTowerCount }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hovered, setHovered] = useState<{ type: EntityType, rect: DOMRect, category: 'structure' | 'item' | 'tech' } | null>(null);

  const structures = [
    { type: EntityType.TOWER_BASIC, label: 'Gun', cost: BUILD_COSTS[EntityType.TOWER_BASIC], icon: <Box /> },
    { type: EntityType.TOWER_RAPID, label: 'Rapid', cost: BUILD_COSTS[EntityType.TOWER_RAPID], icon: <Hexagon /> },
    { type: EntityType.TOWER_ICE, label: 'Ice', cost: BUILD_COSTS[EntityType.TOWER_ICE], icon: <Snowflake /> },
    { type: EntityType.TOWER_BOMB, label: 'Bomb', cost: BUILD_COSTS[EntityType.TOWER_BOMB], icon: <Bomb /> },
    { type: EntityType.TOWER_SNIPER, label: 'Sniper', cost: BUILD_COSTS[EntityType.TOWER_SNIPER], icon: <Crosshair /> },
    { type: EntityType.TOWER_TESLA, label: 'Tesla', cost: BUILD_COSTS[EntityType.TOWER_TESLA], icon: <Zap /> },
    { type: EntityType.WALL, label: 'Wall', cost: BUILD_COSTS[EntityType.WALL], icon: <Shield /> },
  ];

  const items = [
    { type: EntityType.ITEM_REPAIR, label: 'Repair', cost: BUILD_COSTS[EntityType.ITEM_REPAIR], icon: <Wrench /> },
    { type: EntityType.ITEM_TRAP, label: 'Trap', cost: BUILD_COSTS[EntityType.ITEM_TRAP], icon: <Target /> },
  ];

  // Calculate dynamic costs for tech
  const ecoCost = Math.floor(BUILD_COSTS[EntityType.TECH_ECONOMY] * Math.pow(TECH_STATS[EntityType.TECH_ECONOMY].costScale, globalUpgrades.economyLevel - 1));
  const durCost = Math.floor(BUILD_COSTS[EntityType.TECH_DURABILITY] * Math.pow(TECH_STATS[EntityType.TECH_DURABILITY].costScale, globalUpgrades.durabilityLevel - 1));

  const tech = [
      { type: EntityType.TECH_ECONOMY, label: 'Economy', cost: ecoCost, icon: <TrendingUp />, level: globalUpgrades.economyLevel },
      { type: EntityType.TECH_DURABILITY, label: 'Hull', cost: durCost, icon: <ShieldPlus />, level: globalUpgrades.durabilityLevel },
  ];

  const handleMouseEnter = (e: React.MouseEvent, type: EntityType, category: 'structure' | 'item' | 'tech') => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setHovered({ type, rect, category });
  };

  const renderTooltip = () => {
      if (!hovered) return null;
      const { type, rect, category } = hovered;

      // Calculate position relative to the viewport
      const left = rect.left + rect.width / 2;
      // Distance from bottom of screen to top of button + padding
      const bottom = window.innerHeight - rect.top + 12;

      let borderColor = 'border-cyan-500';
      let shadowColor = 'shadow-[0_0_15px_#06b6d4]';
      
      if (category === 'item') {
          borderColor = 'border-green-500';
          shadowColor = 'shadow-[0_0_15px_#22c55e]';
      } else if (category === 'tech') {
          borderColor = 'border-purple-500';
          shadowColor = 'shadow-[0_0_15px_#a855f7]';
      }

      return (
          <div 
            className={`fixed z-50 bg-gray-950/95 backdrop-blur-md border ${borderColor} ${shadowColor} p-3 rounded-lg flex flex-col gap-2 min-w-[200px] text-white pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
            style={{ left: `${left}px`, bottom: `${bottom}px`, transform: 'translateX(-50%)' }}
          >
             <div className="font-bold text-sm uppercase tracking-widest border-b border-gray-700 pb-1 mb-1 flex justify-between">
                 <span>{type.replace(/TOWER_|ITEM_|TECH_/, '')}</span>
                 {category === 'structure' && type !== EntityType.WALL && (
                     <span className={`${towerCount >= maxTowerCount ? 'text-red-500' : 'text-gray-400'} text-xs`}>
                         Count: {towerCount}/{maxTowerCount}
                     </span>
                 )}
             </div>
             
             <div className="text-xs font-mono space-y-1 text-gray-300">
                 {/* Structure Tooltip */}
                 {category === 'structure' && (
                     <>
                         {type === EntityType.WALL ? (
                             <div className="flex justify-between"><span>Max HP:</span> <span className="text-white">{TOWER_STATS[type].hp}</span></div>
                         ) : (
                             <>
                                 <div className="flex justify-between"><span>Damage:</span> <span className="text-white">{(TOWER_STATS[type as keyof typeof TOWER_STATS] as any)?.damage}</span></div>
                                 <div className="flex justify-between"><span>Range:</span> <span className="text-white">{(TOWER_STATS[type as keyof typeof TOWER_STATS] as any)?.range}</span></div>
                                 <div className="flex justify-between"><span>Speed:</span> <span className="text-white">{((1000 / ((TOWER_STATS[type as keyof typeof TOWER_STATS] as any)?.cooldown || 1000)).toFixed(1))} /s</span></div>
                                 
                                 {(TOWER_STATS[type as keyof typeof TOWER_STATS] as any)?.blastRadius && (
                                     <div className="flex justify-between text-orange-400"><span>Blast Radius:</span> <span>{(TOWER_STATS[type as keyof typeof TOWER_STATS] as any)?.blastRadius}</span></div>
                                 )}
                                 {(TOWER_STATS[type as keyof typeof TOWER_STATS] as any)?.freezeStrength && (
                                     <div className="flex justify-between text-cyan-300"><span>Freeze:</span> <span>50% Slow</span></div>
                                 )}

                                 <div className="w-full h-px bg-gray-700 my-1" />
                                 <div className="flex justify-between items-center">
                                     <span className="flex items-center gap-1"><Disc size={10}/> Mag:</span> 
                                     <span className="text-white">{(TOWER_STATS[type as keyof typeof TOWER_STATS] as any)?.maxAmmo}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                     <span className="flex items-center gap-1"><Timer size={10}/> Reload:</span> 
                                     <span className="text-white">{((TOWER_STATS[type as keyof typeof TOWER_STATS] as any)?.reloadTime || 0) / 1000}s</span>
                                 </div>
                             </>
                         )}
                     </>
                 )}

                 {/* Item Tooltip */}
                 {category === 'item' && type === EntityType.ITEM_REPAIR && (
                     <div className="italic text-green-300">
                         Repairs damaged structures and base.
                         <br/>
                         <span className="text-gray-400 mt-1 block">Effect: +30% Max HP + 50 HP</span>
                     </div>
                 )}
                 {category === 'item' && type === EntityType.ITEM_TRAP && (
                     <div className="italic text-green-300">
                         High damage proximity mine.
                         <br/>
                         <span className="text-gray-400 mt-1 block">Damage: 500 (AoE)</span>
                     </div>
                 )}

                 {/* Tech Tooltip */}
                 {category === 'tech' && (
                     <div className="space-y-2">
                         {type === EntityType.TECH_ECONOMY && (
                             <>
                                <div className="text-purple-300 mb-1">Increases energy gained from destroying enemies.</div>
                                <div className="flex items-center justify-between bg-gray-900 p-1 rounded">
                                    <span className="text-gray-500">Current (L{globalUpgrades.economyLevel})</span>
                                    <span className="text-white font-bold">{(1 + (globalUpgrades.economyLevel - 1) * TECH_STATS[EntityType.TECH_ECONOMY].effectPerLevel).toFixed(1)}x</span>
                                </div>
                                <div className="flex items-center justify-center text-gray-500 text-[10px]">
                                    <ArrowRight size={12} className="rotate-90" />
                                </div>
                                <div className="flex items-center justify-between bg-purple-900/30 p-1 rounded border border-purple-500/30">
                                    <span className="text-purple-300">Next (L{globalUpgrades.economyLevel + 1})</span>
                                    <span className="text-green-400 font-bold">{(1 + (globalUpgrades.economyLevel) * TECH_STATS[EntityType.TECH_ECONOMY].effectPerLevel).toFixed(1)}x</span>
                                </div>
                             </>
                         )}
                         {type === EntityType.TECH_DURABILITY && (
                             <>
                                <div className="text-purple-300 mb-1">Increases Base Max HP.</div>
                                <div className="flex items-center justify-between bg-gray-900 p-1 rounded">
                                    <span className="text-gray-500">Current (L{globalUpgrades.durabilityLevel})</span>
                                    <span className="text-white font-bold">{(100 + (globalUpgrades.durabilityLevel - 1) * (TECH_STATS[EntityType.TECH_DURABILITY].effectPerLevel * 100))}%</span>
                                </div>
                                <div className="flex items-center justify-center text-gray-500 text-[10px]">
                                    <ArrowRight size={12} className="rotate-90" />
                                </div>
                                <div className="flex items-center justify-between bg-purple-900/30 p-1 rounded border border-purple-500/30">
                                    <span className="text-purple-300">Next (L{globalUpgrades.durabilityLevel + 1})</span>
                                    <span className="text-green-400 font-bold">{(100 + (globalUpgrades.durabilityLevel) * (TECH_STATS[EntityType.TECH_DURABILITY].effectPerLevel * 100))}%</span>
                                </div>
                             </>
                         )}
                     </div>
                 )}
             </div>
          </div>
      );
  };

  return (
    <>
        {/* Render Tooltip outside of the transformed container to maintain correct fixed positioning */}
        {renderTooltip()}

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
        {/* Toggle Button */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="pointer-events-auto mb-0 bg-gray-900/90 border-t border-x border-cyan-900/50 text-cyan-400 rounded-t-lg px-6 py-1 hover:bg-gray-800 hover:text-cyan-200 transition-colors flex items-center gap-2 backdrop-blur shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
        >
            <span className="text-xs font-mono tracking-widest">COMMAND DECK</span>
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Menu Container */}
        <div className={`
            relative pointer-events-auto flex gap-4 p-4 bg-gray-900/95 backdrop-blur-xl border-t border-cyan-900/50 
            shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-all duration-300 origin-bottom ease-in-out
            ${isCollapsed ? 'translate-y-full opacity-0 h-0 p-0 overflow-hidden' : 'translate-y-0 opacity-100'}
        `}>
            {/* Structures Group */}
            <div className="flex gap-2 items-center">
                <div className="hidden md:block -rotate-90 text-[9px] font-mono text-gray-500 tracking-widest whitespace-nowrap">BUILD</div>
                {structures.map((item) => (
                <BuildItem
                    key={item.type}
                    {...item}
                    selected={selectedType === item.type}
                    canAfford={energy >= item.cost}
                    onMouseEnter={(e) => handleMouseEnter(e, item.type, 'structure')}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => {
                    if (selectedType === item.type) {
                        onSelect(null);
                    } else if (energy >= item.cost) {
                        onSelect(item.type);
                    }
                    }}
                />
                ))}
            </div>

            {/* Separator */}
            <div className="w-px bg-gray-700 mx-1" />

            {/* Items Group */}
            <div className="flex gap-2 items-center">
                <div className="hidden md:block -rotate-90 text-[9px] font-mono text-gray-500 tracking-widest whitespace-nowrap">ITEM</div>
                {items.map((item) => (
                    <BuildItem
                    key={item.type}
                    {...item}
                    selected={selectedType === item.type}
                    canAfford={energy >= item.cost}
                    category="item"
                    onMouseEnter={(e) => handleMouseEnter(e, item.type, 'item')}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => {
                        if (selectedType === item.type) {
                        onSelect(null);
                        } else if (energy >= item.cost) {
                        onSelect(item.type);
                        }
                    }}
                    />
                ))}
            </div>

            {/* Separator */}
            <div className="w-px bg-gray-700 mx-1" />

            {/* Tech Group */}
            <div className="flex gap-2 items-center">
                <div className="hidden md:block -rotate-90 text-[9px] font-mono text-gray-500 tracking-widest whitespace-nowrap">SYSTEMS</div>
                {tech.map((item) => (
                    <BuildItem
                    key={item.type}
                    {...item}
                    selected={false} // Tech is instant buy, not selected
                    canAfford={energy >= item.cost}
                    category="tech"
                    onMouseEnter={(e) => handleMouseEnter(e, item.type, 'tech')}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => {
                        if (energy >= item.cost) {
                            onSelect(item.type);
                        }
                    }}
                    />
                ))}
            </div>
        </div>
        </div>
    </>
  );
};
