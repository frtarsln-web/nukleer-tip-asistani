import React, { useState, useMemo } from 'react';
import {
    CLINICAL_PROTOCOLS,
    PROTOCOL_CATEGORIES,
    ClinicalProtocol,
    ProtocolCategory,
    calculateDose,
    calculatePediatricDose
} from '../data/clinicalProtocols';

interface ClinicalProtocolsProps {
    onClose: () => void;
    onApplyProtocol?: (protocol: ClinicalProtocol, calculatedDose?: number) => void;
    patientWeight?: number;
    unit: 'mCi' | 'MBq';
}

export const ClinicalProtocols: React.FC<ClinicalProtocolsProps> = ({
    onClose,
    onApplyProtocol,
    patientWeight,
    unit
}) => {
    const [selectedCategory, setSelectedCategory] = useState<ProtocolCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProtocol, setSelectedProtocol] = useState<ClinicalProtocol | null>(null);
    const [customWeight, setCustomWeight] = useState(patientWeight || 70);

    // Filtrelenmiş protokoller
    const filteredProtocols = useMemo(() => {
        return CLINICAL_PROTOCOLS.filter(protocol => {
            const matchesCategory = selectedCategory === 'all' || protocol.category === selectedCategory;
            const matchesSearch = searchQuery === '' ||
                protocol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                protocol.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                protocol.clinicalIndications.some(ind => ind.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    // Doz hesaplama
    const calculatedDose = useMemo(() => {
        if (!selectedProtocol) return null;

        if (selectedProtocol.category === 'pediatric') {
            return {
                min: calculatePediatricDose(customWeight, 25.9),
                max: calculatePediatricDose(customWeight, 25.9),
                recommended: calculatePediatricDose(customWeight, 25.9)
            };
        }

        return calculateDose(customWeight, selectedProtocol);
    }, [selectedProtocol, customWeight]);

    // MBq to mCi conversion
    const convertDose = (mbq: number) => {
        return unit === 'mCi' ? (mbq / 37).toFixed(2) : mbq.toFixed(0);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                                📋
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">Klinik Protokoller</h2>
                                <p className="text-sm text-slate-400">PET/CT Çekim Protokol Kütüphanesi</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Kategori Filtreleri */}
                    <div className="flex flex-wrap gap-2 mt-6">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === 'all'
                                    ? 'bg-white text-slate-900'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                        >
                            Tümü ({CLINICAL_PROTOCOLS.length})
                        </button>
                        {(Object.entries(PROTOCOL_CATEGORIES) as [ProtocolCategory, { name: string; icon: string; color: string }][]).map(([key, cat]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedCategory === key
                                        ? `bg-${cat.color}-500 text-white`
                                        : `bg-${cat.color}-500/10 text-${cat.color}-400 hover:bg-${cat.color}-500/20`
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                {cat.name}
                                <span className="opacity-60">({CLINICAL_PROTOCOLS.filter(p => p.category === key).length})</span>
                            </button>
                        ))}
                    </div>

                    {/* Arama */}
                    <div className="mt-4 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Protokol veya endikasyon ara..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Protocol List */}
                    <div className={`${selectedProtocol ? 'w-1/2' : 'w-full'} overflow-y-auto p-6 border-r border-white/5 transition-all`}>
                        <div className="grid grid-cols-1 gap-3">
                            {filteredProtocols.map(protocol => {
                                const cat = PROTOCOL_CATEGORIES[protocol.category];
                                return (
                                    <button
                                        key={protocol.id}
                                        onClick={() => setSelectedProtocol(protocol)}
                                        className={`text-left p-4 rounded-2xl border transition-all hover:scale-[1.01] ${selectedProtocol?.id === protocol.id
                                                ? `bg-${cat.color}-500/20 border-${cat.color}-500/50 ring-2 ring-${cat.color}-500/30`
                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-${cat.color}-500/20 flex items-center justify-center text-2xl flex-shrink-0`}>
                                                {protocol.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-bold text-white truncate">{protocol.name}</h3>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold bg-${cat.color}-500/20 text-${cat.color}-400`}>
                                                        {cat.name}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{protocol.nameEn}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] text-white/60">
                                                        💉 {protocol.radiopharmaceutical}
                                                    </span>
                                                    <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] text-white/60">
                                                        ⏱️ {protocol.uptakeTime.min}-{protocol.uptakeTime.max} dk uptake
                                                    </span>
                                                    <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] text-white/60">
                                                        🍽️ {protocol.fastingHours} saat açlık
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {filteredProtocols.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-4xl mb-4">🔍</p>
                                    <p className="text-slate-500">Protokol bulunamadı</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Protocol Detail */}
                    {selectedProtocol && (
                        <div className="w-1/2 overflow-y-auto p-6">
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-start gap-4">
                                    <div className={`w-16 h-16 rounded-2xl bg-${PROTOCOL_CATEGORIES[selectedProtocol.category].color}-500/20 flex items-center justify-center text-3xl shadow-lg`}>
                                        {selectedProtocol.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-white">{selectedProtocol.name}</h3>
                                        <p className="text-sm text-slate-400">{selectedProtocol.nameEn}</p>
                                        {selectedProtocol.subcategory && (
                                            <span className="inline-block mt-2 px-3 py-1 bg-white/10 rounded-lg text-xs text-white/70">
                                                {selectedProtocol.subcategory}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Doz Hesaplama */}
                                <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-2xl p-5 border border-indigo-500/30">
                                    <h4 className="text-sm font-bold text-indigo-400 mb-4 flex items-center gap-2">
                                        💊 Doz Hesaplama
                                    </h4>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-white/60 block mb-1">Hasta Ağırlığı (kg)</label>
                                            <input
                                                type="number"
                                                value={customWeight}
                                                onChange={(e) => setCustomWeight(Number(e.target.value))}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-lg focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-white/60 block mb-1">Doz Aralığı ({unit})</label>
                                            <p className="text-lg font-bold text-white">
                                                {convertDose(selectedProtocol.dosePerKg.min)} - {convertDose(selectedProtocol.dosePerKg.max)} {unit}/kg
                                            </p>
                                        </div>
                                    </div>

                                    {calculatedDose && (
                                        <div className="bg-black/20 rounded-xl p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-white/60">Hesaplanan Doz</p>
                                                <p className="text-2xl font-black text-indigo-400">
                                                    {convertDose(calculatedDose.recommended)} {unit}
                                                </p>
                                                <p className="text-xs text-white/40">
                                                    ({convertDose(calculatedDose.min)} - {convertDose(calculatedDose.max)} {unit} aralığı)
                                                </p>
                                            </div>
                                            {onApplyProtocol && (
                                                <button
                                                    onClick={() => onApplyProtocol(selectedProtocol, calculatedDose.recommended)}
                                                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold transition-all active:scale-95"
                                                >
                                                    Uygula
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Hasta Hazırlık */}
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                                    <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                                        ⚠️ Hasta Hazırlık
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">🍽️</span>
                                            <div>
                                                <p className="text-sm font-bold text-white">{selectedProtocol.fastingHours} Saat Açlık</p>
                                                <p className="text-xs text-white/60">Enjeksiyondan önce</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">💧</span>
                                            <div>
                                                <p className="text-sm font-bold text-white">Hidrasyon</p>
                                                <p className="text-xs text-white/60">{selectedProtocol.hydration}</p>
                                            </div>
                                        </div>
                                        {selectedProtocol.dietRestrictions.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-amber-500/20">
                                                <p className="text-xs font-bold text-amber-400 mb-2">Diyet Kısıtlamaları:</p>
                                                <ul className="space-y-1">
                                                    {selectedProtocol.dietRestrictions.map((diet, i) => (
                                                        <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                                                            <span className="text-amber-400 mt-0.5">•</span>
                                                            {diet}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* İlaç Notları */}
                                {selectedProtocol.medicationNotes.length > 0 && (
                                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
                                        <h4 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
                                            💊 İlaç Notları
                                        </h4>
                                        <ul className="space-y-2">
                                            {selectedProtocol.medicationNotes.map((note, i) => (
                                                <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                                    <span className="text-rose-400 mt-0.5">•</span>
                                                    {note}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Çekim Parametreleri */}
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                                    <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                                        📸 Çekim Parametreleri
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-white/60">Uptake Süresi</p>
                                            <p className="text-sm font-bold text-white">{selectedProtocol.uptakeTime.min}-{selectedProtocol.uptakeTime.max} dakika</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/60">Tarama Aralığı</p>
                                            <p className="text-sm font-bold text-white">{selectedProtocol.scanRange}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/60">Pozisyon</p>
                                            <p className="text-sm font-bold text-white">{selectedProtocol.patientPosition}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/60">Kollar</p>
                                            <p className="text-sm font-bold text-white">
                                                {selectedProtocol.armsPosition === 'up' ? '☝️ Yukarıda' :
                                                    selectedProtocol.armsPosition === 'down' ? '👇 Aşağıda' : '↕️ Her iki pozisyon'}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedProtocol.contrast && (
                                        <div className="mt-4 pt-4 border-t border-blue-500/20">
                                            <p className="text-xs font-bold text-blue-400 mb-2">Kontrast:</p>
                                            <div className="flex gap-4">
                                                <div className={`px-3 py-2 rounded-lg ${selectedProtocol.contrast.iv ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                                                    IV: {selectedProtocol.contrast.iv ? '✓' : '✗'}
                                                </div>
                                                <div className={`px-3 py-2 rounded-lg ${selectedProtocol.contrast.oral ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                                                    Oral: {selectedProtocol.contrast.oral ? '✓' : '✗'}
                                                </div>
                                            </div>
                                            {selectedProtocol.contrast.notes && (
                                                <p className="text-xs text-white/60 mt-2">📝 {selectedProtocol.contrast.notes}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Özel Talimatlar */}
                                {selectedProtocol.specialInstructions.length > 0 && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                                        <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                                            ✅ Özel Talimatlar
                                        </h4>
                                        <ul className="space-y-2">
                                            {selectedProtocol.specialInstructions.map((instruction, i) => (
                                                <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                                    <span className="text-emerald-400 mt-0.5">✓</span>
                                                    {instruction}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Kontrendikasyonlar */}
                                {selectedProtocol.contraindications.length > 0 && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                                        <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                                            🚫 Kontrendikasyonlar
                                        </h4>
                                        <ul className="space-y-2">
                                            {selectedProtocol.contraindications.map((contra, i) => (
                                                <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                                    <span className="text-red-400 mt-0.5">✗</span>
                                                    {contra}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Klinik Endikasyonlar */}
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
                                    <h4 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                                        🎯 Klinik Endikasyonlar
                                    </h4>
                                    <ul className="space-y-2">
                                        {selectedProtocol.clinicalIndications.map((indication, i) => (
                                            <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                                <span className="text-purple-400 mt-0.5">•</span>
                                                {indication}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClinicalProtocols;
