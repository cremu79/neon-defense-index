import React, { useState, useMemo } from 'react';
import { Shield, Play, Pickaxe, Settings, Bot, Zap, Crosshair, Skull, Rocket } from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  const [description, setDescription] = useState<string | null>(null);

  // Generate random buildings for the skyline (Memoized to prevent flickering on state change)
  const buildings = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    height: 3 + Math.random() * 8,
    width: 1.5 + Math.random() * 2.5,
  })), []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#090014] overflow-hidden select-none font-sans">
      
      {/* --- Background Layers --- */}
      
      {/* 1. Starfield */}
      <div className="absolute inset-0 bg-[radial-gradient(white_1px,_transparent_1px)] bg-[length:50px_50px] opacity-40" />

      {/* 2. Retro Sun (Striped) */}
      <div 
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[50vh] h-[50vh] rounded-full opacity-100 blur-[1px]"
        style={{
          background: 'linear-gradient(to bottom, #ffdd00 0%, #f59e0b 40%, #ec4899 70%, #a855f7 100%)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 50%, black 53%, transparent 53%, black 58%, transparent 58%, black 65%, transparent 65%, black 75%, transparent 75%, black 90%)',
          boxShadow: '0 0 60px rgba(236, 72, 153, 0.6)'
        }}
      />

      {/* 3. Cityscape Silhouette */}
      <div className="absolute bottom-[45%] left-0 right-0 h-40 flex items-end justify-center gap-1 z-0 opacity-80 px-10">
        {buildings.map((b, i) => (
          <div 
            key={i} 
            className="bg-[#1a0b2e] border-t border-purple-500/30" 
            style={{ 
              height: `${b.height}rem`, 
              width: `${b.width}rem`,
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.2)'
            }} 
          >
              {/* Random windows */}
              {Math.random() > 0.5 && (
                  <div className="w-1 h-1 bg-cyan-500/50 m-1 rounded-full animate-pulse" style={{ animationDelay: `${Math.random() * 2}s` }} />
              )}
          </div>
        ))}
      </div>

      {/* 4. Perspective Grid Floor */}
      <div className="absolute bottom-0 left-0 w-full h-[45%] overflow-hidden perspective-[100vh] z-10 bg-[#0f0518]">
        {/* Fog fading into the horizon */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0518] via-transparent to-[#0f0518] z-20" />
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#0f0518] to-transparent z-20" />
        
        {/* The moving grid */}
        <div 
          className="absolute -top-[100%] -left-[50%] w-[200%] h-[200%] bg-[linear-gradient(transparent_98%,_rgba(236,72,153,0.5)_100%),_linear-gradient(90deg,_transparent_98%,_rgba(34,211,238,0.5)_100%)] bg-[length:60px_60px] animate-grid-move"
          style={{ 
            transform: 'rotateX(60deg)',
            transformOrigin: 'center bottom',
            boxShadow: 'inset 0 0 100px #000'
          }} 
        />
      </div>

      {/* --- Scene Decorations (Fake Entities on Grid) --- */}
      <div className="absolute bottom-[10%] left-0 w-full h-[30%] z-20 pointer-events-none overflow-hidden perspective-[100vh]">
          {/* Left Drone */}
          <div className="absolute bottom-[40%] left-[15%] text-cyan-400 animate-bounce opacity-80">
              <Bot size={48} className="drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-2 bg-cyan-500/30 blur-sm rounded-full" />
          </div>
          
          {/* Right Drone */}
          <div className="absolute bottom-[60%] right-[15%] text-cyan-400 animate-bounce opacity-80" style={{ animationDelay: '1s' }}>
              <Bot size={40} className="drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-2 bg-cyan-500/30 blur-sm rounded-full" />
          </div>

          {/* Big Enemy */}
          <div className="absolute bottom-[30%] right-[25%] text-purple-500 animate-pulse">
               <Skull size={64} className="drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-purple-500/30 blur-md rounded-full" />
          </div>

          {/* Projectile/Action */}
          <div className="absolute bottom-[45%] left-[25%] text-yellow-400">
              <Rocket size={32} className="rotate-45 drop-shadow-[0_0_10px_#facc15]" />
          </div>
          <div className="absolute bottom-[35%] left-[40%] text-red-500">
               <Crosshair size={24} className="animate-spin-slow" />
          </div>
          <div className="absolute bottom-[35%] right-[40%]">
             <div className="w-4 h-4 bg-orange-500 rounded-full blur-[2px] animate-ping" />
          </div>
      </div>

      {/* --- Main UI Content --- */}
      <div className="z-30 flex flex-col items-center w-full">
        
        {/* Title Group */}
        <div className="relative flex flex-col items-center mb-16 hover:scale-105 transition-transform duration-500">
            
            {/* NEON */}
            <h1 className="relative z-10 leading-none font-pixel text-center">
                <span className="block text-[3rem] md:text-[5rem] tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-300 to-cyan-500"
                      style={{ 
                          textShadow: '4px 4px 0px #0891b2, 0 0 20px rgba(34,211,238,0.6)',
                          WebkitTextStroke: '1px #fff',
                      }}>
                    NEON
                </span>
            </h1>
            
            {/* DEFENSE */}
            <h1 className="relative z-20 -mt-2 md:-mt-4 leading-none font-pixel text-center">
                <span className="block text-[2.5rem] md:text-[4rem] tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-300 via-fuchsia-500 to-purple-600"
                      style={{ 
                          textShadow: '4px 4px 0px #7e22ce, 0 0 25px rgba(219,39,119,0.6)',
                          WebkitTextStroke: '1px #fff',
                      }}>
                    DEFENSE
                </span>
            </h1>
        </div>

        {/* Start Button (Arcade Style) */}
        <button 
          onClick={onStart}
          className="group relative px-12 py-4 overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95 active:translate-y-1"
        >
          {/* Border Glow */}
          <div className="absolute inset-0 border-4 border-cyan-500 shadow-[0_0_20px_#22d3ee,inset_0_0_20px_rgba(34,211,238,0.2)] bg-cyan-950/80 opacity-90 group-hover:opacity-100 transition-opacity skew-x-[-10deg]" />
          
          {/* Text Content */}
          <div className="relative flex items-center gap-4 z-10">
             <Play className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-pulse" />
             <span className="font-pixel text-lg md:text-xl text-white drop-shadow-[2px_2px_0_#000] group-hover:text-yellow-300">
                START GAME
             </span>
             <Play className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-pulse rotate-180" />
          </div>
        </button>

        {/* Footer Section Container */}
        <div className="mt-32 flex flex-col items-center gap-4 relative z-40">
            
            {/* Game Description Header */}
            <h3 className="font-pixel text-[20px] md:text-xs text-cyan-600 tracking-[0.2em] animate-pulse">
                -  Game Description -
            </h3>

            {/* Footer Icons */}
            <div className="flex gap-6 md:gap-12 opacity-100 relative">
                {/* Build (Pickaxe) */}
                <div 
                    className="flex flex-col items-center gap-3 group cursor-default transition-transform hover:-translate-y-2"
                    onMouseEnter={() => setDescription("DEPLOY TURRETS & TRAPS TO INTERCEPT HOSTILES")}
                    onMouseLeave={() => setDescription(null)}
                >
                    <div className="relative p-3 rounded-lg border-2 border-cyan-500 bg-black/60 shadow-[4px_4px_0px_#0e7490] group-hover:border-white group-hover:shadow-[0_0_20px_#22d3ee] transition-all duration-200">
                        <Pickaxe className="text-cyan-300 w-6 h-6 group-hover:text-white" />
                    </div>
                    <span className="font-pixel text-[10px] text-cyan-200 drop-shadow-md group-hover:text-white">BUILD</span>
                </div>

                {/* Upgrade (Settings/Gear) */}
                <div 
                    className="flex flex-col items-center gap-3 group cursor-default transition-transform hover:-translate-y-2"
                    onMouseEnter={() => setDescription("ENHANCE WEAPON SYSTEMS & MAXIMIZE EFFICIENCY")}
                    onMouseLeave={() => setDescription(null)}
                >
                    <div className="relative p-3 rounded-lg border-2 border-fuchsia-500 bg-black/60 shadow-[4px_4px_0px_#a21caf] group-hover:border-white group-hover:shadow-[0_0_20px_#d946ef] transition-all duration-200">
                        <Settings className="text-fuchsia-300 w-6 h-6 group-hover:text-white" />
                    </div>
                    <span className="font-pixel text-[10px] text-fuchsia-200 drop-shadow-md group-hover:text-white">UPGRADE</span>
                </div>

                {/* Defend (Shield) */}
                <div 
                    className="flex flex-col items-center gap-3 group cursor-default transition-transform hover:-translate-y-2"
                    onMouseEnter={() => setDescription("PROTECT THE ENERGY CORE AT ALL COSTS")}
                    onMouseLeave={() => setDescription(null)}
                >
                    <div className="relative p-3 rounded-lg border-2 border-purple-500 bg-black/60 shadow-[4px_4px_0px_#7e22ce] group-hover:border-white group-hover:shadow-[0_0_20px_#a855f7] transition-all duration-200">
                        <Shield className="text-purple-300 w-6 h-6 group-hover:text-white" />
                    </div>
                    <span className="font-pixel text-[10px] text-purple-200 drop-shadow-md group-hover:text-white">DEFEND</span>
                </div>
            </div>
        </div>
        
        {/* Hover Description Display */}
        <div className="h-6 mt-6 flex items-center justify-center">
            {description && (
                <div className="font-pixel text-[8px] md:text-[10px] text-cyan-300 tracking-widest bg-black/40 border border-cyan-500/30 px-4 py-1 rounded backdrop-blur-sm animate-in fade-in duration-200">
                    {description}
                </div>
            )}
        </div>

      </div>

      {/* Scanline Overlay (CRT Effect) */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20" />
      
      {/* Version */}
      <div className="absolute bottom-4 right-6 font-pixel text-[8px] text-cyan-600 z-50">
          V.2.0.6_PIXEL
      </div>

      {/* CSS Animation for Grid */}
      <style>{`
        @keyframes grid-move {
            0% { background-position: 0 0; }
            100% { background-position: 0 60px; }
        }
        .animate-grid-move {
            animation: grid-move 1.5s linear infinite;
        }
        .animate-spin-slow {
            animation: spin 4s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};