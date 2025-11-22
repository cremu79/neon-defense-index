
import React from 'react';
import { Zap, Heart, ShieldAlert, Activity, Timer, Cast } from 'lucide-react';

interface HUDProps {
  baseHp: number;
  maxBaseHp: number;
  energy: number;
  wave: number;
  waveInProgress: boolean;
  prepTimer: number;
  towerCount: number;
  maxTowerCount: number;
}

export const HUD: React.FC<HUDProps> = ({ baseHp, maxBaseHp, energy, wave, waveInProgress, prepTimer, towerCount, maxTowerCount }) => {
  const hpPercentage = Math.max(0, (baseHp / maxBaseHp) * 100);
  
  return (
    <>
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-20 select-none">
        
        {/* Left: HP */}
        <div className="flex flex-col gap-1 w-64">
          <div className="flex items-center gap-2 text-white font-mono text-lg font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            <Heart className="w-5 h-5 text-green-400 fill-current" />
            <span>Base HP: {Math.ceil(hpPercentage)}%</span>
          </div>
          <div className="w-full h-4 bg-gray-800/80 border border-gray-600 skew-x-[-12deg] overflow-hidden relative">
            <div 
              className="h-full bg-green-500 transition-all duration-300 ease-out shadow-[0_0_15px_#22c55e]"
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>

        {/* Center: Energy & Towers */}
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center bg-gray-900/60 backdrop-blur-sm px-8 py-2 border-b-2 border-blue-500 rounded-b-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_#60a5fa]" />
              <span className="text-blue-100 font-mono text-2xl font-bold tracking-wider">ENERGY: {Math.floor(energy)}</span>
              <Zap className="w-6 h-6 text-yellow-400 fill-current drop-shadow-[0_0_8px_#facc15]" />
            </div>
          </div>
          
          {/* Tower Count Indicator */}
          <div className="mt-1 bg-gray-900/50 backdrop-blur-sm px-4 py-1 rounded-b-lg border border-t-0 border-cyan-800/50 flex items-center gap-2">
            <Cast className={`w-4 h-4 ${towerCount >= maxTowerCount ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
            <span className={`font-mono text-sm font-bold ${towerCount >= maxTowerCount ? 'text-red-400' : 'text-cyan-200'}`}>
               TOWERS: {towerCount} / {maxTowerCount}
            </span>
          </div>
        </div>

        {/* Right: Wave Info */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-white font-mono text-2xl font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
             <span>Wave: {wave}</span>
             {wave % 5 === 0 && wave > 0 && (
               <span className="text-red-500 text-sm animate-pulse ml-2 flex items-center font-black tracking-widest">
                  (BOSS) <ShieldAlert className="w-5 h-5 ml-1" />
               </span>
             )}
          </div>
          <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
              <Activity className="w-3 h-3" /> System Normal
          </div>
        </div>
      </div>

      {/* Center Screen Countdown */}
      {!waveInProgress && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
           <div className="text-cyan-400 font-mono text-sm tracking-[0.3em] mb-1 animate-pulse">
             {wave === 1 ? "INITIALIZING DEFENSE SYSTEMS" : "REINFORCEMENTS INCOMING"}
           </div>
           <div className="flex items-center gap-3 text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(0,243,255,0.5)] font-mono bg-black/40 px-6 py-2 rounded border border-cyan-900/50 backdrop-blur-sm">
              <Timer className="w-8 h-8 text-cyan-400 animate-spin-slow" />
              <span>-{Math.ceil(prepTimer / 1000)}s</span>
           </div>
        </div>
      )}
    </>
  );
};
