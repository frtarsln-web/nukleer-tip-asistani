
import React, { useState, useEffect } from 'react';
import { ColdKit, Vial, DoseUnit, NotificationType } from '../types';
import { COLD_KITS } from '../constants';

interface KitPreparationProps {
    onPrepareKit: (vial: Vial) => void;
    onConsumeActivity: (amount: number) => void;  // Jeneratörden aktivite düşür
    unit: DoseUnit;
    addNotification: (message: string, type: NotificationType, description?: string, autoClose?: boolean) => void;
}

interface ActivePrep {
    kitId: string;
    kitName: string;
    startTime: number; // Unix timestamp when preparation started
    completionTime: number; // Unix timestamp when preparation will complete
    amount: number;
    volume: number;
    lot: string;
}

export const KitPreparation: React.FC<KitPreparationProps & { currentActivity: number }> = ({
    onPrepareKit,
    onConsumeActivity,
    unit,
    addNotification,
    currentActivity
}) => {
    const [selectedKitId, setSelectedKitId] = useState(COLD_KITS[0].id);
    const [activity, setActivity] = useState("");
    const [volume, setVolume] = useState("");
    const [lotNumber, setLotNumber] = useState("");
    const [activePreps, setActivePreps] = useState<ActivePrep[]>([]);
    const [showKitReadyAlert, setShowKitReadyAlert] = useState<{ kitName: string; amount: number } | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setActivePreps(prev => {
                if (prev.length === 0) return prev;

                const now = Date.now();
                const stillActive: ActivePrep[] = [];

                prev.forEach(p => {
                    const timeRemaining = p.completionTime - now;

                    if (timeRemaining <= 0) {
                        // Kit is ready - only complete it once
                        const wasJustCompleted = (p.completionTime - now + 1000) > 0; // Check if just completed in this tick

                        if (wasJustCompleted) {
                            const newVial: Vial = {
                                id: Math.random().toString(36).substr(2, 9),
                                initialAmount: p.amount,
                                initialVolumeMl: p.volume,
                                receivedAt: new Date(),
                                label: `${p.kitName} (Lot: ${p.lot || 'N/A'})`
                            };
                            onPrepareKit(newVial);
                            addNotification('Kit Hazır!', 'success', `${p.kitName} hazırlama süreci tamamlandı ve envantere eklendi.`, false);

                            // Animasyonlu popup göster
                            setShowKitReadyAlert({ kitName: p.kitName, amount: p.amount });
                            setTimeout(() => setShowKitReadyAlert(null), 5000);
                        }
                        // Don't add to stillActive - remove completed preparations
                    } else {
                        // Still preparing
                        stillActive.push(p);
                    }
                });

                return stillActive;
            });
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePrepare = () => {
        const kit = COLD_KITS.find(k => k.id === selectedKitId);
        const amount = parseFloat(activity);
        const vol = parseFloat(volume);

        if (!kit || isNaN(amount) || amount <= 0 || isNaN(vol) || vol <= 0) {
            alert("Lütfen geçerli aktivite ve hacim bilgisi girin.");
            return;
        }

        if (amount > currentActivity) {
            alert(`Yetersiz elüat! Mevcut: ${currentActivity.toFixed(2)} ${unit}`);
            return;
        }

        // Jeneratör/elüat stoktan aktiviteyi düş
        onConsumeActivity(amount);

        if (kit.prepTimerMinutes) {
            const now = Date.now();
            const completionTime = now + (kit.prepTimerMinutes * 60 * 1000);

            setActivePreps(prev => [...prev, {
                kitId: kit.id + Math.random(),
                kitName: kit.name,
                startTime: now,
                completionTime: completionTime,
                amount,
                volume: vol,
                lot: lotNumber
            }]);
            addNotification('Hazırlama Başladı', 'info', `${kit.name} için ${kit.prepTimerMinutes} dakikalık süreç başlatıldı. ${amount} ${unit} kullanıldı.`);
        } else {
            const newVial: Vial = {
                id: Math.random().toString(36).substr(2, 9),
                initialAmount: amount,
                initialVolumeMl: vol,
                receivedAt: new Date(),
                label: `${kit.name} (Lot: ${lotNumber || 'N/A'})`
            };
            onPrepareKit(newVial);
            addNotification('Kit Hazırlandı', 'success', `${newVial.label} envantere eklendi. ${amount} ${unit} kullanıldı.`);
        }

        setActivity("");
        setVolume("");
        setLotNumber("");
    };

    const selectedKit = COLD_KITS.find(k => k.id === selectedKitId);

    return (
        <>
            {/* Animasyonlu Kit Hazır Popup - Gösterişli */}
            {showKitReadyAlert && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-auto">
                    {/* Parıldayan arka plan */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-green-900/90 to-emerald-950/95 animate-pulse" onClick={() => setShowKitReadyAlert(null)}>
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-gradient-radial from-emerald-500/30 via-transparent to-transparent animate-spin" style={{ animation: 'spin 8s linear infinite' }}></div>
                        </div>
                    </div>

                    {/* İçerik Kartı */}
                    <div className="relative bg-gradient-to-br from-emerald-500/20 to-green-600/10 border-4 border-emerald-400/50 rounded-[3rem] p-10 max-w-md mx-4 shadow-2xl shadow-emerald-500/50 backdrop-blur-xl animate-in zoom-in-95 fade-in duration-500">
                        {/* Parıldama efekti */}
                        <div className="absolute -top-2 -right-2">
                            <span className="flex h-6 w-6">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500"></span>
                            </span>
                        </div>

                        <div className="text-center">
                            {/* Büyük İkon */}
                            <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-emerald-500/30 border-4 border-emerald-400/50 flex items-center justify-center animate-bounce shadow-2xl shadow-emerald-500/50">
                                <svg className="w-16 h-16 text-emerald-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            {/* Başlık */}
                            <h2 className="text-4xl font-black text-white mb-3 tracking-tight animate-pulse drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">
                                🎉 KİT HAZIR!
                            </h2>

                            {/* Kit Adı */}
                            <div className="bg-white/10 border-2 border-emerald-400/30 rounded-2xl px-6 py-4 mb-4 backdrop-blur">
                                <p className="text-emerald-300 font-black text-2xl uppercase tracking-wider mb-2">
                                    {showKitReadyAlert.kitName}
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <p className="text-white text-sm font-bold">
                                        {showKitReadyAlert.amount} {unit} aktivite
                                    </p>
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                </div>
                            </div>

                            {/* Bilgi */}
                            <p className="text-emerald-200 text-sm mb-6 animate-pulse">
                                ✓ Envantere eklendi ve kullanıma hazır!
                            </p>

                            {/* Buton */}
                            <button
                                onClick={() => setShowKitReadyAlert(null)}
                                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black uppercase text-lg tracking-wider transition-all active:scale-95 shadow-2xl shadow-emerald-500/50 border-2 border-emerald-300/50"
                            >
                                TAMAM
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center text-emerald-400">
                    <h3 className="text-[10px] font-black uppercase tracking-widest">SOĞUK KİT HAZIRLAMA</h3>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter italic">
                        {selectedKit?.prepTimerMinutes ? `${selectedKit.prepTimerMinutes} Dakika Bekleme Gerekli` : 'Anında Hazırlama'}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[7px] font-black text-slate-500 uppercase ml-1">KİT SEÇİMİ</label>
                        <select
                            value={selectedKitId}
                            onChange={(e) => setSelectedKitId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                        >
                            {COLD_KITS.map(kit => (
                                <option key={kit.id} value={kit.id}>{kit.name} - {kit.fullName}</option>
                            ))}
                        </select>
                    </div>

                    {activePreps.length > 0 && (
                        <div className="space-y-2 py-2">
                            {activePreps.map(p => {
                                const now = Date.now();
                                const timeLeft = Math.max(0, Math.floor((p.completionTime - now) / 1000));
                                const totalTime = Math.floor((p.completionTime - p.startTime) / 1000);
                                const progress = totalTime > 0 ? (1 - timeLeft / totalTime) : 1;

                                return (
                                    <div key={p.kitId} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 animate-in slide-in-from-right-2">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] font-black text-amber-400 uppercase">{p.kitName} HAZIRLANIYOR...</span>
                                            <span className="text-[10px] font-mono text-white tabular-nums">
                                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500 transition-all duration-1000"
                                                style={{ width: `${progress * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {selectedKit?.preparationSteps && (
                        <div className="bg-emerald-900/20 border border-emerald-500/10 rounded-2xl p-4 animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">HAZIRLAMA KILAVUZU</span>
                            </div>
                            <ul className="space-y-1.5">
                                {selectedKit.preparationSteps.map((step, idx) => (
                                    <li key={idx} className="text-[9px] text-slate-400 flex gap-2 leading-relaxed">
                                        <span className="text-emerald-500/50 font-black">{idx + 1}.</span>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[7px] font-black text-slate-500 uppercase ml-1">AKTİVİTE ({unit})</label>
                            <input
                                type="number"
                                value={activity}
                                onChange={(e) => setActivity(e.target.value)}
                                placeholder="Örn: 100"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[7px] font-black text-slate-500 uppercase ml-1">HACİM (mL)</label>
                            <input
                                type="number"
                                value={volume}
                                onChange={(e) => setVolume(e.target.value)}
                                placeholder="Örn: 5"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[7px] font-black text-slate-500 uppercase ml-1">LOT / SERİ NO</label>
                        <input
                            type="text"
                            value={lotNumber}
                            onChange={(e) => setLotNumber(e.target.value)}
                            placeholder="İsteğe bağlı..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none"
                        />
                    </div>

                    <button
                        onClick={handlePrepare}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/20"
                    >
                        {selectedKit?.prepTimerMinutes ? 'HAZIRLAMAYI BAŞLAT (SAYAÇ)' : 'KİTİ HAZIRLA VE KAYDET'}
                    </button>
                </div>
            </div>
        </>
    );
};
