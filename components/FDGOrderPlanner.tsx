import React, { useState, useMemo } from 'react';

interface FDGOrderPlannerProps {
    onClose: () => void;
}

const CONVERSION_FACTOR = 37; // 1 mCi = 37 MBq

export const FDGOrderPlanner: React.FC<FDGOrderPlannerProps> = ({ onClose }) => {
    // LocalStorage'dan ayarları yükle
    const savedSettings = JSON.parse(localStorage.getItem('fdgPlannerSettings') || '{}');

    // Tarih
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [orderDate, setOrderDate] = useState<string>(
        savedSettings?.orderDate || tomorrow.toISOString().split('T')[0]
    );

    // Basit girdiler
    const [morningPatients, setMorningPatients] = useState<number>(savedSettings?.morningPatients || 13);
    const [afternoonPatients, setAfternoonPatients] = useState<number>(savedSettings?.afternoonPatients || 5);

    // 1 doz kaç hasta yapar? (Pratik deneyime göre)
    const [patientsPerDose, setPatientsPerDose] = useState<number>(savedSettings?.patientsPerDose || 1.35);

    // 1 doz = kaç mCi
    const [mciPerDose, setMciPerDose] = useState<number>(savedSettings?.mciPerDose || 18);

    // Güvenlik marjı %
    const [safetyMargin, setSafetyMargin] = useState<number>(savedSettings?.safetyMargin || 10);

    // Sonuçları göster
    const [showResults, setShowResults] = useState<boolean>(false);

    // Hesaplama
    const calculation = useMemo(() => {
        // Sabah doz ihtiyacı
        const morningDosesRaw = morningPatients / patientsPerDose;
        const morningDoses = Math.ceil(morningDosesRaw);

        // Öğlen doz ihtiyacı
        const afternoonDosesRaw = afternoonPatients / patientsPerDose;
        const afternoonDoses = Math.ceil(afternoonDosesRaw);

        // Toplam
        const totalDosesRaw = morningDoses + afternoonDoses;

        // Güvenlik marjı ile
        const extraDoses = Math.ceil(totalDosesRaw * (safetyMargin / 100));
        const totalDoses = totalDosesRaw + extraDoses;

        // mCi cinsinden
        const morningMci = morningDoses * mciPerDose;
        const afternoonMci = afternoonDoses * mciPerDose;
        const totalMci = totalDoses * mciPerDose;

        return {
            morningDoses,
            afternoonDoses,
            totalDosesRaw,
            extraDoses,
            totalDoses,
            morningMci,
            afternoonMci,
            totalMci,
            totalMBq: totalMci * CONVERSION_FACTOR
        };
    }, [morningPatients, afternoonPatients, patientsPerDose, safetyMargin, mciPerDose]);

    // Ayarları kaydet
    const saveSettings = () => {
        localStorage.setItem('fdgPlannerSettings', JSON.stringify({
            orderDate,
            morningPatients,
            afternoonPatients,
            patientsPerDose,
            mciPerDose,
            safetyMargin
        }));
    };

    // Hesapla butonu
    const handleCalculate = () => {
        saveSettings();
        setShowResults(true);
    };

    // Yazdır
    const handlePrint = () => {
        const content = `
FDG SİPARİŞ FORMU
=================
Tarih: ${orderDate}

HASTA SAYILARI:
- Sabah: ${morningPatients} hasta
- Öğlen: ${afternoonPatients} hasta
- Toplam: ${morningPatients + afternoonPatients} hasta

DOZ HESABI:
- 1 doz = ${patientsPerDose} hasta
- 1 doz = ${mciPerDose} mCi

SİPARİŞ:
- Sabah: ${calculation.morningDoses} doz (${calculation.morningMci} mCi)
- Öğlen: ${calculation.afternoonDoses} doz (${calculation.afternoonMci} mCi)
- Yedek (+%${safetyMargin}): ${calculation.extraDoses} doz
- TOPLAM: ${calculation.totalDoses} DOZ (${calculation.totalMci} mCi / ${calculation.totalMBq.toFixed(0)} MBq)
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<pre style="font-family: monospace; font-size: 14px;">${content}</pre>`);
            printWindow.document.close();
            printWindow.print();
        }
    };

    // Kopyala
    const handleCopy = () => {
        const text = `FDG Sipariş - ${orderDate}\n` +
            `Hasta: ${morningPatients} sabah + ${afternoonPatients} öğlen = ${morningPatients + afternoonPatients} toplam\n` +
            `Sipariş: ${calculation.totalDoses} doz (${calculation.totalMci} mCi / ${calculation.totalMBq.toFixed(0)} MBq)`;

        navigator.clipboard.writeText(text);
        alert('Kopyalandı!');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-lg border-0 sm:border border-orange-500/30 sm:max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-3 sm:p-4 sm:rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">📦 FDG Sipariş</h2>
                        <p className="text-orange-100 text-xs sm:text-sm">Basit Doz Hesaplama</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Tarih */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <label className="block text-gray-300 text-sm mb-2">📅 Sipariş Tarihi</label>
                        <input
                            type="date"
                            value={orderDate}
                            onChange={(e) => setOrderDate(e.target.value)}
                            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    {/* Hasta Sayıları */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <h3 className="text-orange-400 font-semibold mb-4">👥 Hasta Sayıları</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Sabah</label>
                                <input
                                    type="number"
                                    value={morningPatients}
                                    onChange={(e) => setMorningPatients(parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-700 text-white text-center text-xl font-bold px-4 py-3 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                                    min="0"
                                />
                                <p className="text-gray-500 text-xs text-center mt-1">hasta</p>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Öğlen</label>
                                <input
                                    type="number"
                                    value={afternoonPatients}
                                    onChange={(e) => setAfternoonPatients(parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-700 text-white text-center text-xl font-bold px-4 py-3 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                                    min="0"
                                />
                                <p className="text-gray-500 text-xs text-center mt-1">hasta</p>
                            </div>
                        </div>
                        <div className="mt-3 text-center">
                            <span className="text-gray-400">Toplam: </span>
                            <span className="text-white font-bold text-lg">{morningPatients + afternoonPatients}</span>
                            <span className="text-gray-400"> hasta</span>
                        </div>
                    </div>

                    {/* Doz Ayarları */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <h3 className="text-orange-400 font-semibold mb-4">⚙️ Doz Ayarları</h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">1 Doz = Kaç Hasta?</label>
                                <input
                                    type="number"
                                    value={patientsPerDose}
                                    onChange={(e) => setPatientsPerDose(parseFloat(e.target.value) || 1)}
                                    className="w-full bg-gray-700 text-white text-center px-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                                    step="0.05"
                                    min="0.5"
                                    max="3"
                                />
                                <p className="text-gray-500 text-xs text-center mt-1">hasta/doz</p>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">1 Doz = Kaç mCi?</label>
                                <input
                                    type="number"
                                    value={mciPerDose}
                                    onChange={(e) => setMciPerDose(parseFloat(e.target.value) || 18)}
                                    className="w-full bg-gray-700 text-white text-center px-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                                    min="10"
                                    max="30"
                                />
                                <p className="text-gray-500 text-xs text-center mt-1">mCi/doz</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Güvenlik Marjı</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={safetyMargin}
                                    onChange={(e) => setSafetyMargin(parseInt(e.target.value) || 0)}
                                    className="w-20 bg-gray-700 text-white text-center px-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                                    min="0"
                                    max="50"
                                />
                                <span className="text-gray-400">%</span>
                                <span className="text-gray-500 text-sm ml-2">(+{calculation.extraDoses} yedek doz)</span>
                            </div>
                        </div>
                    </div>

                    {/* Hesapla Butonu */}
                    <button
                        onClick={handleCalculate}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-orange-500/25 flex items-center justify-center gap-2 text-lg"
                    >
                        🧮 HESAPLA
                    </button>

                    {/* Sonuçlar */}
                    {showResults && (
                        <div className="bg-gradient-to-br from-orange-900/30 to-amber-900/30 rounded-xl p-6 border border-orange-500/50">
                            <h3 className="text-orange-400 font-bold text-lg mb-4 text-center">📋 SİPARİŞ ÖZETİ</h3>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-900/30 rounded-lg p-3 text-center border border-blue-500/30">
                                    <div className="text-blue-400 text-sm">Sabah</div>
                                    <div className="text-white text-2xl font-bold">{calculation.morningDoses}</div>
                                    <div className="text-blue-300 text-xs">doz</div>
                                </div>
                                <div className="bg-purple-900/30 rounded-lg p-3 text-center border border-purple-500/30">
                                    <div className="text-purple-400 text-sm">Öğlen</div>
                                    <div className="text-white text-2xl font-bold">{calculation.afternoonDoses}</div>
                                    <div className="text-purple-300 text-xs">doz</div>
                                </div>
                                <div className="bg-green-900/30 rounded-lg p-3 text-center border border-green-500/30">
                                    <div className="text-green-400 text-sm">Yedek</div>
                                    <div className="text-white text-2xl font-bold">+{calculation.extraDoses}</div>
                                    <div className="text-green-300 text-xs">doz</div>
                                </div>
                            </div>

                            {/* Toplam */}
                            <div className="bg-gradient-to-r from-orange-600/50 to-amber-600/50 rounded-xl p-4 text-center border border-orange-400">
                                <div className="text-orange-200 text-sm">🎯 TOPLAM SİPARİŞ</div>
                                <div className="text-white text-5xl font-black my-2">{calculation.totalDoses}</div>
                                <div className="text-orange-100 font-semibold">DOZ</div>
                                <div className="text-orange-200/80 text-sm mt-2">
                                    = {calculation.totalMci} mCi = {calculation.totalMBq.toFixed(0)} MBq
                                </div>
                            </div>

                            {/* Detay */}
                            <div className="mt-4 text-gray-400 text-xs text-center">
                                ℹ️ {morningPatients + afternoonPatients} hasta ÷ {patientsPerDose} hasta/doz = {calculation.totalDosesRaw} doz + %{safetyMargin} yedek
                            </div>
                        </div>
                    )}

                    {/* Aksiyon Butonları */}
                    {showResults && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                🖨️ Yazdır
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                📋 Kopyala
                            </button>
                            <button
                                onClick={saveSettings}
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                💾 Kaydet
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FDGOrderPlanner;
