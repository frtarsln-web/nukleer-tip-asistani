import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface Injection {
    id: string;
    time: Date;
    dose: number; // mCi
    patientName?: string;
}

interface DoseArrival {
    id: string;
    arrivalTime: Date;
    calibrationTime: Date;
    initialActivity: number; // mCi at calibration time
    label: string; // "Sabah" or "Öğlen"
}

interface FDGActivityTrackerProps {
    onClose: () => void;
}

// F-18 yarılanma ömrü
const F18_HALF_LIFE_HOURS = 1.83; // 109.8 dakika

// Decay hesaplama
const calculateDecayFactor = (hours: number): number => {
    return Math.pow(0.5, hours / F18_HALF_LIFE_HOURS);
};

// Aktiviteyi belirli bir zamanda hesapla
const calculateActivityAtTime = (
    initialActivity: number,
    calibrationTime: Date,
    targetTime: Date
): number => {
    const hoursElapsed = (targetTime.getTime() - calibrationTime.getTime()) / (1000 * 60 * 60);
    return initialActivity * calculateDecayFactor(hoursElapsed);
};

export const FDGActivityTracker: React.FC<FDGActivityTrackerProps> = ({ onClose }) => {
    // Doz geliş bilgileri
    const [doseArrivals, setDoseArrivals] = useState<DoseArrival[]>([]);
    const [injections, setInjections] = useState<Injection[]>([]);

    // Yeni doz ekleme formu
    const [showAddDose, setShowAddDose] = useState<boolean>(false);
    const [newDoseLabel, setNewDoseLabel] = useState<string>('Sabah');
    const [newDoseActivity, setNewDoseActivity] = useState<number>(180);
    const [newDoseTime, setNewDoseTime] = useState<string>('09:00');

    // Yeni enjeksiyon ekleme formu
    const [showAddInjection, setShowAddInjection] = useState<boolean>(false);
    const [injectionDose, setInjectionDose] = useState<number>(7);
    const [injectionPatient, setInjectionPatient] = useState<string>('');

    // Şu anki zaman (her saniye güncellenir)
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    // Varsayılan doz/hasta
    const [defaultDosePerPatient, setDefaultDosePerPatient] = useState<number>(7);

    // LocalStorage'dan yükle
    useEffect(() => {
        const savedData = localStorage.getItem('fdgActivityData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.doseArrivals) {
                    setDoseArrivals(parsed.doseArrivals.map((d: any) => ({
                        ...d,
                        arrivalTime: new Date(d.arrivalTime),
                        calibrationTime: new Date(d.calibrationTime)
                    })));
                }
                if (parsed.injections) {
                    setInjections(parsed.injections.map((i: any) => ({
                        ...i,
                        time: new Date(i.time)
                    })));
                }
                if (parsed.defaultDosePerPatient) {
                    setDefaultDosePerPatient(parsed.defaultDosePerPatient);
                    setInjectionDose(parsed.defaultDosePerPatient);
                }
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }, []);

    // LocalStorage'a kaydet
    const saveData = useCallback(() => {
        localStorage.setItem('fdgActivityData', JSON.stringify({
            doseArrivals,
            injections,
            defaultDosePerPatient
        }));
    }, [doseArrivals, injections, defaultDosePerPatient]);

    useEffect(() => {
        saveData();
    }, [saveData]);

    // Zaman güncelleyici
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Toplam mevcut aktivite hesapla (tüm dozlardan, decay ve enjeksiyonlar düşülmüş)
    const poolStatus = useMemo(() => {
        if (doseArrivals.length === 0) {
            return {
                totalInitial: 0,
                currentActivity: 0,
                decayLoss: 0,
                usedActivity: 0,
                remainingActivity: 0,
                patientsRemaining: 0
            };
        }

        let totalInitial = 0;
        let currentPool = 0;

        // Her doz için şu anki aktiviteyi hesapla
        doseArrivals.forEach(dose => {
            const activityNow = calculateActivityAtTime(dose.initialActivity, dose.calibrationTime, currentTime);
            totalInitial += dose.initialActivity;
            currentPool += activityNow;
        });

        // Enjeksiyonları düş
        const usedActivity = injections.reduce((sum, inj) => sum + inj.dose, 0);
        const remainingActivity = Math.max(0, currentPool - usedActivity);

        // Decay kaybı
        const decayLoss = totalInitial - currentPool;

        // Kaç hasta daha yapılabilir?
        const patientsRemaining = Math.floor(remainingActivity / defaultDosePerPatient);

        return {
            totalInitial,
            currentActivity: currentPool,
            decayLoss,
            usedActivity,
            remainingActivity,
            patientsRemaining
        };
    }, [doseArrivals, injections, currentTime, defaultDosePerPatient]);

    // Grafik için veri noktaları oluştur
    const chartData = useMemo(() => {
        if (doseArrivals.length === 0) return [];

        const points: { time: Date; activity: number; label?: string }[] = [];

        // İlk dozun gelişinden itibaren
        const firstDose = doseArrivals.reduce((earliest, dose) =>
            dose.calibrationTime < earliest.calibrationTime ? dose : earliest
        );

        const startTime = new Date(firstDose.calibrationTime);
        const endTime = new Date(currentTime);
        endTime.setHours(endTime.getHours() + 2); // 2 saat sonrasına kadar göster

        // Her 15 dakikada bir nokta
        let t = new Date(startTime);
        while (t <= endTime) {
            let activity = 0;
            doseArrivals.forEach(dose => {
                if (t >= dose.calibrationTime) {
                    activity += calculateActivityAtTime(dose.initialActivity, dose.calibrationTime, t);
                }
            });

            // Bu zamana kadar yapılan enjeksiyonları düş
            const usedByTime = injections
                .filter(inj => inj.time <= t)
                .reduce((sum, inj) => sum + inj.dose, 0);

            points.push({
                time: new Date(t),
                activity: Math.max(0, activity - usedByTime)
            });

            t = new Date(t.getTime() + 15 * 60 * 1000);
        }

        return points;
    }, [doseArrivals, injections, currentTime]);

    // Yeni doz ekle
    const handleAddDose = () => {
        const [hours, minutes] = newDoseTime.split(':').map(Number);
        const calibTime = new Date();
        calibTime.setHours(hours, minutes, 0, 0);

        const newDose: DoseArrival = {
            id: Date.now().toString(),
            arrivalTime: new Date(),
            calibrationTime: calibTime,
            initialActivity: newDoseActivity,
            label: newDoseLabel
        };

        setDoseArrivals([...doseArrivals, newDose]);
        setShowAddDose(false);

        // Sonraki doz için öğlen ayarla
        if (newDoseLabel === 'Sabah') {
            setNewDoseLabel('Öğlen');
            setNewDoseTime('13:00');
        }
    };

    // Enjeksiyon ekle
    const handleAddInjection = () => {
        const newInjection: Injection = {
            id: Date.now().toString(),
            time: new Date(),
            dose: injectionDose,
            patientName: injectionPatient || undefined
        };

        setInjections([...injections, newInjection]);
        setShowAddInjection(false);
        setInjectionPatient('');
    };

    // Tüm verileri sıfırla
    const handleReset = () => {
        if (confirm('Tüm veriler silinecek. Emin misiniz?')) {
            setDoseArrivals([]);
            setInjections([]);
            localStorage.removeItem('fdgActivityData');
        }
    };

    // Zaman formatla
    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    // Yüzde hesapla (ilerleme çubuğu için)
    const progressPercent = poolStatus.totalInitial > 0
        ? (poolStatus.remainingActivity / poolStatus.totalInitial) * 100
        : 0;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-2xl border-0 sm:border border-cyan-500/30 sm:max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-3 sm:p-4 sm:rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">📊 Aktivite Takip</h2>
                        <p className="text-cyan-100 text-xs sm:text-sm">Gerçek zamanlı havuz</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Aksiyon Butonları */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            onClick={() => setShowAddDose(true)}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            📦 Doz Ekle
                        </button>
                        <button
                            onClick={() => setShowAddInjection(true)}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            disabled={doseArrivals.length === 0}
                        >
                            💉 Enjeksiyon
                        </button>
                        <button
                            onClick={handleReset}
                            className="bg-gray-700 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            🗑️ Sıfırla
                        </button>
                    </div>

                    {/* Doz ekleme formu */}
                    {showAddDose && (
                        <div className="bg-green-900/30 rounded-xl p-4 border border-green-500/50">
                            <h3 className="text-green-400 font-semibold mb-4">📦 Yeni Doz Geliş</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Etiket</label>
                                    <select
                                        value={newDoseLabel}
                                        onChange={(e) => setNewDoseLabel(e.target.value)}
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                                    >
                                        <option value="Sabah">Sabah</option>
                                        <option value="Öğlen">Öğlen</option>
                                        <option value="Ek">Ek</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Aktivite (mCi)</label>
                                    <input
                                        type="number"
                                        value={newDoseActivity}
                                        onChange={(e) => setNewDoseActivity(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Kalibrasyon Saati</label>
                                    <input
                                        type="time"
                                        value={newDoseTime}
                                        onChange={(e) => setNewDoseTime(e.target.value)}
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleAddDose}
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg"
                                >
                                    ✓ Ekle
                                </button>
                                <button
                                    onClick={() => setShowAddDose(false)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Enjeksiyon ekleme formu */}
                    {showAddInjection && (
                        <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/50">
                            <h3 className="text-purple-400 font-semibold mb-4">💉 Yeni Enjeksiyon</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Doz (mCi)</label>
                                    <input
                                        type="number"
                                        value={injectionDose}
                                        onChange={(e) => setInjectionDose(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                                        step="0.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Hasta Adı (opsiyonel)</label>
                                    <input
                                        type="text"
                                        value={injectionPatient}
                                        onChange={(e) => setInjectionPatient(e.target.value)}
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                                        placeholder="Örn: Ahmet Y."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleAddInjection}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-lg"
                                >
                                    ✓ Kaydet
                                </button>
                                <button
                                    onClick={() => setShowAddInjection(false)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Ana Durum Paneli */}
                    {doseArrivals.length > 0 ? (
                        <>
                            {/* Sayısal Panel */}
                            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-cyan-400 font-semibold">📈 Havuz Durumu</h3>
                                    <span className="text-gray-400 text-sm">⏱️ {formatTime(currentTime)}</span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-blue-900/30 rounded-lg p-3 text-center border border-blue-500/30">
                                        <div className="text-blue-400 text-xs">Başlangıç</div>
                                        <div className="text-white text-xl font-bold">{poolStatus.totalInitial.toFixed(1)}</div>
                                        <div className="text-blue-300 text-xs">mCi</div>
                                    </div>
                                    <div className="bg-red-900/30 rounded-lg p-3 text-center border border-red-500/30">
                                        <div className="text-red-400 text-xs">Decay Kaybı</div>
                                        <div className="text-white text-xl font-bold">-{poolStatus.decayLoss.toFixed(1)}</div>
                                        <div className="text-red-300 text-xs">mCi</div>
                                    </div>
                                    <div className="bg-purple-900/30 rounded-lg p-3 text-center border border-purple-500/30">
                                        <div className="text-purple-400 text-xs">Kullanılan</div>
                                        <div className="text-white text-xl font-bold">-{poolStatus.usedActivity.toFixed(1)}</div>
                                        <div className="text-purple-300 text-xs">mCi ({injections.length} hasta)</div>
                                    </div>
                                    <div className="bg-green-900/30 rounded-lg p-3 text-center border border-green-500/30">
                                        <div className="text-green-400 text-xs">Kalan</div>
                                        <div className="text-white text-2xl font-bold">{poolStatus.remainingActivity.toFixed(1)}</div>
                                        <div className="text-green-300 text-xs">mCi</div>
                                    </div>
                                </div>

                                {/* İlerleme Çubuğu */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Kullanılan & Decay</span>
                                        <span>%{progressPercent.toFixed(0)} kaldı</span>
                                    </div>
                                    <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-1000"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Kaç hasta daha? */}
                                <div className="text-center py-3 bg-cyan-900/30 rounded-lg border border-cyan-500/30">
                                    <span className="text-cyan-300">👥 Tahmini </span>
                                    <span className="text-white text-2xl font-bold">{poolStatus.patientsRemaining}</span>
                                    <span className="text-cyan-300"> hasta daha yapılabilir</span>
                                    <span className="text-gray-400 text-sm block">({defaultDosePerPatient} mCi/hasta)</span>
                                </div>
                            </div>

                            {/* Grafik */}
                            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                                <h3 className="text-cyan-400 font-semibold mb-4">📉 Aktivite Grafiği</h3>

                                <div className="relative h-48 bg-gray-900 rounded-lg p-4">
                                    {/* Y ekseni etiketleri */}
                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-gray-500 text-xs">
                                        <span>{poolStatus.totalInitial.toFixed(0)}</span>
                                        <span>{(poolStatus.totalInitial / 2).toFixed(0)}</span>
                                        <span>0</span>
                                    </div>

                                    {/* Grafik alanı */}
                                    <div className="ml-14 h-full relative">
                                        {/* Grid çizgileri */}
                                        <div className="absolute inset-0 flex flex-col justify-between">
                                            <div className="border-t border-gray-700" />
                                            <div className="border-t border-gray-700" />
                                            <div className="border-t border-gray-700" />
                                        </div>

                                        {/* SVG Grafik */}
                                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                            {chartData.length > 1 && (
                                                <>
                                                    {/* Alan dolgusu */}
                                                    <path
                                                        d={`
                                                            M 0 ${100 - (chartData[0].activity / poolStatus.totalInitial) * 100}%
                                                            ${chartData.map((point, i) => {
                                                            const x = (i / (chartData.length - 1)) * 100;
                                                            const y = 100 - (point.activity / poolStatus.totalInitial) * 100;
                                                            return `L ${x}% ${y}%`;
                                                        }).join(' ')}
                                                            L 100% 100%
                                                            L 0 100%
                                                            Z
                                                        `}
                                                        fill="url(#gradient)"
                                                        opacity="0.3"
                                                    />
                                                    {/* Çizgi */}
                                                    <path
                                                        d={`
                                                            M 0 ${100 - (chartData[0].activity / poolStatus.totalInitial) * 100}%
                                                            ${chartData.map((point, i) => {
                                                            const x = (i / (chartData.length - 1)) * 100;
                                                            const y = 100 - (point.activity / poolStatus.totalInitial) * 100;
                                                            return `L ${x}% ${y}%`;
                                                        }).join(' ')}
                                                        `}
                                                        fill="none"
                                                        stroke="#06b6d4"
                                                        strokeWidth="2"
                                                    />
                                                    <defs>
                                                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#06b6d4" />
                                                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>
                                                </>
                                            )}
                                            {/* Şu anki zaman işaretçisi */}
                                            {chartData.length > 0 && (
                                                <line
                                                    x1={`${(chartData.findIndex(p => p.time >= currentTime) / chartData.length) * 100}%`}
                                                    y1="0"
                                                    x2={`${(chartData.findIndex(p => p.time >= currentTime) / chartData.length) * 100}%`}
                                                    y2="100%"
                                                    stroke="#fbbf24"
                                                    strokeWidth="2"
                                                    strokeDasharray="4"
                                                />
                                            )}
                                        </svg>

                                        {/* Enjeksiyon noktaları */}
                                        {injections.map((inj, i) => {
                                            const timeIndex = chartData.findIndex(p => p.time >= inj.time);
                                            if (timeIndex < 0) return null;
                                            const x = (timeIndex / (chartData.length - 1)) * 100;
                                            const y = chartData[timeIndex] ? 100 - (chartData[timeIndex].activity / poolStatus.totalInitial) * 100 : 50;
                                            return (
                                                <div
                                                    key={inj.id}
                                                    className="absolute w-3 h-3 bg-purple-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2"
                                                    style={{ left: `${x}%`, top: `${y}%` }}
                                                    title={`${formatTime(inj.time)}: ${inj.dose} mCi${inj.patientName ? ` (${inj.patientName})` : ''}`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* X ekseni */}
                                <div className="flex justify-between text-gray-500 text-xs mt-2 ml-14">
                                    {chartData.length > 0 && (
                                        <>
                                            <span>{formatTime(chartData[0].time)}</span>
                                            <span className="text-yellow-400">Şimdi</span>
                                            <span>{formatTime(chartData[chartData.length - 1].time)}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Doz Listesi */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h3 className="text-cyan-400 font-semibold mb-3">📦 Gelen Dozlar</h3>
                                <div className="space-y-2">
                                    {doseArrivals.map(dose => {
                                        const currentAct = calculateActivityAtTime(dose.initialActivity, dose.calibrationTime, currentTime);
                                        return (
                                            <div key={dose.id} className="flex justify-between items-center bg-gray-700/50 rounded-lg px-3 py-2">
                                                <div>
                                                    <span className="text-white font-semibold">{dose.label}</span>
                                                    <span className="text-gray-400 text-sm ml-2">@ {formatTime(dose.calibrationTime)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-gray-400 text-sm">{dose.initialActivity} mCi → </span>
                                                    <span className="text-cyan-400 font-semibold">{currentAct.toFixed(1)} mCi</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Enjeksiyon Geçmişi */}
                            {injections.length > 0 && (
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                    <h3 className="text-purple-400 font-semibold mb-3">💉 Enjeksiyonlar ({injections.length})</h3>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {injections.slice().reverse().map((inj, i) => (
                                            <div key={inj.id} className="flex justify-between items-center bg-gray-700/30 rounded px-3 py-1 text-sm">
                                                <span className="text-gray-300">
                                                    #{injections.length - i} {inj.patientName || 'Hasta'}
                                                </span>
                                                <span className="text-gray-400">{formatTime(inj.time)}</span>
                                                <span className="text-purple-400 font-semibold">{inj.dose} mCi</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Boş durum */
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📦</div>
                            <h3 className="text-xl text-gray-300 mb-2">Henüz doz eklenmedi</h3>
                            <p className="text-gray-500 mb-6">Sabah dozunuzu ekleyerek başlayın</p>
                            <button
                                onClick={() => setShowAddDose(true)}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-8 rounded-xl"
                            >
                                📦 İlk Dozu Ekle
                            </button>
                        </div>
                    )}

                    {/* Ayarlar */}
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-600">
                        <div className="flex items-center gap-4">
                            <label className="text-gray-400 text-sm whitespace-nowrap">Varsayılan hasta dozu:</label>
                            <input
                                type="number"
                                value={defaultDosePerPatient}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 7;
                                    setDefaultDosePerPatient(val);
                                    setInjectionDose(val);
                                }}
                                className="w-20 bg-gray-700 text-white text-center px-2 py-1 rounded border border-gray-600"
                                step="0.5"
                                min="1"
                            />
                            <span className="text-gray-500 text-sm">mCi/hasta</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FDGActivityTracker;
