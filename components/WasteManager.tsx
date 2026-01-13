import React, { useState } from 'react';
import { WasteBin, WasteItem, DoseUnit, Isotope } from '../types';
import { calculateDecay } from '../utils/physics';

interface WasteManagerProps {
    bins: WasteBin[];
    selectedIsotope: Isotope;
    unit: DoseUnit;
    now: Date;
    onDispose: (binId: string, item: Omit<WasteItem, 'id' | 'disposedAt'>) => void;
    onAddBin: (name: string, type: 'sharp' | 'solid' | 'liquid') => void;
    onEmptyBin: (binId: string) => void;
}

export const WasteManager: React.FC<WasteManagerProps> = ({
    bins,
    selectedIsotope,
    unit,
    now,
    onDispose,
    onAddBin,
    onEmptyBin
}) => {
    const [isAddingBin, setIsAddingBin] = useState(false);
    const [newBinName, setNewBinName] = useState("");
    const [newBinType, setNewBinType] = useState<'sharp' | 'solid' | 'liquid'>('solid');

    const getBinActivity = (bin: WasteBin) => {
        return bin.items.reduce((total, item) => {
            // Only count items matching the selected isotope for simplicity in this view, 
            // or convert all if mixing isotopes (advanced). 
            // For this app, we assume bins might be mixed but we track physics per item.
            // If item isotope matches selected, we decay it.
            if (item.isotopeId === selectedIsotope.id) {
                const hours = (now.getTime() - new Date(item.disposedAt).getTime()) / (1000 * 60 * 60);
                return total + calculateDecay(item.activity, selectedIsotope.halfLifeHours, hours);
            }
            return total; // Ignore other isotopes in this simple view or assume 0 for now
        }, 0);
    };

    const handleAddBin = () => {
        if (!newBinName) return;
        onAddBin(newBinName, newBinType);
        setNewBinName("");
        setIsAddingBin(false);
    };

    return (
        <section className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    ATIK YÖNETİMİ
                </h3>
                <button
                    onClick={() => setIsAddingBin(!isAddingBin)}
                    className="text-[9px] font-black text-blue-500/60 hover:text-blue-400 uppercase tracking-wider bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/10 transition-colors"
                >
                    + YENİ KUTU
                </button>
            </div>

            {isAddingBin && (
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex gap-2 animate-in slide-in-from-top-2">
                    <input
                        type="text"
                        value={newBinName}
                        onChange={e => setNewBinName(e.target.value)}
                        placeholder="Kutu Adı (Örn: Kesici 1)"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <select
                        value={newBinType}
                        onChange={e => setNewBinType(e.target.value as any)}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                        <option value="solid">Katı Atık</option>
                        <option value="sharp">Kesici/Delici</option>
                        <option value="liquid">Sıvı Atık</option>
                    </select>
                    <button
                        onClick={handleAddBin}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase"
                    >
                        EKLE
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {bins.map(bin => {
                    const currentActivity = getBinActivity(bin);
                    // Thresholds: < 0.05 is SAFE (Green), > 0.1 is HOT (Red), else WARM (Yellow) (Logic varies by facility)
                    const isHot = currentActivity > 0.1;
                    const isSafe = currentActivity < 0.005; // Very low

                    const statusColor = isHot ? 'text-rose-500' : (isSafe ? 'text-emerald-500' : 'text-amber-500');
                    const borderColor = isHot ? 'border-rose-500/20' : (isSafe ? 'border-emerald-500/20' : 'border-amber-500/20');
                    const bgColor = isHot ? 'bg-rose-500/5' : (isSafe ? 'bg-emerald-500/5' : 'bg-amber-500/5');

                    return (
                        <div key={bin.id} className={`bg-slate-900/40 border ${borderColor} rounded-3xl p-5 relative group overflow-hidden ${bgColor}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="text-xs font-black text-white">{bin.name}</h4>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">{bin.type === 'sharp' ? 'KESİCİ/DELİCİ' : bin.type === 'solid' ? 'KATI ATIK' : 'SIVI ATIK'}</span>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${isHot ? 'bg-rose-500 animate-pulse' : (isSafe ? 'bg-emerald-500' : 'bg-amber-500')}`}></div>
                            </div>

                            <div className="mt-4">
                                <p className={`text-xl font-black ${statusColor} tracking-tighter`}>
                                    {currentActivity.toFixed(4)} <span className="text-[10px] opacity-60">{unit}</span>
                                </p>
                                <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">
                                    {isHot ? 'YÜKSEK RADYASYON' : isSafe ? 'GÜVENLİ SEVİYE' : 'BOZUNMA DEVAM EDİYOR'}
                                </p>
                            </div>

                            <div className="mt-4 flex gap-2">
                                {isSafe && bin.items.length > 0 && (
                                    <button
                                        onClick={() => onEmptyBin(bin.id)}
                                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2 rounded-xl text-[9px] font-black uppercase transition-colors border border-emerald-500/20"
                                    >
                                        BOŞALT
                                    </button>
                                )}
                            </div>

                            {/* Visual Noise Pattern */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
