import React from 'react';
import { DoseUnit, Isotope, PendingPatient } from '../types';
import { RegionHighlight } from './RegionHighlight';

interface DoseDispenserProps {
    historyCount: number;
    pendingPatients: PendingPatient[];
    patientName: string;
    setPatientName: (val: string) => void;
    patientWeight: string;
    setPatientWeight: (val: string) => void;
    doseRatio: number;
    setDoseRatio: (val: number) => void;
    selectedProcedure: string;
    setSelectedProcedure: (val: string) => void;
    drawAmount: number;
    setDrawAmount: (val: number) => void;
    selectedIsotope: Isotope;
    unit: DoseUnit;
    recommendedDose: number;
    requiredVolume: number;
    currentConcentration: number;
    currentTotalActivity: number;
    onSelectPendingPatient: (patient: PendingPatient) => void;
    onWithdrawDose: (patientId?: string) => void;
    now: Date;
    readOnly?: boolean;
}

export const DoseDispenser: React.FC<DoseDispenserProps> = ({
    historyCount,
    pendingPatients,
    patientName,
    setPatientName,
    patientWeight,
    setPatientWeight,
    doseRatio,
    setDoseRatio,
    selectedProcedure,
    setSelectedProcedure,
    drawAmount,
    setDrawAmount,
    selectedIsotope,
    unit,
    recommendedDose,
    requiredVolume,
    currentConcentration,
    currentTotalActivity,
    onSelectPendingPatient,
    onWithdrawDose,
    now,
    readOnly
}) => {
    const [showProtocol, setShowProtocol] = React.useState(false);
    const selectedPatient = pendingPatients.find(p => p.name === patientName);

    return (
        <section className="bg-gradient-to-b from-slate-900/60 to-slate-900/20 backdrop-blur-3xl rounded-[2.5rem] p-7 border border-white/5 shadow-2xl space-y-5 text-left">
            <div className="flex justify-between items-center text-left">
                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                    Enjektör Hazırlama
                </h3>
                <span className="bg-emerald-600/10 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-lg border border-emerald-500/20">#{historyCount + 1}</span>
            </div>

            <div className="space-y-4 text-left">
                {pendingPatients.length > 0 && (
                    <div className="bg-blue-950/40 border border-blue-500/20 rounded-2xl p-4 space-y-3 -mx-2 mb-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                BEKLEYEN HASTALAR
                            </label>
                            <span className="text-[9px] font-black text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-lg">
                                {pendingPatients.length} Hasta
                            </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {pendingPatients.map(p => {
                                const isEkCekim = !!p.additionalInfo;
                                let countdownText = "";
                                if (isEkCekim && p.additionalInfo?.requestedAt) {
                                    const waitMs = (p.additionalInfo.scheduledMinutes || 60) * 60000;
                                    const diffMs = (new Date(p.additionalInfo.requestedAt).getTime() + waitMs) - now.getTime();
                                    if (diffMs > 0) {
                                        const mins = Math.floor(diffMs / 60000);
                                        countdownText = `${mins}dk`;
                                    } else {
                                        countdownText = "OK";
                                    }
                                }

                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => onSelectPendingPatient(p)}
                                        className={`flex-shrink-0 px-4 py-3 rounded-[1.5rem] border text-[10px] font-black transition-all flex flex-col gap-1 items-start min-w-[124px] ${patientName === p.name
                                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40'
                                            : isEkCekim
                                                ? 'bg-orange-500/5 border-orange-500/20 text-orange-200 hover:bg-orange-500/10'
                                                : 'bg-black/40 border-white/5 text-slate-400 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex justify-between w-full gap-2 text-left">
                                            <div className="flex flex-col items-start truncate text-left">
                                                <div className="flex items-center gap-1 text-left">
                                                    <span className="truncate">{p.name}</span>
                                                    {isEkCekim && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>}
                                                </div>
                                                {p.protocolNo && <span className="text-[7px] font-black tabular-nums opacity-60">P:{p.protocolNo}</span>}
                                            </div>
                                            {isEkCekim ? (
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${countdownText === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                    {countdownText}
                                                </span>
                                            ) : p.appointmentTime && (
                                                <span className="opacity-60 text-[8px] font-mono">{p.appointmentTime}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between w-full items-center text-left">
                                            <span className="text-[7px] uppercase tracking-widest opacity-40 truncate max-w-[60px]">{isEkCekim ? p.additionalInfo?.region : (p.procedure || 'PET/BT')}</span>
                                            {p.appointmentDate && !isEkCekim && <span className="text-[7px] opacity-40">{p.appointmentDate}</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}


                <div className="space-y-1 text-left">
                    <label className="text-[7px] font-black text-slate-500 uppercase ml-1">HASTA BİLGİSİ</label>
                    <input
                        type="text"
                        placeholder="Hasta İsmi..."
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500/30 text-left"
                    />
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-3 text-left">
                    <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="space-y-1 text-left">
                            <label className="text-[7px] font-black text-slate-500 uppercase ml-1 italic">HASTA KİLOSU (kg)</label>
                            <input
                                type="number"
                                placeholder="Örn: 80"
                                value={patientWeight}
                                onChange={(e) => setPatientWeight(e.target.value)}
                                className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-sm font-black text-white outline-none focus:ring-emerald-500/30 text-left"
                            />
                        </div>
                        <div className="space-y-1 text-left">
                            <label className="text-[7px] font-black text-slate-500 uppercase ml-1 italic">ORAN ({unit}/kg)</label>
                            <input
                                type="number"
                                step="0.001"
                                value={doseRatio}
                                onChange={(e) => setDoseRatio(parseFloat(e.target.value))}
                                className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-sm font-black text-white outline-none text-left"
                            />
                        </div>
                    </div>

                    {recommendedDose > 0 && (
                        <div className="flex justify-between items-center pt-1 animate-in fade-in slide-in-from-top-2 text-left">
                            <div className="flex flex-col text-left">
                                <span className="text-[8px] font-black text-slate-500 uppercase">HESAPLANAN ÖNERİ ({patientWeight}kg × {doseRatio})</span>
                                <span className="text-xs font-black text-emerald-400 text-left">
                                    {recommendedDose.toFixed(2)} {unit}
                                </span>
                            </div>
                            {!readOnly && (
                                <button
                                    onClick={() => setDrawAmount(parseFloat(recommendedDose.toFixed(2)))}
                                    className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-[8px] font-black px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all active:scale-95"
                                >
                                    ÖNERİYİ UYGULA
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {selectedPatient?.additionalInfo && (
                    <div className="mb-4 animate-in fade-in zoom-in duration-500 max-w-[120px] mx-auto text-left">
                        <RegionHighlight region={selectedPatient.additionalInfo.region} />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 mb-1 text-left">
                            <label className="text-[7px] font-black text-slate-500 uppercase ml-1">PROSEDÜR</label>
                            {selectedIsotope.imagingProtocols?.[selectedProcedure] && (
                                <button
                                    onClick={() => setShowProtocol(!showProtocol)}
                                    title="Çekim Protokolü"
                                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${showProtocol ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'}`}
                                >
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                            )}
                        </div>
                        <select
                            value={selectedProcedure}
                            onChange={(e) => setSelectedProcedure(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-[10px] font-black text-white outline-none appearance-none text-left"
                        >
                            {selectedIsotope.commonProcedures.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1 text-left">
                        <label className="text-[7px] font-black text-slate-500 uppercase ml-1">ÇEKİLECEK DOZ</label>
                        <div className="relative text-left">
                            <input
                                type="number"
                                step="0.1"
                                value={drawAmount}
                                onChange={(e) => setDrawAmount(Number(e.target.value))}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none text-left"
                            />
                            <span className="absolute right-3 top-3.5 text-[8px] font-black text-slate-600 uppercase tracking-tighter">{unit}</span>
                        </div>
                    </div>
                </div>

                {showProtocol && selectedIsotope.imagingProtocols?.[selectedProcedure] && (
                    <div className="bg-blue-900/40 border border-blue-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-top-4 duration-300 text-left">
                        <div className="flex items-center gap-2 mb-2 text-left">
                            <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">ÇEKİM PROTOKOLÜ / İPUCU</span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-200 leading-relaxed italic text-left">
                            "{selectedIsotope.imagingProtocols[selectedProcedure]}"
                        </p>
                    </div>
                )}

                {requiredVolume > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex justify-between items-center animate-in fade-in zoom-in-95">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">ÇEKİLMESİ GEREKEN HACİM</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-xl font-black text-white tabular-nums">{requiredVolume.toFixed(2)}</span>
                                <span className="text-[10px] font-black text-blue-400 uppercase">mL</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[7px] font-bold text-slate-500 uppercase block leading-none">Konsantrasyon</span>
                            <span className="text-[9px] font-black text-slate-300">{(currentConcentration).toFixed(2)} {unit}/mL</span>
                        </div>
                    </div>
                )}

                {!readOnly && (
                    <button
                        onClick={() => onWithdrawDose(selectedPatient?.id)}
                        disabled={selectedPatient?.additionalInfo?.doseNeeded === false ? false : (drawAmount > currentTotalActivity || drawAmount <= 0)}
                        className={`w-full py-4 rounded-3xl font-black text-xs tracking-widest uppercase transition-all active:scale-[0.97] ${selectedPatient?.additionalInfo?.doseNeeded === false
                            ? 'bg-orange-500 text-white shadow-xl hover:brightness-110'
                            : (drawAmount > currentTotalActivity || drawAmount <= 0)
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : `${selectedIsotope.color} text-white shadow-xl hover:brightness-110`
                            }`}
                    >
                        {selectedPatient?.additionalInfo?.doseNeeded === false ? 'ÇEKİMİ TAMAMLA' : 'DOZU ÇEK VE KAYDET'}
                    </button>
                )}
            </div>
        </section>
    );
};
