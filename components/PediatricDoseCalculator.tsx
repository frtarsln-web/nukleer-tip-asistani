import React, { useState, useMemo } from 'react';
import { DoseUnit } from '../types';

interface PediatricDoseCalculatorProps {
    unit: DoseUnit;
    onClose: () => void;
    onApplyDose?: (dose: number) => void;
}

// EANM Dosage Card coefficients for pediatric nuclear medicine
const EANM_PROCEDURES: Record<string, {
    name: string;
    minDose: number;   // MBq
    maxDose: number;   // MBq
    multiplier: number; // Activity per kg
}> = {
    'f18_fdg': {
        name: 'F-18 FDG PET/BT',
        minDose: 26,
        maxDose: 370,
        multiplier: 3.7 // MBq/kg
    },
    'ga68_psma': {
        name: 'Ga-68 PSMA PET/BT',
        minDose: 18,
        maxDose: 185,
        multiplier: 2.0
    },
    'ga68_dotatoc': {
        name: 'Ga-68 DOTATOC PET/BT',
        minDose: 18,
        maxDose: 185,
        multiplier: 2.0
    },
    'tc99m_dmsa': {
        name: 'Tc-99m DMSA Böbrek',
        minDose: 15,
        maxDose: 110,
        multiplier: 1.4
    },
    'tc99m_mag3': {
        name: 'Tc-99m MAG3 Renogram',
        minDose: 15,
        maxDose: 185,
        multiplier: 3.0
    },
    'tc99m_mdp': {
        name: 'Tc-99m MDP Kemik',
        minDose: 40,
        maxDose: 740,
        multiplier: 10.5
    },
    'tc99m_pertechnetate': {
        name: 'Tc-99m Tiroid',
        minDose: 10,
        maxDose: 80,
        multiplier: 1.0
    },
    'tc99m_mcg': {
        name: 'Tc-99m Meckel',
        minDose: 20,
        maxDose: 185,
        multiplier: 2.0
    },
    'i123_mibg': {
        name: 'I-123 MIBG',
        minDose: 37,
        maxDose: 370,
        multiplier: 5.2
    }
};

// BMI-based adjustment factors
const getBMIAdjustment = (bmi: number): { factor: number; label: string } => {
    if (bmi < 18.5) return { factor: 0.9, label: 'Düşük kilolu' };
    if (bmi < 25) return { factor: 1.0, label: 'Normal' };
    if (bmi < 30) return { factor: 1.1, label: 'Fazla kilolu' };
    return { factor: 1.2, label: 'Obez' };
};

// Convert MBq to mCi
const MBQtoMCi = (mbq: number) => mbq / 37;

export const PediatricDoseCalculator: React.FC<PediatricDoseCalculatorProps> = ({
    unit,
    onClose,
    onApplyDose
}) => {
    const [weight, setWeight] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [age, setAge] = useState<string>('');
    const [selectedProcedure, setSelectedProcedure] = useState<string>('f18_fdg');
    const [useEANM, setUseEANM] = useState(true);
    const [useBMIAdjust, setUseBMIAdjust] = useState(false);

    // Calculate BMI
    const bmi = useMemo(() => {
        const w = parseFloat(weight);
        const h = parseFloat(height) / 100; // cm to m
        if (w > 0 && h > 0) {
            return w / (h * h);
        }
        return 0;
    }, [weight, height]);

    // Calculate dose
    const calculatedDose = useMemo(() => {
        const w = parseFloat(weight);
        const procedure = EANM_PROCEDURES[selectedProcedure];

        if (!w || w <= 0 || !procedure) return null;

        // EANM formula: Activity = multiplier * weight
        let doseMBq = procedure.multiplier * w;

        // Apply min/max limits
        doseMBq = Math.max(procedure.minDose, Math.min(procedure.maxDose, doseMBq));

        // Apply BMI adjustment if enabled
        if (useBMIAdjust && bmi > 0) {
            const adjustment = getBMIAdjustment(bmi);
            doseMBq *= adjustment.factor;
        }

        return {
            mbq: doseMBq,
            mci: MBQtoMCi(doseMBq),
            procedure: procedure.name,
            min: procedure.minDose,
            max: procedure.maxDose
        };
    }, [weight, selectedProcedure, useBMIAdjust, bmi]);

    const bmiInfo = bmi > 0 ? getBMIAdjustment(bmi) : null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-xl overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                            <span className="text-xl">👶</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Pediatrik Doz Hesaplama</h2>
                            <p className="text-xs text-slate-500">EANM Pediatrik Doz Kartı</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Procedure Selection */}
                    <div>
                        <label className="text-xs text-slate-400 block mb-2">Prosedür</label>
                        <select
                            value={selectedProcedure}
                            onChange={(e) => setSelectedProcedure(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                        >
                            {Object.entries(EANM_PROCEDURES).map(([key, proc]) => (
                                <option key={key} value={key}>{proc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Patient Info */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-slate-400 block mb-2">Ağırlık (kg) *</label>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="25"
                                min="1"
                                max="200"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-2">Boy (cm)</label>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                placeholder="120"
                                min="30"
                                max="250"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-2">Yaş</label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="8"
                                min="0"
                                max="18"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                            />
                        </div>
                    </div>

                    {/* BMI Display */}
                    {bmi > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                            <span className="text-xs text-slate-400">BMI:</span>
                            <span className="text-sm font-bold text-white">{bmi.toFixed(1)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${bmiInfo?.label === 'Normal' ? 'bg-emerald-500/20 text-emerald-400' :
                                    bmiInfo?.label === 'Düşük kilolu' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-amber-500/20 text-amber-400'
                                }`}>
                                {bmiInfo?.label}
                            </span>
                            <label className="ml-auto flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useBMIAdjust}
                                    onChange={(e) => setUseBMIAdjust(e.target.checked)}
                                    className="rounded bg-slate-700 border-slate-600 text-rose-500"
                                />
                                <span className="text-xs text-slate-400">BMI düzeltmesi uygula</span>
                            </label>
                        </div>
                    )}

                    {/* Result */}
                    {calculatedDose && (
                        <div className="bg-gradient-to-br from-rose-900/30 to-pink-900/30 border border-rose-500/20 rounded-xl p-5">
                            <div className="text-center">
                                <p className="text-xs text-slate-400 mb-1">Önerilen Doz</p>
                                <p className="text-4xl font-black text-white">
                                    {unit === DoseUnit.MCI
                                        ? calculatedDose.mci.toFixed(2)
                                        : calculatedDose.mbq.toFixed(0)}
                                    <span className="text-lg text-rose-400 ml-2">{unit}</span>
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    Min: {unit === DoseUnit.MCI ? MBQtoMCi(calculatedDose.min).toFixed(1) : calculatedDose.min} -
                                    Max: {unit === DoseUnit.MCI ? MBQtoMCi(calculatedDose.max).toFixed(1) : calculatedDose.max} {unit}
                                </p>
                            </div>

                            {onApplyDose && (
                                <button
                                    onClick={() => onApplyDose(unit === DoseUnit.MCI ? calculatedDose.mci : calculatedDose.mbq)}
                                    className="w-full mt-4 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all"
                                >
                                    Bu Dozu Uygula
                                </button>
                            )}
                        </div>
                    )}

                    {/* EANM Info */}
                    <div className="text-[10px] text-slate-500 text-center">
                        ℹ️ EANM Pediatrik Doz Kartı (2016) referans alınmıştır.
                        Klinik değerlendirme daima önceliklidir.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PediatricDoseCalculator;
