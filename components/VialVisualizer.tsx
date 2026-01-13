
import React from 'react';

interface Props {
  percentage: number;
  color: string;
  symbol: string;
}

export const VialVisualizer: React.FC<Props> = ({ percentage, color, symbol }) => {
  const visualHeight = Math.max(percentage, 5);

  return (
    <div className="relative w-16 h-28 mx-auto">
      {/* Vial Cap */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-2 bg-slate-800 rounded-t-sm z-20 border-b border-white/10"></div>
      
      {/* Vial Glass Body */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md rounded-[1.2rem] border border-white/10 overflow-hidden shadow-inner">
        
        {/* Shadow Overlay for Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-black/20 pointer-events-none z-10"></div>
        
        {/* Liquid Level */}
        <div 
          className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out ${color}`}
          style={{ height: `${visualHeight}%` }}
        >
          {/* Wave/Glow */}
          <div className="absolute top-0 left-0 right-0 h-2 -translate-y-1/2 opacity-40 blur-[2px] bg-white"></div>
        </div>

        {/* Isotope Symbol */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <span className="text-xs font-black text-white select-none">
            {symbol}
          </span>
        </div>
      </div>

      {/* Glossy Reflection */}
      <div className="absolute top-2 left-2 w-1 h-16 bg-white/10 rounded-full blur-[0.5px] pointer-events-none"></div>
    </div>
  );
};
