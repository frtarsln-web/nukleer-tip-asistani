import React, { useState, useMemo } from 'react';
import { Isotope, DoseUnit } from '../types';
import { ISOTOPES } from '../constants';

interface PharmacoKineticsProps {
    onClose: () => void;
    selectedIsotope: Isotope;
    unit: DoseUnit;
}

type CalculatorTab = 'decay' | 'pediatric' | 'bsa' | 'effective' | 'wait-time';

const translations = {
    tr: {
        title: 'Farmakokinetik Hesaplayıcı',
        subtitle: 'Doz ve bozunum hesaplamaları',
        decay: 'Bozunum',
        pediatric: 'Pediatrik',
        bsa: 'BSA',
        effectiveDose: 'Efektif Doz',
        waitTime: 'Bekleme',
        decayCalc: 'Radyoaktif Bozunum Hesaplayıcı',
        decayDesc: 'Belirli bir süre sonra kalan aktiviteyi hesaplayın.',
        isotope: 'İzotop',
        initialDose: 'Başlangıç Dozu',
        elapsedTime: 'Geçen Süre (saat)',
        remainingActivity: 'Kalan Aktivite',
        decayedPercent: 'sonunda bozunmuş olacak',
        pediatricCalc: 'Pediatrik Doz Hesaplayıcı',
        pediatricDesc: 'Çocuk hastalar için doz hesaplaması yapın.',
        calcMethod: 'Hesaplama Yöntemi',
        weightBased: 'Ağırlık bazlı',
        ageBased: 'Yaş bazlı',
        bodySurface: 'Vücut yüzeyi',
        adultDose: 'Yetişkin Dozu',
        weight: 'Ağırlık (kg)',
        age: 'Yaş (yıl)',
        height: 'Boy (cm)',
        recommendedPedDose: 'Önerilen Pediatrik Doz',
        clarkRule: "Clark kuralı: (Ağırlık/70) × Yetişkin Doz",
        youngRule: "Young kuralı: (Yaş/(Yaş+12)) × Yetişkin Doz",
        bsaMethod: "BSA yöntemi: (BSA/1.73) × Yetişkin Doz",
        warning: 'Bu değerler yalnızca yol göstericidir. Klinik karar her zaman uzman değerlendirmesine dayanmalıdır.',
        bsaCalc: 'Vücut Yüzey Alanı (BSA) Hesaplayıcı',
        bsaDesc: 'Mosteller formülü ile BSA hesaplayın.',
        bodySurfaceArea: 'Vücut Yüzey Alanı',
        mosteller: 'Mosteller: BSA = √((boy × ağırlık) / 3600)',
        effectiveCalc: 'Efektif Doz Tahmini',
        effectiveDesc: 'Radyofarmasötiğin efektif dozunu hesaplayın (yaklaşık değerler).',
        appliedDose: 'Uygulanan Doz',
        estimatedEffective: 'Tahmini Efektif Doz',
        doseCoeff: 'Doz katsayısı',
        icrpNote: 'Bu değerler ICRP yayınlarına dayalı yaklaşık değerlerdir.',
        waitTimeCalc: 'Bekleme Süresi Hesaplayıcı',
        waitTimeDesc: 'Belirli bir aktiviteye ulaşmak için gereken bekleme süresini hesaplayın.',
        currentDose: 'Mevcut Doz',
        targetDose: 'Hedef Doz',
        currentActivity: 'Şu anki aktivite',
        desiredActivity: 'İstenen aktivite',
        requiredWaitTime: 'Gereken Bekleme Süresi',
        alreadyBelow: 'Mevcut doz zaten hedefin altında veya eşit!',
        minutes: 'dakika',
        hours: 'saat',
        days: 'gün',
    },
    en: {
        title: 'Pharmacokinetics Calculator',
        subtitle: 'Dose and decay calculations',
        decay: 'Decay',
        pediatric: 'Pediatric',
        bsa: 'BSA',
        effectiveDose: 'Eff. Dose',
        waitTime: 'Wait Time',
        decayCalc: 'Radioactive Decay Calculator',
        decayDesc: 'Calculate remaining activity after a specific time.',
        isotope: 'Isotope',
        initialDose: 'Initial Dose',
        elapsedTime: 'Elapsed Time (hours)',
        remainingActivity: 'Remaining Activity',
        decayedPercent: 'will be decayed',
        pediatricCalc: 'Pediatric Dose Calculator',
        pediatricDesc: 'Calculate dose for pediatric patients.',
        calcMethod: 'Calculation Method',
        weightBased: 'Weight-based',
        ageBased: 'Age-based',
        bodySurface: 'Body surface',
        adultDose: 'Adult Dose',
        weight: 'Weight (kg)',
        age: 'Age (years)',
        height: 'Height (cm)',
        recommendedPedDose: 'Recommended Pediatric Dose',
        clarkRule: "Clark's rule: (Weight/70) × Adult Dose",
        youngRule: "Young's rule: (Age/(Age+12)) × Adult Dose",
        bsaMethod: "BSA method: (BSA/1.73) × Adult Dose",
        warning: 'These values are for guidance only. Clinical decisions should always be based on expert evaluation.',
        bsaCalc: 'Body Surface Area (BSA) Calculator',
        bsaDesc: 'Calculate BSA using Mosteller formula.',
        bodySurfaceArea: 'Body Surface Area',
        mosteller: 'Mosteller: BSA = √((height × weight) / 3600)',
        effectiveCalc: 'Effective Dose Estimation',
        effectiveDesc: 'Estimate the effective dose of the radiopharmaceutical (approximate values).',
        appliedDose: 'Applied Dose',
        estimatedEffective: 'Estimated Effective Dose',
        doseCoeff: 'Dose coefficient',
        icrpNote: 'These values are approximations based on ICRP publications.',
        waitTimeCalc: 'Wait Time Calculator',
        waitTimeDesc: 'Calculate the required wait time to reach a specific activity.',
        currentDose: 'Current Dose',
        targetDose: 'Target Dose',
        currentActivity: 'Current activity',
        desiredActivity: 'Desired activity',
        requiredWaitTime: 'Required Wait Time',
        alreadyBelow: 'Current dose is already at or below target!',
        minutes: 'minutes',
        hours: 'hours',
        days: 'days',
    },
};

const calculateBSA = (weightKg: number, heightCm: number): number => {
    return Math.sqrt((heightCm * weightKg) / 3600);
};

const calculateDecayedDose = (initialDose: number, halfLifeHours: number, elapsedHours: number): number => {
    return initialDose * Math.pow(0.5, elapsedHours / halfLifeHours);
};

const calculateWaitTime = (currentDose: number, targetDose: number, halfLifeHours: number): number => {
    if (currentDose <= targetDose) return 0;
    return halfLifeHours * Math.log2(currentDose / targetDose);
};

export const PharmacoKinetics: React.FC<PharmacoKineticsProps> = ({
    onClose,
    selectedIsotope,
    unit,
}) => {
    const lang = useMemo(() => {
        try {
            const settings = localStorage.getItem('nt_app_settings');
            if (settings) return JSON.parse(settings).language || 'tr';
        } catch { }
        return 'tr';
    }, []);

    const t = translations[lang as 'tr' | 'en'];
    const [activeTab, setActiveTab] = useState<CalculatorTab>('decay');

    const [decayDose, setDecayDose] = useState<string>('10');
    const [decayTime, setDecayTime] = useState<string>('2');
    const [decayIsotope, setDecayIsotope] = useState<string>(selectedIsotope.id);

    const [adultDose, setAdultDose] = useState<string>('10');
    const [childWeight, setChildWeight] = useState<string>('');
    const [childAge, setChildAge] = useState<string>('');
    const [childHeight, setChildHeight] = useState<string>('');
    const [pedMethod, setPedMethod] = useState<'clark' | 'young' | 'bsa'>('clark');

    const [bsaWeight, setBsaWeight] = useState<string>('');
    const [bsaHeight, setBsaHeight] = useState<string>('');

    const [effDose, setEffDose] = useState<string>('10');
    const [effIsotope, setEffIsotope] = useState<string>(selectedIsotope.id);

    const [waitCurrentDose, setWaitCurrentDose] = useState<string>('');
    const [waitTargetDose, setWaitTargetDose] = useState<string>('');
    const [waitIsotope, setWaitIsotope] = useState<string>(selectedIsotope.id);

    const selectedDecayIsotope = ISOTOPES.find(i => i.id === decayIsotope) || selectedIsotope;
    const selectedWaitIsotope = ISOTOPES.find(i => i.id === waitIsotope) || selectedIsotope;

    const effectiveDoseCoeffs: Record<string, number> = {
        'f18': 0.019, 'tc99m': 0.0075, 'ga68': 0.025, 'i131': 0.089, 'lu177': 0.028,
    };

    const decayResult = useMemo(() => {
        const dose = parseFloat(decayDose);
        const time = parseFloat(decayTime);
        if (isNaN(dose) || isNaN(time) || time < 0) return null;
        return calculateDecayedDose(dose, selectedDecayIsotope.halfLifeHours, time);
    }, [decayDose, decayTime, selectedDecayIsotope]);

    const pediatricResult = useMemo(() => {
        const adult = parseFloat(adultDose);
        const weight = parseFloat(childWeight);
        const age = parseFloat(childAge);
        const height = parseFloat(childHeight);
        if (isNaN(adult)) return null;
        switch (pedMethod) {
            case 'clark': return isNaN(weight) ? null : (weight / 70) * adult;
            case 'young': return isNaN(age) ? null : (age / (age + 12)) * adult;
            case 'bsa': return (isNaN(weight) || isNaN(height)) ? null : (calculateBSA(weight, height) / 1.73) * adult;
            default: return null;
        }
    }, [adultDose, childWeight, childAge, childHeight, pedMethod]);

    const bsaResult = useMemo(() => {
        const weight = parseFloat(bsaWeight);
        const height = parseFloat(bsaHeight);
        if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) return null;
        return calculateBSA(weight, height);
    }, [bsaWeight, bsaHeight]);

    const effectiveDoseResult = useMemo(() => {
        const dose = parseFloat(effDose);
        if (isNaN(dose)) return null;
        const coeff = effectiveDoseCoeffs[effIsotope] || 0.01;
        const doseInMBq = unit === DoseUnit.MCI ? dose * 37 : dose;
        return doseInMBq * coeff;
    }, [effDose, effIsotope, unit]);

    const waitTimeResult = useMemo(() => {
        const current = parseFloat(waitCurrentDose);
        const target = parseFloat(waitTargetDose);
        if (isNaN(current) || isNaN(target) || current <= 0 || target <= 0) return null;
        return calculateWaitTime(current, target, selectedWaitIsotope.halfLifeHours);
    }, [waitCurrentDose, waitTargetDose, selectedWaitIsotope]);

    const formatTime = (hours: number): string => {
        if (hours < 1) return `${Math.round(hours * 60)} ${t.minutes}`;
        if (hours < 24) {
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            return m > 0 ? `${h} ${t.hours} ${m} min` : `${h} ${t.hours}`;
        }
        const d = Math.floor(hours / 24);
        const h = Math.round(hours % 24);
        return h > 0 ? `${d} ${t.days} ${h} ${t.hours}` : `${d} ${t.days}`;
    };

    const tabs: { id: CalculatorTab; label: string; icon: string }[] = [
        { id: 'decay', label: t.decay, icon: '⏱️' },
        { id: 'pediatric', label: t.pediatric, icon: '👶' },
        { id: 'bsa', label: t.bsa, icon: '📐' },
        { id: 'effective', label: t.effectiveDose, icon: '☢️' },
        { id: 'wait-time', label: t.waitTime, icon: '⏳' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden border border-slate-700">
                <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">💊</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t.title}</h2>
                            <p className="text-rose-200 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex h-[calc(95vh-100px)]">
                    <div className="w-40 bg-slate-800/50 border-r border-slate-700 p-3">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg mb-1 transition-all text-sm ${activeTab === tab.id ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700/50'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'decay' && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">⏱️ {t.decayCalc}</h3>
                                <p className="text-slate-400 text-sm mb-6">{t.decayDesc}</p>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.isotope}</label>
                                        <select value={decayIsotope} onChange={e => setDecayIsotope(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none">
                                            {ISOTOPES.map(iso => (<option key={iso.id} value={iso.id}>{iso.symbol} {iso.name} (t½ = {iso.halfLifeHours.toFixed(2)} h)</option>))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-slate-300 mb-1">{t.initialDose} ({unit})</label>
                                            <input type="number" value={decayDose} onChange={e => setDecayDose(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-300 mb-1">{t.elapsedTime}</label>
                                            <input type="number" value={decayTime} onChange={e => setDecayTime(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" />
                                        </div>
                                    </div>
                                </div>
                                {decayResult !== null && (
                                    <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-xl p-6 border border-rose-500/30">
                                        <p className="text-slate-300 text-sm mb-2">{t.remainingActivity}:</p>
                                        <p className="text-4xl font-bold text-white">{decayResult.toFixed(2)} <span className="text-xl text-rose-300">{unit}</span></p>
                                        <p className="text-slate-400 text-sm mt-2">{parseFloat(decayTime)}h → {((1 - decayResult / parseFloat(decayDose)) * 100).toFixed(1)}% {t.decayedPercent}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'pediatric' && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">👶 {t.pediatricCalc}</h3>
                                <p className="text-slate-400 text-sm mb-6">{t.pediatricDesc}</p>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.calcMethod}</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[{ value: 'clark', label: "Clark's", desc: t.weightBased }, { value: 'young', label: "Young's", desc: t.ageBased }, { value: 'bsa', label: 'BSA', desc: t.bodySurface }].map(m => (
                                                <button key={m.value} onClick={() => setPedMethod(m.value as any)} className={`px-3 py-2 rounded-lg text-sm transition-all ${pedMethod === m.value ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                                    <span className="font-medium">{m.label}</span>
                                                    <p className="text-xs opacity-70">{m.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.adultDose} ({unit})</label>
                                        <input type="number" value={adultDose} onChange={e => setAdultDose(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm text-slate-300 mb-1">{t.weight} {pedMethod !== 'young' && '*'}</label>
                                            <input type="number" value={childWeight} onChange={e => setChildWeight(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" placeholder="kg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-300 mb-1">{t.age} {pedMethod === 'young' && '*'}</label>
                                            <input type="number" value={childAge} onChange={e => setChildAge(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" placeholder={lang === 'en' ? 'years' : 'yıl'} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-300 mb-1">{t.height} {pedMethod === 'bsa' && '*'}</label>
                                            <input type="number" value={childHeight} onChange={e => setChildHeight(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" placeholder="cm" />
                                        </div>
                                    </div>
                                </div>
                                {pediatricResult !== null && (
                                    <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-xl p-6 border border-rose-500/30">
                                        <p className="text-slate-300 text-sm mb-2">{t.recommendedPedDose}:</p>
                                        <p className="text-4xl font-bold text-white">{pediatricResult.toFixed(2)} <span className="text-xl text-rose-300">{unit}</span></p>
                                        <p className="text-slate-400 text-sm mt-2">{pedMethod === 'clark' ? t.clarkRule : pedMethod === 'young' ? t.youngRule : t.bsaMethod}</p>
                                    </div>
                                )}
                                <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                                    <p className="text-amber-300 text-sm">⚠️ {t.warning}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'bsa' && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">📐 {t.bsaCalc}</h3>
                                <p className="text-slate-400 text-sm mb-6">{t.bsaDesc}</p>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.weight}</label>
                                        <input type="number" value={bsaWeight} onChange={e => setBsaWeight(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" placeholder="70" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.height}</label>
                                        <input type="number" value={bsaHeight} onChange={e => setBsaHeight(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" placeholder="170" />
                                    </div>
                                </div>
                                {bsaResult !== null && (
                                    <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-xl p-6 border border-rose-500/30">
                                        <p className="text-slate-300 text-sm mb-2">{t.bodySurfaceArea}:</p>
                                        <p className="text-4xl font-bold text-white">{bsaResult.toFixed(2)} <span className="text-xl text-rose-300">m²</span></p>
                                        <p className="text-slate-400 text-sm mt-2">{t.mosteller}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'effective' && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">☢️ {t.effectiveCalc}</h3>
                                <p className="text-slate-400 text-sm mb-6">{t.effectiveDesc}</p>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.isotope}</label>
                                        <select value={effIsotope} onChange={e => setEffIsotope(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none">
                                            {ISOTOPES.map(iso => (<option key={iso.id} value={iso.id}>{iso.symbol} {iso.name}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.appliedDose} ({unit})</label>
                                        <input type="number" value={effDose} onChange={e => setEffDose(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" />
                                    </div>
                                </div>
                                {effectiveDoseResult !== null && (
                                    <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-xl p-6 border border-rose-500/30">
                                        <p className="text-slate-300 text-sm mb-2">{t.estimatedEffective}:</p>
                                        <p className="text-4xl font-bold text-white">{effectiveDoseResult.toFixed(2)} <span className="text-xl text-rose-300">mSv</span></p>
                                        <p className="text-slate-400 text-sm mt-2">{t.doseCoeff}: {(effectiveDoseCoeffs[effIsotope] || 0.01).toFixed(4)} mSv/MBq</p>
                                    </div>
                                )}
                                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                    <p className="text-blue-300 text-sm">ℹ️ {t.icrpNote}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'wait-time' && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">⏳ {t.waitTimeCalc}</h3>
                                <p className="text-slate-400 text-sm mb-6">{t.waitTimeDesc}</p>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.isotope}</label>
                                        <select value={waitIsotope} onChange={e => setWaitIsotope(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none">
                                            {ISOTOPES.map(iso => (<option key={iso.id} value={iso.id}>{iso.symbol} {iso.name} (t½ = {iso.halfLifeHours.toFixed(2)} h)</option>))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-slate-300 mb-1">{t.currentDose} ({unit})</label>
                                            <input type="number" value={waitCurrentDose} onChange={e => setWaitCurrentDose(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" placeholder={t.currentActivity} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-300 mb-1">{t.targetDose} ({unit})</label>
                                            <input type="number" value={waitTargetDose} onChange={e => setWaitTargetDose(e.target.value)} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-rose-500 outline-none" placeholder={t.desiredActivity} />
                                        </div>
                                    </div>
                                </div>
                                {waitTimeResult !== null && waitTimeResult > 0 && (
                                    <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-xl p-6 border border-rose-500/30">
                                        <p className="text-slate-300 text-sm mb-2">{t.requiredWaitTime}:</p>
                                        <p className="text-4xl font-bold text-white">{formatTime(waitTimeResult)}</p>
                                        <p className="text-slate-400 text-sm mt-2">{parseFloat(waitCurrentDose)} {unit} → {parseFloat(waitTargetDose)} {unit}</p>
                                    </div>
                                )}
                                {waitTimeResult !== null && waitTimeResult <= 0 && (
                                    <div className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/30">
                                        <p className="text-emerald-300">✓ {t.alreadyBelow}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
