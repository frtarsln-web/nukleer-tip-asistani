
import React, { useState } from 'react';
import { Vial, Isotope, DoseUnit } from '../types';
import { VialVisualizer } from './VialVisualizer';
import { VialDecayChart } from './VialDecayChart';
import { formatActivity } from '../utils/physics';

interface StockManagerProps {
    vials: Vial[];
    selectedIsotope: Isotope;
    unit: DoseUnit;
    newVialInput: string;
    newVialVolume: string;
    setNewVialInput: (val: string) => void;
    setNewVialVolume: (val: string) => void;
    onAddVial: () => void;
    onRemoveVial: (id: string) => void;
    getVialCurrentActivity: (vial: Vial) => number;
    hideEntry?: boolean;
}

export const StockManager: React.FC<StockManagerProps> = ({
    vials,
    selectedIsotope,
    unit,
    newVialInput,
    newVialVolume,
    setNewVialInput,
    setNewVialVolume,
    onAddVial,
    onRemoveVial,
    getVialCurrentActivity,
    hideEntry
}) => {
    const [activeVialId, setActiveVialId] = useState<string | null>(null);

    const activeVial = vials.find(v => v.id === activeVialId);

    return (
        <section className="space-y-4">
            {!hideEntry && (
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">YENİ TESLİMAT GİRİŞİ</h3>
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">VIAL BİLGİLERİ</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[7px] font-black text-slate-500 uppercase ml-1">DOZ ({unit})</label>
                                <input
                                    type="number"
                                    placeholder="Miktar..."
                                    value={newVialInput}
                                    onChange={(e) => setNewVialInput(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-1 focus:ring-blue-500/50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[7px] font-black text-slate-500 uppercase ml-1">HACİM (mL)</label>
                                <input
                                    type="number"
                                    placeholder="ml..."
                                    value={newVialVolume}
                                    onChange={(e) => setNewVialVolume(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-1 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>
                        <button
                            onClick={onAddVial}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
                        >
                            ENVANTERE EKLE
                        </button>
                    </div>
                </div>
            )}

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                {vials.length > 0 ? vials.map(vial => {
                    const current = getVialCurrentActivity(vial);

                    // 0 mCi flakonları gizle
                    if (current < 0.1) return null;

                    const perc = (current / vial.initialAmount) * 100;
                    const isActive = activeVialId === vial.id;

                    // Kit kontrolü - label'da "Lot:" veya kit isimleri varsa
                    const isKit = vial.label && (
                        vial.label.includes('Lot:') ||
                        vial.label.includes('MDP') ||
                        vial.label.includes('MIBI') ||
                        vial.label.includes('MAA') ||
                        vial.label.includes('DTPA') ||
                        vial.label.includes('DMSA') ||
                        vial.label.includes('MAG3') ||
                        vial.label.includes('HDP')
                    );

                    return (
                        <div
                            key={vial.id}
                            onClick={() => setActiveVialId(isActive ? null : vial.id)}
                            className={`flex-shrink-0 w-36 border transition-all duration-500 cursor-pointer rounded-[2.5rem] p-4 flex flex-col items-center relative group shadow-2xl ${isActive
                                ? isKit
                                    ? 'bg-emerald-600/20 border-emerald-500/50 shadow-emerald-500/30'
                                    : 'bg-blue-600/20 border-blue-500/50'
                                : isKit
                                    ? 'bg-emerald-900/20 border-emerald-500/30 shadow-emerald-500/10'
                                    : 'bg-slate-900/60 border-white/5'
                                }`}
                        >
                            {/* Kit Badge */}
                            {isKit && (
                                <div className="absolute top-2 left-2 z-10">
                                    <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                                        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-[7px] font-black text-emerald-400 uppercase">KİT</span>
                                    </span>
                                </div>
                            )}

                            {/* Tüm flokonlar için silme butonu göster - hideEntry sadece yeni giriş formunu gizler */}
                            {(
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveVial(vial.id); }}
                                    className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 rounded-xl transition-all z-10 border border-red-500/30"
                                    title="Kurşun Atığa Gönder"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" /></svg>
                                </button>
                            )}
                            <VialVisualizer percentage={perc} color={isKit ? 'bg-emerald-500' : selectedIsotope.color} symbol={selectedIsotope.symbol} />
                            <div className="mt-4 text-center w-full">
                                <p className={`text-[9px] font-black uppercase tracking-wider ${isKit ? 'text-emerald-400' : 'text-slate-400'}`}>{vial.label}</p>
                                <p className={`text-sm font-black tracking-tighter mt-1 ${isKit ? 'text-emerald-400' : selectedIsotope.color.replace('bg-', 'text-')}`}>
                                    {current.toFixed(2)} <span className="text-[8px] opacity-60">{unit}</span>
                                </p>

                                <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                    <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 uppercase px-1">
                                        <span>Hacim:</span>
                                        <span className="text-white font-black">{vial.initialVolumeMl} mL</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="w-full py-10 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-700 bg-slate-900/10">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 italic">Stok Boş - Yeni Doz Ekleyin</p>
                    </div>
                )}
            </div>

            {activeVial && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <VialDecayChart vial={activeVial} isotope={selectedIsotope} />
                </div>
            )}
        </section>
    );
};
