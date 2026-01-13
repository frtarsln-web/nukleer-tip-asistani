
import React, { useState } from 'react';
import { ISOTOPES } from '../constants';
import { Isotope } from '../types';

interface Props {
  selectedId: string;
  onSelect: (isotope: Isotope) => void;
}

export const IsotopeSelector: React.FC<Props> = ({ selectedId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedIsotope = ISOTOPES.find(i => i.id === selectedId) || ISOTOPES[0];

  return (
    <div className="relative w-full px-2">
      {/* Selector Container */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-lg ${selectedIsotope.color}`}>
              {selectedIsotope.symbol}
            </div>
            <div className="text-left">
              <h3 className="text-xs font-black text-white">{selectedIsotope.name}</h3>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Aktif İzotop</p>
            </div>
          </div>
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown List */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[400px] border-t border-white/5' : 'max-h-0'}`}>
          <div className="p-2 grid grid-cols-1 gap-1">
            {ISOTOPES.map((iso) => (
              <button
                key={iso.id}
                onClick={() => {
                  onSelect(iso);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedId === iso.id 
                  ? 'bg-white/10 border border-white/10' 
                  : 'hover:bg-white/5 grayscale opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${iso.color}`}>
                    {iso.symbol}
                  </div>
                  <span className="text-[10px] font-black text-white">{iso.name}</span>
                </div>
                <span className="text-[8px] font-bold text-slate-500">
                  T½: {iso.halfLifeHours < 24 ? `${iso.halfLifeHours.toFixed(1)} s` : `${(iso.halfLifeHours/24).toFixed(1)} g`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
