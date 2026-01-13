import React, { useState, useEffect } from 'react';
import { StaffUser } from '../types';

interface RoomMeasurement {
    temperature: number | null;
    humidity: number | null;
}

interface TimeMeasurement {
    sicakOda: RoomMeasurement;
    petCt: RoomMeasurement;
    gamaKamera: RoomMeasurement;
}

interface DailyControlRecord {
    id: string;
    date: string;
    morning: TimeMeasurement; // 08:00
    evening: TimeMeasurement; // 16:00
    oxygenCylinderCheck: boolean; // Mobil Oksijen Tüpü
    notes: string;
    recordedBy: StaffUser;
    recordedAt: Date;
    lastUpdatedAt: Date;
}

interface DailyControlFormProps {
    currentUser: StaffUser;
    onClose: () => void;
}

const STORAGE_KEY = 'nt_daily_controls';

const emptyRoomMeasurement = (): RoomMeasurement => ({
    temperature: null,
    humidity: null
});

const emptyTimeMeasurement = (): TimeMeasurement => ({
    sicakOda: emptyRoomMeasurement(),
    petCt: emptyRoomMeasurement(),
    gamaKamera: emptyRoomMeasurement()
});

export function DailyControlForm({ currentUser, onClose }: DailyControlFormProps) {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    const [todayRecord, setTodayRecord] = useState<DailyControlRecord | null>(null);
    const [activeTime, setActiveTime] = useState<'morning' | 'evening'>(currentHour < 12 ? 'morning' : 'evening');

    const [formData, setFormData] = useState({
        morning: emptyTimeMeasurement(),
        evening: emptyTimeMeasurement(),
        oxygenCylinderCheck: false,
        notes: ''
    });

    // Load today's record if exists
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const records = JSON.parse(stored) as DailyControlRecord[];
                const existing = records.find(r => r.date === today);
                if (existing) {
                    setTodayRecord(existing);
                    setFormData({
                        morning: existing.morning || emptyTimeMeasurement(),
                        evening: existing.evening || emptyTimeMeasurement(),
                        oxygenCylinderCheck: existing.oxygenCylinderCheck || false,
                        notes: existing.notes || ''
                    });
                }
            } catch (e) {
                console.error('Error loading daily controls:', e);
            }
        }
    }, [today]);

    const updateRoomValue = (
        time: 'morning' | 'evening',
        room: 'sicakOda' | 'petCt' | 'gamaKamera',
        field: 'temperature' | 'humidity',
        value: string
    ) => {
        const numValue = value === '' ? null : parseFloat(value);
        setFormData(prev => ({
            ...prev,
            [time]: {
                ...prev[time],
                [room]: {
                    ...prev[time][room],
                    [field]: numValue
                }
            }
        }));
    };

    const handleSubmit = () => {
        const record: DailyControlRecord = {
            id: todayRecord?.id || Math.random().toString(36).substr(2, 9),
            date: today,
            morning: formData.morning,
            evening: formData.evening,
            oxygenCylinderCheck: formData.oxygenCylinderCheck,
            notes: formData.notes,
            recordedBy: currentUser,
            recordedAt: todayRecord?.recordedAt || new Date(),
            lastUpdatedAt: new Date()
        };

        const stored = localStorage.getItem(STORAGE_KEY);
        let records: DailyControlRecord[] = stored ? JSON.parse(stored) : [];

        // Update or add
        const existingIndex = records.findIndex(r => r.date === today);
        if (existingIndex >= 0) {
            records[existingIndex] = record;
        } else {
            records = [record, ...records];
        }

        // Keep only last 365 days
        records = records.slice(0, 365);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        onClose();
    };

    const rooms = [
        { key: 'sicakOda' as const, name: 'Sıcak Oda', icon: '☢️', color: 'from-orange-500 to-red-500' },
        { key: 'petCt' as const, name: 'PET/CT Çekim Odası', icon: '🔬', color: 'from-blue-500 to-cyan-500' },
        { key: 'gamaKamera' as const, name: 'Gama Kamera', icon: '📷', color: 'from-purple-500 to-pink-500' }
    ];

    const currentMeasurement = formData[activeTime];

    const isMorningComplete = rooms.every(r =>
        formData.morning[r.key].temperature !== null &&
        formData.morning[r.key].humidity !== null
    );
    const isEveningComplete = rooms.every(r =>
        formData.evening[r.key].temperature !== null &&
        formData.evening[r.key].humidity !== null
    );

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-2xl">
                                📋
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">Günlük Ortam Kontrolleri</h2>
                                <p className="text-sm text-slate-400">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {todayRecord && (
                        <div className="mt-3 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                            <p className="text-sm text-emerald-400">
                                ✅ Son güncelleme: {todayRecord.recordedBy.name} - {new Date(todayRecord.lastUpdatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Time Selection Tabs */}
                <div className="px-6 pt-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTime('morning')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${activeTime === 'morning'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <span className="text-lg">🌅</span>
                            <span>Sabah 08:00</span>
                            {isMorningComplete && <span className="ml-1 text-xs">✓</span>}
                        </button>
                        <button
                            onClick={() => setActiveTime('evening')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${activeTime === 'evening'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <span className="text-lg">🌆</span>
                            <span>Akşam 16:00</span>
                            {isEveningComplete && <span className="ml-1 text-xs">✓</span>}
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
                    {/* Rooms */}
                    {rooms.map((room) => (
                        <div key={room.key} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${room.color} flex items-center justify-center text-xl`}>
                                    {room.icon}
                                </div>
                                <h3 className="text-base font-bold text-white">{room.name}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">
                                        🌡️ Sıcaklık (°C)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={currentMeasurement[room.key].temperature ?? ''}
                                        onChange={(e) => updateRoomValue(activeTime, room.key, 'temperature', e.target.value)}
                                        placeholder="22.0"
                                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50 placeholder-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">
                                        💧 Nem (%RH)
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={currentMeasurement[room.key].humidity ?? ''}
                                        onChange={(e) => updateRoomValue(activeTime, room.key, 'humidity', e.target.value)}
                                        placeholder="45"
                                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50 placeholder-slate-600"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Ekipman Kontrolleri */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">✅ Ekipman Kontrolleri</h4>
                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.oxygenCylinderCheck}
                                onChange={(e) => setFormData({ ...formData, oxygenCylinderCheck: e.target.checked })}
                                className="w-5 h-5 rounded-lg bg-white/10 border-white/20 text-teal-500 focus:ring-teal-500"
                            />
                            <div>
                                <p className="text-sm font-bold text-white">🫁 Mobil Oksijen Tüpü Kontrolü</p>
                                <p className="text-xs text-slate-500">Tüp basıncı ve valf durumu kontrol edildi</p>
                            </div>
                        </label>
                    </div>

                    {/* Notlar */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">📝 Notlar (opsiyonel)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Önemli notlar veya gözlemler..."
                            rows={2}
                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50 resize-none placeholder-slate-600"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                        {isMorningComplete && isEveningComplete
                            ? '✅ Tüm ölçümler tamamlandı'
                            : `⏳ ${isMorningComplete ? 'Akşam' : 'Sabah'} ölçümleri bekleniyor`}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white font-bold transition-all"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 rounded-xl text-white font-bold shadow-lg shadow-teal-500/30 transition-all"
                        >
                            {todayRecord ? 'Güncelle' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DailyControlForm;
