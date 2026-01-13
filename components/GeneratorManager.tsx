
import React, { useState, useEffect } from 'react';
import { IsotopeGenerator, Isotope, DoseUnit } from '../types';
import { calculateDecay, formatActivity, calculateTc99mAccumulation } from '../utils/physics';

interface GeneratorManagerProps {
    generator: IsotopeGenerator | null;
    onAddGenerator: (activity: number, efficiency: number) => void;
    onElute: (amount: number, volume: number) => void;
    onRemoveGenerator: () => void;
    unit: DoseUnit;
    now: Date;
    selectedIsotope: Isotope;
}

export const GeneratorManager: React.FC<GeneratorManagerProps> = ({
    generator,
    onAddGenerator,
    onElute,
    onRemoveGenerator,
    unit,
    now,
    selectedIsotope
}) => {
    const [firstElutionActivity, setFirstElutionActivity] = useState("");
    const [firstElutionVolume, setFirstElutionVolume] = useState("");
    const [efficiency, setEfficiency] = useState("90");
    const [elutionAmount, setElutionAmount] = useState("");
    const [elutionVolume, setElutionVolume] = useState("");

    // Local time state for real-time updates
    const [currentTime, setCurrentTime] = useState<Date>(now);

    // Update currentTime every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 30_000); // 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Keep currentTime in sync with now prop
    useEffect(() => {
        setCurrentTime(now);
    }, [now]);

    const parent = selectedIsotope.parentIsotope;

    if (!generator) {
        return (
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center text-blue-400">
                    <h3 className="text-[10px] font-black uppercase tracking-widest">İLK SAĞIM KAYDI</h3>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{parent?.symbol} → {selectedIsotope.symbol}</span>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 mb-2">
                    <p className="text-[9px] font-bold text-blue-300 leading-relaxed uppercase tracking-wider">
                        Jeneratörden yaptığınız ilk sağımda elde ettiğiniz Tc-99m aktivitesini ve hacmini girin.
                        Fabrika aktivitesini bilmenize gerek yok - sistem otomatik hesaplayacak.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[7px] font-black text-slate-500 uppercase ml-1">İLK SAĞIM AKTİVİTESİ ({unit})</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={firstElutionActivity}
                            onChange={(e) => setFirstElutionActivity(e.target.value)}
                            placeholder="Örn: 350 (standart 300-800)"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-1 focus:ring-blue-500/50"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[7px] font-black text-slate-500 uppercase ml-1">SAĞIM HACMİ (mL)</label>
                        <input
                            type="number"
                            value={firstElutionVolume}
                            onChange={(e) => setFirstElutionVolume(e.target.value)}
                            placeholder="Örn: 10"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-1 focus:ring-blue-500/50"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase ml-1">VERİMLİLİK (%) - Varsayılan %90</label>
                    <input
                        type="number"
                        value={efficiency}
                        onChange={(e) => setEfficiency(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                </div>
                <button
                    onClick={() => {
                        const activity = Number(firstElutionActivity);
                        const volume = Number(firstElutionVolume);
                        const eff = Number(efficiency);
                        if (activity > 0 && volume > 0) {
                            // İlk sağım aktivitesini Mo-99 tahmini aktivitesine çevir (verimlilik üzerinden)
                            // Tipik olarak ilk sağım %90 verimlilik varsayımıyla Mo-99'un ~%87'sini verir (24 saat birikimle)
                            // Basit yaklaşım: ilk sağım ≈ Mo-99 * 0.87 * verimlilik
                            const estimatedMo99 = activity / (0.87 * (eff / 100));
                            onAddGenerator(estimatedMo99, eff);
                            // İlk sağımı da otomatik olarak ekle
                            setTimeout(() => onElute(activity, volume), 100);
                        }
                    }}
                    disabled={!firstElutionActivity || !firstElutionVolume}
                    className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-[0.98] shadow-lg ${firstElutionActivity && firstElutionVolume
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                >
                    İLK SAĞIMI KAYDET VE JENERATÖRÜ AKTİFLEŞTİR
                </button>
            </div>
        );
    }

    const hoursSinceReceived = (currentTime.getTime() - new Date(generator.receivedAt).getTime()) / (1000 * 60 * 60);
    const lastElutionTime = generator.lastElutionAt ? new Date(generator.lastElutionAt) : new Date(generator.receivedAt);
    const hoursSinceLastElution = (currentTime.getTime() - lastElutionTime.getTime()) / (1000 * 60 * 60);

    const maxAvailableTc = calculateTc99mAccumulation(
        generator.initialActivity,
        hoursSinceLastElution,
        hoursSinceReceived,
        generator.efficiency
    );

    const currentMo99 = calculateDecay(generator.initialActivity, parent!.halfLifeHours, hoursSinceReceived);

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/60 border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl">
                {/* Animated background glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 opacity-10 blur-[80px] animate-pulse"></div>

                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{parent?.symbol} JENERATÖR</span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tighter mt-1">Aktif Jeneratör</h3>
                            <div className="flex gap-3 mt-2">
                                <div className="text-[8px] font-bold text-slate-500 uppercase">Giriş: {new Date(generator.receivedAt).toLocaleDateString()}</div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase">Son Sağım: {generator.lastElutionAt ? new Date(generator.lastElutionAt).toLocaleTimeString() : 'Bilinmiyor'}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">MO-99 GÜCÜ</span>
                            <div className="flex items-baseline justify-end gap-1 mt-0.5">
                                <span className="text-xl font-black text-blue-200">{formatActivity(currentMo99)}</span>
                                <span className="text-[10px] font-black text-slate-500">{unit}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">BİRİKEN TC-99M</span>
                            <div className="flex items-baseline gap-1.5">
                                {/* Animated accumulating value */}
                                <span className="text-3xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse">
                                    {formatActivity(Math.max(0, maxAvailableTc))}
                                </span>
                                <span className="text-sm font-black text-blue-400">{unit}</span>
                                {/* Activity indicator */}
                                {hoursSinceLastElution < 24 && (
                                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                                        <span className="text-[7px] font-black text-green-400 uppercase">BİRİKİYOR</span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">BİRİKİM SÜRESİ</span>
                            {/* Animated time display */}
                            <div className="relative inline-block">
                                <p className="text-xl font-black text-slate-300 tabular-nums">
                                    {Math.max(0, Math.floor(hoursSinceLastElution))}sa {Math.max(0, Math.floor((hoursSinceLastElution % 1) * 60))}dk
                                </p>
                                {/* Warning if too long */}
                                {hoursSinceLastElution >= 24 && (
                                    <span className="absolute -top-2 -right-2 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                    </span>
                                )}
                            </div>
                            {hoursSinceLastElution >= 24 && (
                                <p className="text-[7px] font-bold text-orange-400 mt-1">⚠️ 24 saat geçti - sağım önerilir</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[7px] font-black text-slate-500 uppercase ml-2 tracking-[0.2em]">SAĞIM MİKTARI ({unit})</label>
                                <input
                                    type="number"
                                    value={elutionAmount}
                                    onChange={(e) => setElutionAmount(e.target.value)}
                                    placeholder={formatActivity(maxAvailableTc)}
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[7px] font-black text-slate-500 uppercase ml-2 tracking-[0.2em]">HACİM (mL)</label>
                                <input
                                    type="number"
                                    value={elutionVolume}
                                    onChange={(e) => setElutionVolume(e.target.value)}
                                    placeholder="10"
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => onElute(Number(elutionAmount), Number(elutionVolume))}
                            disabled={!elutionAmount || !elutionVolume}
                            className={`w-full h-14 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.97] flex items-center justify-center gap-3 shadow-xl group ${elutionAmount && elutionVolume
                                ? 'bg-white hover:bg-blue-50 text-black'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                            GÜNLÜK SAĞIM YAP (TC-99M ELÜSYON)
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={() => {
                    // Safe access to symbol with fallback
                    const parentSymbol = parent?.symbol || 'Mo-99';
                    const confirmMessage = `⚠️ JENERATÖR KALDIRILACAK\n\nMevcut ${parentSymbol} jeneratörü ve ilgili tüm veriler sistemden kaldırılacak.\n\nOnaylıyor musunuz?`;

                    if (window.confirm(confirmMessage)) {
                        onRemoveGenerator();
                    }
                }}
                className="w-full py-4 mt-2 text-[10px] font-black text-blue-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all uppercase tracking-[0.2em] border border-blue-900/30 hover:border-red-500/30 shadow-lg hover:shadow-red-900/20"
            >
                🔄 JENERATÖR ÜNİTESİNİ DEĞİŞTİR / YENİLE
            </button>
        </div>
    );
};
