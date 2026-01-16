import React, { useMemo, useState, useEffect } from 'react';
import { DoseLogEntry, DoseStatus, Isotope, DoseUnit, Vial } from '../types';
import { DoctorAcademicResource } from './DoctorAcademicResource';

// Enjeksiyon Odaları - 7 adet
const INJECTION_ROOMS = [
    { id: 'B1', name: 'B1', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
    { id: 'B2', name: 'B2', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' },
    { id: 'B3', name: 'B3', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30' },
    { id: 'B4', name: 'B4', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30' },
    { id: 'B5', name: 'B5', color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30' },
    { id: 'A1', name: 'A1', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' },
    { id: 'A2', name: 'A2', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30' },
];

// Oda hastası tipi
type RoomPatientInfo = { roomId: string; startTime: Date; patientId: string; patientName: string };

// Bekleme süreleri
const READY_TIME = 60;     // 60 dakika - çekime hazır (1 saat)
const READY_TIME_CRITICAL = 60; // fallback for calculations
const CRITICAL_TIME = 90;  // 90 dakika - kritik uyarı (1.5 saat)

interface DoctorDashboardProps {
    history: DoseLogEntry[];
    selectedIsotope: Isotope;
    now: Date;
    unit: DoseUnit;
    patientsInRooms: Record<string, { roomId: string; startTime: Date; patientId: string; patientName: string }>;
    patientsInImaging: Record<string, { startTime: Date }>;
    additionalImagingPatients: Record<string, { region: string; addedAt: Date; scheduledMinutes: number }>;
    onStartImaging: (patientId: string, patientName: string) => void;
    onReturnToRoom?: (patientId: string, roomId: string) => void;
    onCancelAdditionalImaging?: (patientId: string) => void;
    onLogout?: () => void;
    allVials?: (Vial & { currentActivity: number; calibrationTime: Date; isotopeId: string })[];
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
    history,
    selectedIsotope,
    now,
    unit,
    patientsInRooms,
    patientsInImaging,
    additionalImagingPatients,
    onStartImaging,
    onReturnToRoom,
    onCancelAdditionalImaging,
    onLogout,
    allVials = []
}) => {
    // Kritik uyarı state'leri
    const [showCriticalAlert, setShowCriticalAlert] = useState<{ patientName: string; roomId: number; minutes: number } | null>(null);
    const [showAdditionalAlert, setShowAdditionalAlert] = useState<{ patientName: string; region: string; waitingMinutes: number } | null>(null);
    const [notifiedPatients, setNotifiedPatients] = useState<Record<string, { ready: boolean; critical: boolean; additionalReady: boolean }>>({});
    const [showAcademicResource, setShowAcademicResource] = useState(false);

    // 🔍 Hasta Arama
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // 👨‍⚕️ Hasta Detay Modalı
    const [selectedPatient, setSelectedPatient] = useState<DoseLogEntry | null>(null);
    const [showPatientModal, setShowPatientModal] = useState(false);

    // 📋 Prosedür Notları (localStorage)
    const NOTES_KEY = 'doctor_patient_notes';
    const [patientNotes, setPatientNotes] = useState<Record<string, string>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(NOTES_KEY);
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');

    // Not kaydetme fonksiyonu
    const saveNote = (patientId: string, note: string) => {
        const updated = { ...patientNotes, [patientId]: note };
        setPatientNotes(updated);
        localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
        setEditingNote(null);
        setNoteText('');
    };

    // Hasta detay modalını açma
    const openPatientDetail = (patient: DoseLogEntry) => {
        setSelectedPatient(patient);
        setShowPatientModal(true);
    };

    // 🔍 Filtrelenmiş hastalar
    const filteredPatients = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return history.filter(h =>
            h.patientName.toLowerCase().includes(query) ||
            h.procedure?.toLowerCase().includes(query)
        );
    }, [history, searchQuery]);


    // Odadaki hastaları al - TÜM PET izotoplarını göster (history yerine patientsInRooms'dan doğrudan al)
    const roomPatients = useMemo(() => {
        const rooms: Record<string, { patient: { id: string; patientName: string; procedure: string; isotopeId?: string; elapsedMinutes: number; elapsedSeconds: number; formattedTime: string; medications?: { oralKontrast: boolean; xanax: boolean; lasix: boolean; } }; startTime: Date } | null> = {};

        INJECTION_ROOMS.forEach(room => {
            const roomValues = Object.values(patientsInRooms) as (RoomPatientInfo & { procedure?: string; isotopeId?: string })[];
            const roomEntry = roomValues.find(p => p.roomId === room.id);
            if (roomEntry) {
                const elapsedMs = now.getTime() - new Date(roomEntry.startTime).getTime();
                const elapsedMinutes = Math.floor(elapsedMs / 60000);
                const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);

                // History'den ilaç bilgilerini bul
                const historyEntry = history.find(h => h.id === roomEntry.patientId);

                rooms[room.id] = {
                    patient: {
                        id: roomEntry.patientId,
                        patientName: roomEntry.patientName,
                        procedure: roomEntry.procedure || 'PET/BT',
                        isotopeId: roomEntry.isotopeId,
                        elapsedMinutes,
                        elapsedSeconds,
                        formattedTime: `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`,
                        medications: historyEntry?.medications
                    },
                    startTime: roomEntry.startTime
                };
            } else {
                rooms[room.id] = null;
            }
        });

        return rooms;
    }, [patientsInRooms, now, history]);

    // Ek çekim bekleyen hastalar - bekleme süresi ile
    const additionalScanPatients = useMemo(() => {
        const entries = Object.entries(additionalImagingPatients) as [string, { region: string; addedAt: Date; scheduledMinutes: number }][];
        return entries.map(([patientId, info]) => {
            const patient = history.find(h => h.id === patientId);
            if (!patient) return null;

            const waitingMinutes = Math.floor((now.getTime() - new Date(info.addedAt).getTime()) / 60000);
            const remainingMinutes = Math.max(0, info.scheduledMinutes - waitingMinutes);
            const isReady = waitingMinutes >= info.scheduledMinutes;

            return {
                ...patient,
                region: info.region,
                addedAt: info.addedAt,
                scheduledMinutes: info.scheduledMinutes,
                waitingMinutes,
                remainingMinutes,
                isReady
            };
        }).filter(Boolean);
    }, [additionalImagingPatients, history, now]);

    // Çekimdeki hastalar
    const currentImagingPatients = useMemo(() => {
        const patientIds = Object.keys(patientsInImaging);
        return patientIds.map(id => {
            const patient = history.find(h => h.id === id);
            const imagingInfo = patientsInImaging[id];
            if (!patient || !imagingInfo) return null;

            const mins = Math.floor((now.getTime() - new Date(imagingInfo.startTime).getTime()) / 60000);
            return { ...patient, startTime: imagingInfo.startTime, elapsedMinutes: mins };
        }).filter(Boolean) as (DoseLogEntry & { startTime: Date, elapsedMinutes: number })[];
    }, [patientsInImaging, history, now]);

    // Bekleyen hastalar kategorilere göre
    const waitingPatients = useMemo(() => {
        const BATHROOM_TIME = 45;
        const READY_TIME = 60;
        const DELAYED_TIME = 75;

        const roomValues = Object.values(patientsInRooms) as RoomPatientInfo[];
        const assignedPatientIds = roomValues.map(p => p.patientId);

        // Odalardaki hastaları waiting kategorilerine göre grupla
        const inRooms = history.filter(h =>
            h.status === DoseStatus.PREPARED &&
            assignedPatientIds.includes(h.id)
        );

        return {
            waiting: inRooms.filter(h => {
                const mins = (now.getTime() - new Date(h.timestamp).getTime()) / 60000;
                return mins < BATHROOM_TIME;
            }),
            bathroom: inRooms.filter(h => {
                const mins = (now.getTime() - new Date(h.timestamp).getTime()) / 60000;
                return mins >= BATHROOM_TIME && mins < READY_TIME;
            }),
            ready: inRooms.filter(h => {
                const mins = (now.getTime() - new Date(h.timestamp).getTime()) / 60000;
                return mins >= READY_TIME && mins < DELAYED_TIME;
            }),
            delayed: inRooms.filter(h => {
                const mins = (now.getTime() - new Date(h.timestamp).getTime()) / 60000;
                return mins >= DELAYED_TIME && mins < 120;
            })
        };
    }, [history, now, patientsInRooms]);

    // İstatistikler
    const stats = useMemo(() => {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const todayHistory = history.filter(h => new Date(h.timestamp) >= todayStart);
        const completed = todayHistory.filter(h => h.status === DoseStatus.INJECTED);

        const occupiedRooms = Object.values(patientsInRooms).length;

        return {
            total: todayHistory.length,
            completed: completed.length,
            occupiedRooms,
            emptyRooms: 7 - occupiedRooms
        };
    }, [history, now, patientsInRooms]);

    // Odadaki hastalar için uyarı kontrolü
    useEffect(() => {
        const roomValues = Object.values(patientsInRooms) as RoomPatientInfo[];

        roomValues.forEach(roomInfo => {
            const patientNotifs = notifiedPatients[roomInfo.patientId] || { ready: false, critical: false, additionalReady: false };
            const roomMinutes = (now.getTime() - new Date(roomInfo.startTime).getTime()) / (1000 * 60);

            // 90 dakika (1.5 saat) - KRİTİK UYARI
            if (roomMinutes >= CRITICAL_TIME && !patientNotifs.critical) {
                setShowCriticalAlert({
                    patientName: roomInfo.patientName,
                    roomId: roomInfo.roomId,
                    minutes: Math.floor(roomMinutes)
                });
                setNotifiedPatients(prev => ({ ...prev, [roomInfo.patientId]: { ...patientNotifs, critical: true } }));
                // Kritik uyarı 15 saniye gösterilsin
                setTimeout(() => setShowCriticalAlert(null), 15000);
            }
        });
    }, [patientsInRooms, now, notifiedPatients]);

    // Ek çekim hastaları için uyarı kontrolü
    useEffect(() => {
        additionalScanPatients.forEach((patient: any) => {
            if (!patient) return;
            const patientNotifs = notifiedPatients[patient.id] || { ready: false, critical: false, additionalReady: false };

            // Süre dolduysa uyarı göster
            if (patient.isReady && !patientNotifs.additionalReady) {
                setShowAdditionalAlert({
                    patientName: patient.patientName,
                    region: patient.region,
                    waitingMinutes: patient.waitingMinutes
                });
                setNotifiedPatients(prev => ({ ...prev, [patient.id]: { ...patientNotifs, additionalReady: true } }));
                // Uyarı 15 saniye gösterilsin
                setTimeout(() => setShowAdditionalAlert(null), 15000);
            }
        });
    }, [additionalScanPatients, notifiedPatients]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202] text-white p-4">
            {/* Header - Mobil Uyumlu */}
            <div className="bg-gradient-to-r from-purple-900/60 to-slate-900/60 border border-white/10 rounded-2xl p-3 md:p-4 mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500 flex items-center justify-center text-xl md:text-2xl">
                        👨‍⚕️
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-black text-white">Doktor Paneli</h1>
                        <p className="text-[10px] md:text-xs text-purple-300">Hasta Takip ve Çekim Yönetimi</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 order-3 md:order-2 w-full md:w-auto justify-center">
                    <div className="text-center md:text-right">
                        <div className="text-xl md:text-2xl font-black text-white leading-none tabular-nums">
                            {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[9px] md:text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            {now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 order-2 md:order-3">
                    {/* 🔍 Arama Butonu */}
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`p-2 md:px-3 md:py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isSearchOpen ? 'bg-purple-500 text-white' : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="hidden md:inline">Ara</span>
                    </button>

                    {/* İzotop Bilgisi */}
                    <div className="hidden sm:flex px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700">
                        <span className="text-xs text-slate-400">İzotop:</span>
                        <span className="ml-2 text-sm font-bold text-white">{selectedIsotope.symbol}</span>
                    </div>

                    {/* Akademik Kaynaklar Butonu */}
                    <button
                        onClick={() => setShowAcademicResource(true)}
                        className="p-2 md:px-4 md:py-2 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-indigo-500/30"
                    >
                        <span className="text-base">📚</span>
                        <span className="hidden md:inline">Akademik Kaynaklar</span>
                    </button>

                    {/* Çıkış Butonu */}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="p-2 md:px-4 md:py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden md:inline">Çıkış</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 🔍 Arama Paneli */}
            {isSearchOpen && (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 mb-4 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Hasta adı veya prosedür ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 text-sm"
                            autoFocus
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Arama Sonuçları */}
                    {filteredPatients.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 max-h-48 overflow-y-auto">
                            {filteredPatients.map(patient => {
                                const roomValues = Object.values(patientsInRooms) as RoomPatientInfo[];
                                const roomInfo = roomValues.find(r => r.patientId === patient.id);
                                const isInImaging = !!patientsInImaging[patient.id];
                                return (
                                    <div
                                        key={patient.id}
                                        onClick={() => { openPatientDetail(patient); setIsSearchOpen(false); setSearchQuery(''); }}
                                        className="flex items-center justify-between bg-slate-800/50 hover:bg-purple-500/20 rounded-xl p-3 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isInImaging ? 'bg-purple-500' : roomInfo ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                                                {isInImaging ? '📸' : roomInfo ? '💉' : '👤'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{patient.patientName}</p>
                                                <p className="text-[10px] text-slate-400">{patient.procedure} • {roomInfo ? `Oda ${roomInfo.roomId}` : isInImaging ? 'Çekimde' : 'Bekliyor'}</p>
                                            </div>
                                        </div>
                                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {searchQuery && filteredPatients.length === 0 && (
                        <p className="mt-3 text-center text-sm text-slate-500">Sonuç bulunamadı</p>
                    )}
                </div>
            )}

            {/* 🩺 Hızlı Durum Özeti - Mobil Uyumlu */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl md:text-3xl font-black text-blue-400 tabular-nums">{stats.total}</div>
                    <div className="text-[8px] md:text-[10px] font-bold text-blue-300/70 uppercase mt-1">👥 Toplam Hasta</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl md:text-3xl font-black text-emerald-400 tabular-nums">{stats.occupiedRooms}<span className="text-sm md:text-lg text-emerald-300/50">/7</span></div>
                    <div className="text-[8px] md:text-[10px] font-bold text-emerald-300/70 uppercase mt-1">💉 Dolu Oda</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl md:text-3xl font-black text-purple-400 tabular-nums">{currentImagingPatients.length}</div>
                    <div className="text-[8px] md:text-[10px] font-bold text-purple-300/70 uppercase mt-1">📸 Çekimde</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl md:text-3xl font-black text-amber-400 tabular-nums">{additionalScanPatients.length}</div>
                    <div className="text-[8px] md:text-[10px] font-bold text-amber-300/70 uppercase mt-1">➕ Ek Çekim</div>
                </div>
            </div>

            {/* 🚨 KRİTİK UYARI - 1.5 SAAT GEÇTİ - Tam Ekran Animasyonlu */}
            {
                showCriticalAlert && (
                    <div className="fixed inset-0 z-[300] pointer-events-auto flex items-center justify-center">
                        {/* Kırmızı yanıp sönen arka plan */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-rose-900 animate-pulse"></div>
                        <div className="absolute inset-0 bg-red-500/20" style={{ animation: 'pulse 0.5s ease-in-out infinite' }}></div>

                        {/* Parıldayan efekt */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-gradient-radial from-yellow-500/30 via-transparent to-transparent" style={{ animation: 'spin 4s linear infinite' }}></div>
                        </div>

                        {/* İçerik */}
                        <div className="relative z-10 text-center px-8">
                            {/* Büyük Alarm İkonu */}
                            <div className="mb-6">
                                <div className="w-32 h-32 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center animate-bounce">
                                    <span className="text-7xl">🚨</span>
                                </div>
                            </div>

                            {/* Kritik Başlık */}
                            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight animate-pulse">
                                KRİTİK UYARI!
                            </h1>

                            {/* Süre */}
                            <div className="inline-block bg-white/10 backdrop-blur-lg rounded-2xl px-8 py-4 mb-6 border-2 border-white/30">
                                <p className="text-6xl md:text-8xl font-black text-yellow-300 tabular-nums">
                                    {showCriticalAlert.minutes}<span className="text-3xl"> dk</span>
                                </p>
                            </div>

                            {/* Oda ve Hasta Bilgisi */}
                            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 max-w-md mx-auto border border-white/20">
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-black text-white">
                                        {showCriticalAlert.roomId}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Oda</p>
                                        <p className="text-2xl font-black text-white">Oda {showCriticalAlert.roomId}</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-white mb-2">{showCriticalAlert.patientName}</p>
                                <p className="text-sm text-yellow-300 font-bold">
                                    ⚠️ 1.5 SAAT GEÇTİ - ACİL ÇEKİME ALIN!
                                </p>
                            </div>

                            {/* Alt Uyarı */}
                            <p className="mt-6 text-lg text-white/80 font-bold animate-pulse">
                                Görüntü kalitesi olumsuz etkilenebilir!
                            </p>

                            {/* Kapatma Butonu */}
                            <button
                                onClick={() => setShowCriticalAlert(null)}
                                className="mt-8 px-8 py-4 bg-white hover:bg-yellow-300 text-red-900 rounded-2xl text-lg font-black uppercase tracking-wider transition-all active:scale-95 shadow-2xl"
                            >
                                ANLADIM - KAPAT
                            </button>
                        </div>
                    </div>
                )
            }

            {/* 📸 EK ÇEKİM HAZIR - Turuncu Animasyonlu */}
            {
                showAdditionalAlert && (
                    <div className="fixed inset-0 z-[300] pointer-events-auto flex items-center justify-center">
                        {/* Turuncu gradient arka plan */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-orange-800 to-amber-900 animate-pulse"></div>
                        <div className="absolute inset-0 bg-orange-500/20" style={{ animation: 'pulse 0.5s ease-in-out infinite' }}></div>

                        {/* İçerik */}
                        <div className="relative z-10 text-center px-8">
                            {/* Büyük İkon */}
                            <div className="mb-6">
                                <div className="w-32 h-32 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center animate-bounce">
                                    <span className="text-7xl">📸</span>
                                </div>
                            </div>

                            {/* Başlık */}
                            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight animate-pulse">
                                EK ÇEKİM HAZIR!
                            </h1>

                            {/* Süre */}
                            <div className="inline-block bg-white/10 backdrop-blur-lg rounded-2xl px-8 py-4 mb-6 border-2 border-white/30">
                                <p className="text-6xl md:text-8xl font-black text-yellow-300 tabular-nums">
                                    {showAdditionalAlert.waitingMinutes}<span className="text-3xl"> dk</span>
                                </p>
                                <p className="text-sm text-white/70 mt-2">bekleme süresi doldu</p>
                            </div>

                            {/* Hasta ve Bölge Bilgisi */}
                            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 max-w-md mx-auto border border-white/20">
                                <p className="text-2xl font-black text-white mb-2">{showAdditionalAlert.patientName}</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">
                                        {showAdditionalAlert.region}
                                    </span>
                                </div>
                                <p className="text-sm text-yellow-300 font-bold mt-3">
                                    ⏰ Ek çekim için bekleme süresi doldu!
                                </p>
                            </div>

                            {/* Kapatma Butonu */}
                            <button
                                onClick={() => setShowAdditionalAlert(null)}
                                className="mt-8 px-8 py-4 bg-white hover:bg-yellow-300 text-orange-900 rounded-2xl text-lg font-black uppercase tracking-wider transition-all active:scale-95 shadow-2xl"
                            >
                                ANLADIM - KAPAT
                            </button>
                        </div>
                    </div>
                )
            }

            <div className="space-y-6">
                {/* Çekimdeki Hastalar - Hero Section */}
                <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/60 border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 opacity-10 blur-[100px]"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-3 h-3 rounded-full ${currentImagingPatients.length > 0 ? 'bg-purple-500 animate-pulse' : 'bg-slate-600'}`}></div>
                            <h2 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">📸 ÇEKİMDEKİ HASTALAR</h2>
                            {currentImagingPatients.length > 0 && (
                                <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-black animate-pulse">{currentImagingPatients.length}</span>
                            )}
                        </div>

                        {currentImagingPatients.length > 0 ? (
                            <div className="space-y-3">
                                {currentImagingPatients.map(patient => (
                                    <div key={patient.id} className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Sol: Hasta Bilgileri */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-xl flex-shrink-0">📸</div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-lg font-black text-white leading-tight break-words">{patient.patientName}</p>
                                                        <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wide mt-0.5">{patient.procedure}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sağ: Süre */}
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-4xl font-black text-purple-400 tabular-nums animate-pulse leading-none">
                                                    {patient.elapsedMinutes}<span className="text-lg ml-1">dk</span>
                                                </div>
                                                <div className="text-[9px] text-purple-300 font-bold uppercase tracking-wider mt-1">ÇEKİM SÜRESİ</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-8 bg-black/20 rounded-2xl border border-white/5">
                                <div className="text-center">
                                    <div className="text-2xl mb-2 opacity-50">📸</div>
                                    <p className="text-sm text-slate-500 font-bold">Şu an çekimde hasta yok</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Enjeksiyon Odaları Durumu - Ana Bölüm (Sadece Görüntüleme) */}
                <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/60 border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 opacity-10 blur-[100px]"></div>

                    <div className="relative z-10">
                        {/* Başlık */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${stats.occupiedRooms > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                <h2 className="text-xs font-black text-emerald-400 uppercase tracking-wider">💉 Enjeksiyon Odaları</h2>
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black">
                                {stats.occupiedRooms}/7 Dolu
                            </span>
                        </div>
                        {/* Oda Listesi - Dikey Liste (Çekimdeki Hastalar gibi) */}
                        <div className="space-y-3">
                            {INJECTION_ROOMS.map((room, idx) => {
                                const roomData = roomPatients[room.id];
                                const isOccupied = !!roomData;

                                // Renk durumuna göre ayarla
                                let bgColor = 'bg-slate-800/30';
                                let borderColor = 'border-slate-700/30';
                                let statusLabel = 'Boş';
                                let statusBg = 'bg-slate-700/50';
                                let textColor = 'text-slate-500';

                                if (isOccupied && roomData) {
                                    const mins = roomData.patient.elapsedMinutes;
                                    if (mins < 45) {
                                        bgColor = 'bg-blue-900/40';
                                        borderColor = 'border-blue-500/40';
                                        statusLabel = 'Bekliyor';
                                        statusBg = 'bg-blue-500';
                                        textColor = 'text-blue-300';
                                    } else if (mins < 60) {
                                        bgColor = 'bg-amber-900/40';
                                        borderColor = 'border-amber-500/40';
                                        statusLabel = 'Tuvalet';
                                        statusBg = 'bg-amber-500';
                                        textColor = 'text-amber-300';
                                    } else if (mins < 75) {
                                        bgColor = 'bg-emerald-900/40';
                                        borderColor = 'border-emerald-500/40';
                                        statusLabel = 'Hazır';
                                        statusBg = 'bg-emerald-500';
                                        textColor = 'text-emerald-300';
                                    } else {
                                        bgColor = 'bg-rose-900/40';
                                        borderColor = 'border-rose-500/40';
                                        statusLabel = 'Gecikmiş!';
                                        statusBg = 'bg-rose-500';
                                        textColor = 'text-rose-300';
                                    }
                                }

                                return (
                                    <div
                                        key={room.id}
                                        className={`${bgColor} ${borderColor} border rounded-2xl p-3 md:p-4 transition-all hover:scale-[1.01] ${isOccupied ? 'cursor-pointer' : ''}`}
                                        onClick={() => {
                                            if (isOccupied && roomData) {
                                                const patient = history.find(h => h.id === roomData.patient.id);
                                                if (patient) openPatientDetail(patient);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-3 md:gap-4">
                                            {/* Sol: Oda Numarası ve Hasta Bilgisi */}
                                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                                {/* Oda Numarası */}
                                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${isOccupied ? statusBg : 'bg-slate-700/50'} flex items-center justify-center flex-shrink-0`}>
                                                    <span className="text-white text-base md:text-lg font-black">{room.id}</span>
                                                </div>

                                                {/* Hasta Bilgisi */}
                                                <div className="min-w-0 flex-1">
                                                    {isOccupied && roomData ? (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm md:text-base font-black text-white leading-tight truncate">
                                                                    {roomData.patient.patientName}
                                                                </p>
                                                                {/* Not göstergesi */}
                                                                {patientNotes[roomData.patient.id] && (
                                                                    <span className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] flex-shrink-0" title="Not var">📝</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                <p className="text-[9px] md:text-[10px] text-white/50 font-bold uppercase tracking-wide">
                                                                    {roomData.patient.procedure}
                                                                </p>
                                                                {/* İlaç İkonları */}
                                                                {roomData.patient.medications?.oralKontrast && (
                                                                    <span title="Oral Kontrast Verildi" className="px-1 py-0.5 rounded bg-purple-500/30 border border-purple-500/50 text-[8px] font-bold text-purple-300 uppercase">OK</span>
                                                                )}
                                                                {roomData.patient.medications?.xanax && (
                                                                    <span title="Xanax Verildi" className="px-1 py-0.5 rounded bg-blue-500/30 border border-blue-500/50 text-[8px] font-bold text-blue-300 uppercase">XNX</span>
                                                                )}
                                                                {roomData.patient.medications?.lasix && (
                                                                    <span title="Lasix Verildi" className="px-1 py-0.5 rounded bg-amber-500/30 border border-amber-500/50 text-[8px] font-bold text-amber-300 uppercase">LSX</span>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-xs md:text-sm text-slate-500 font-bold">Oda {room.id} - Boş</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Orta: Durum Badge */}
                                            {isOccupied && roomData && (
                                                <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg ${statusBg} text-[9px] md:text-[10px] font-black uppercase text-white flex-shrink-0`}>
                                                    {statusLabel}
                                                </span>
                                            )}

                                            {/* Sağ: Süre veya Boş */}
                                            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                                                {isOccupied && roomData ? (
                                                    <>
                                                        <div className="text-right">
                                                            <div className={`text-xl md:text-2xl font-black ${textColor} tabular-nums leading-none`}>
                                                                {roomData.patient.formattedTime}
                                                            </div>
                                                            <div className="text-[7px] md:text-[8px] text-white/40 font-bold uppercase tracking-wider mt-0.5">BEKLEME</div>
                                                        </div>
                                                        {roomData.patient.elapsedMinutes >= 60 && (
                                                            <span className="hidden md:inline-flex px-2 md:px-3 py-1 md:py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] md:text-[10px] font-black uppercase">
                                                                ✓ HAZIR
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-700/20 flex items-center justify-center opacity-30">
                                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ⏱️ Progress Bar - Sadece dolu odalarda */}
                                        {isOccupied && roomData && (
                                            <div className="mt-3">
                                                <div className="relative h-1.5 md:h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                                    {/* Progress Bar */}
                                                    <div
                                                        className={`absolute left-0 top-0 h-full ${statusBg} transition-all duration-1000 ease-out`}
                                                        style={{ width: `${Math.min((roomData.patient.elapsedMinutes / 90) * 100, 100)}%` }}
                                                    />
                                                    {/* Milestone Markers */}
                                                    <div className="absolute top-0 left-[50%] w-0.5 h-full bg-white/20" title="45 dk" />
                                                    <div className="absolute top-0 left-[66.7%] w-0.5 h-full bg-white/30" title="60 dk" />
                                                    <div className="absolute top-0 left-[83.3%] w-0.5 h-full bg-white/20" title="75 dk" />
                                                </div>
                                                <div className="flex justify-between mt-1 text-[7px] md:text-[8px] text-slate-500 font-bold">
                                                    <span>0</span>
                                                    <span>45dk</span>
                                                    <span>60dk</span>
                                                    <span>75dk</span>
                                                    <span>90dk</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Ek Çekim Durumu - Hero Section */}
                <div className="bg-gradient-to-br from-orange-900/40 to-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 opacity-10 blur-[100px]"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`w-3 h-3 rounded-full ${additionalScanPatients.length > 0 ? 'bg-orange-500 animate-pulse' : 'bg-slate-600'}`}></div>
                            <h2 className="text-[10px] font-black text-orange-400 uppercase tracking-widest">➕ EK ÇEKİM DURUMU</h2>
                            {additionalScanPatients.length > 0 && (
                                <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-black animate-bounce">{additionalScanPatients.length}</span>
                            )}
                        </div>

                        {additionalScanPatients.length > 0 ? (
                            <div className="space-y-4">
                                {additionalScanPatients.map((patient: any) => {
                                    const timeLabel = patient.scheduledMinutes === 60 ? '1 saat' : patient.scheduledMinutes === 90 ? '1.5 saat' : '2 saat';

                                    return (
                                        <div
                                            key={patient.id}
                                            className={`border rounded-2xl p-5 transition-all flex gap-6 ${patient.isReady
                                                ? 'bg-emerald-500/20 border-emerald-500/50 ring-2 ring-emerald-500/50'
                                                : 'bg-orange-500/10 border-orange-500/30'
                                                }`}
                                        >
                                            {/* Sol: Hasta Bilgileri ve Butonlar */}
                                            <div className="flex-1">
                                                {/* Durum Badge ve Hasta Adı */}
                                                <div className="flex items-start gap-3 mb-3">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex-shrink-0 ${patient.isReady
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-orange-600 text-white'
                                                        }`}>
                                                        {patient.isReady ? '✅ HAZIR' : '⏳ BEKLİYOR'}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xl font-black text-white leading-tight break-words">{patient.patientName}</p>
                                                    </div>
                                                </div>

                                                {/* Prosedür ve Bölge */}
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className="text-xs text-orange-300 font-bold">{patient.procedure}</span>
                                                    <span className="text-slate-500">•</span>
                                                    <span className="px-2.5 py-1 bg-orange-500/30 text-orange-200 rounded-lg text-xs font-black uppercase">
                                                        📍 {patient.region}
                                                    </span>
                                                </div>

                                                {/* Enjeksiyon Saati */}
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-[10px] text-white/50 font-bold">💉 ENJEKSİYON:</span>
                                                    <span className="text-sm font-black text-white/80">
                                                        {new Date(patient.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Süre ve Butonlar */}
                                                <div className="flex items-end justify-between gap-4">
                                                    <div>
                                                        <div className={`text-5xl font-black tabular-nums leading-none ${patient.isReady ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                            {patient.waitingMinutes}<span className="text-2xl ml-1">dk</span>
                                                        </div>
                                                        {patient.isReady ? (
                                                            <p className="text-[10px] font-bold text-emerald-300 uppercase mt-2 animate-pulse">
                                                                ✓ SÜRE DOLDU ({timeLabel})
                                                            </p>
                                                        ) : (
                                                            <p className="text-[10px] font-bold text-orange-300 uppercase mt-2">
                                                                {patient.remainingMinutes} DK KALDI / {timeLabel.toUpperCase()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {/* Sadece Görüntüleme - Butonlar Kaldırıldı */}
                                                    {patient.isReady && (
                                                        <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-black uppercase">
                                                            ✓ ÇEKİME HAZIR
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sağ: Animasyonlu Vücut Bölgesi Görseli */}
                                            <div className="flex-shrink-0 w-32 flex flex-col items-center justify-center">
                                                <div className="relative w-24 h-32">
                                                    <svg viewBox="0 0 80 120" className="w-full h-full drop-shadow-lg">
                                                        {/* Vücut silüeti */}
                                                        <defs>
                                                            <linearGradient id={`bodyGrad-${patient.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#475569" />
                                                                <stop offset="100%" stopColor="#334155" />
                                                            </linearGradient>
                                                            <linearGradient id={`highlightGrad-${patient.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor={patient.isReady ? "#10b981" : "#f97316"} />
                                                                <stop offset="100%" stopColor={patient.isReady ? "#059669" : "#ea580c"} />
                                                            </linearGradient>
                                                            <filter id={`glow-${patient.id}`}>
                                                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                                                <feMerge>
                                                                    <feMergeNode in="coloredBlur" />
                                                                    <feMergeNode in="SourceGraphic" />
                                                                </feMerge>
                                                            </filter>
                                                        </defs>

                                                        {/* Kafa */}
                                                        <ellipse
                                                            cx="40" cy="12" rx="10" ry="11"
                                                            fill={patient.region?.toLowerCase().includes('kafa') || patient.region?.toLowerCase().includes('beyin')
                                                                ? `url(#highlightGrad-${patient.id})`
                                                                : `url(#bodyGrad-${patient.id})`}
                                                            filter={patient.region?.toLowerCase().includes('kafa') || patient.region?.toLowerCase().includes('beyin') ? `url(#glow-${patient.id})` : ''}
                                                            className={patient.region?.toLowerCase().includes('kafa') || patient.region?.toLowerCase().includes('beyin') ? 'animate-pulse' : ''}
                                                        />

                                                        {/* Boyun */}
                                                        <rect
                                                            x="36" y="22" width="8" height="8" rx="2"
                                                            fill={patient.region?.toLowerCase().includes('boyun')
                                                                ? `url(#highlightGrad-${patient.id})`
                                                                : `url(#bodyGrad-${patient.id})`}
                                                            filter={patient.region?.toLowerCase().includes('boyun') ? `url(#glow-${patient.id})` : ''}
                                                            className={patient.region?.toLowerCase().includes('boyun') ? 'animate-pulse' : ''}
                                                        />

                                                        {/* Gövde - Toraks */}
                                                        <rect
                                                            x="25" y="28" width="30" height="25" rx="5"
                                                            fill={patient.region?.toLowerCase().includes('toraks') || patient.region?.toLowerCase().includes('akciğer') || patient.region?.toLowerCase().includes('göğüs')
                                                                ? `url(#highlightGrad-${patient.id})`
                                                                : `url(#bodyGrad-${patient.id})`}
                                                            filter={patient.region?.toLowerCase().includes('toraks') || patient.region?.toLowerCase().includes('akciğer') || patient.region?.toLowerCase().includes('göğüs') ? `url(#glow-${patient.id})` : ''}
                                                            className={patient.region?.toLowerCase().includes('toraks') || patient.region?.toLowerCase().includes('akciğer') || patient.region?.toLowerCase().includes('göğüs') ? 'animate-pulse' : ''}
                                                        />

                                                        {/* Karın - Abdomen */}
                                                        <rect
                                                            x="27" y="52" width="26" height="18" rx="4"
                                                            fill={patient.region?.toLowerCase().includes('abdomen') || patient.region?.toLowerCase().includes('karın') || patient.region?.toLowerCase().includes('batın')
                                                                ? `url(#highlightGrad-${patient.id})`
                                                                : `url(#bodyGrad-${patient.id})`}
                                                            filter={patient.region?.toLowerCase().includes('abdomen') || patient.region?.toLowerCase().includes('karın') || patient.region?.toLowerCase().includes('batın') ? `url(#glow-${patient.id})` : ''}
                                                            className={patient.region?.toLowerCase().includes('abdomen') || patient.region?.toLowerCase().includes('karın') || patient.region?.toLowerCase().includes('batın') ? 'animate-pulse' : ''}
                                                        />

                                                        {/* Pelvis */}
                                                        <ellipse
                                                            cx="40" cy="76" rx="14" ry="8"
                                                            fill={patient.region?.toLowerCase().includes('pelvis') || patient.region?.toLowerCase().includes('pelvik')
                                                                ? `url(#highlightGrad-${patient.id})`
                                                                : `url(#bodyGrad-${patient.id})`}
                                                            filter={patient.region?.toLowerCase().includes('pelvis') || patient.region?.toLowerCase().includes('pelvik') ? `url(#glow-${patient.id})` : ''}
                                                            className={patient.region?.toLowerCase().includes('pelvis') || patient.region?.toLowerCase().includes('pelvik') ? 'animate-pulse' : ''}
                                                        />

                                                        {/* Sol Kol */}
                                                        <rect
                                                            x="10" y="30" width="8" height="35" rx="4"
                                                            fill={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('kol') || patient.region?.toLowerCase().includes('üst ekstremite')
                                                                ? `url(#highlightGrad-${patient.id})`
                                                                : `url(#bodyGrad-${patient.id})`}
                                                            filter={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('kol') ? `url(#glow-${patient.id})` : ''}
                                                            className={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('kol') ? 'animate-pulse' : ''}
                                                        />

                                                        {/* Sağ Kol */}
                                                        <rect
                                                            x="62" y="30" width="8" height="35" rx="4"
                                                            fill={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('kol') || patient.region?.toLowerCase().includes('üst ekstremite')
                                                                ? `url(#highlightGrad-${patient.id})`
                                                                : `url(#bodyGrad-${patient.id})`}
                                                            filter={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('kol') ? `url(#glow-${patient.id})` : ''}
                                                            className={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('kol') ? 'animate-pulse' : ''}
                                                        />

                                                        {/* Sol Bacak */}
                                                        <rect
                                                            x="28" y="82" width="10" height="35" rx="4"
                                                            fill={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('bacak') || patient.region?.toLowerCase().includes('alt ekstremite')
                                                                ? `url(#highlightGrad-${patient.id})`
                                                                : `url(#bodyGrad-${patient.id})`}
                                                            filter={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('bacak') ? `url(#glow-${patient.id})` : ''}
                                                            className={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('bacak') ? 'animate-pulse' : ''}
                                                        />

                                                        {/* Sağ Bacak */}
                                                        <rect
                                                            x="42" y="82" width="10" height="35" rx="4"
                                                            fill={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('bacak') || patient.region?.toLowerCase().includes('alt ekstremite')
                                                                ? `url(#highlightGrad-${patient.id})`
                                                                : `url(#bodyGrad-${patient.id})`}
                                                            filter={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('bacak') ? `url(#glow-${patient.id})` : ''}
                                                            className={patient.region?.toLowerCase().includes('ekstremite') || patient.region?.toLowerCase().includes('bacak') ? 'animate-pulse' : ''}
                                                        />

                                                        {/* Tüm Vücut için özel durum */}
                                                        {(patient.region?.toLowerCase().includes('tüm vücut') || patient.region?.toLowerCase().includes('whole body')) && (
                                                            <rect
                                                                x="5" y="0" width="70" height="120" rx="8"
                                                                fill="none"
                                                                stroke={patient.isReady ? "#10b981" : "#f97316"}
                                                                strokeWidth="3"
                                                                strokeDasharray="5 3"
                                                                className="animate-pulse"
                                                            />
                                                        )}
                                                    </svg>
                                                </div>

                                                {/* Bölge etiketi */}
                                                <div className={`mt-2 text-center ${patient.isReady ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                    <span className="text-[10px] font-black uppercase bg-black/40 px-2 py-1 rounded-lg">
                                                        {patient.region}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
                                <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-lg font-black text-slate-500">Ek Çekim Yok</p>
                                <p className="text-xs text-slate-600 mt-1">Şu an bekleyen ek çekim isteği bulunmuyor</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Randevu Durumu - Yaklaşan ve Geçmiş Randevular */}
                <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                                <span className="text-lg">📅</span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Randevu Durumu</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Yaklaşan ve Geçmiş Randevular</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Yaklaşan</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Gecikmiş</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Yaklaşan Randevular */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                                <h4 className="text-sm font-bold text-amber-400">Yaklaşan Randevular</h4>
                                <span className="ml-auto text-xs text-amber-400/70">(30 dk içinde)</span>
                            </div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-thin">
                                {(() => {
                                    // PDF'den gelen appointmentTime'a göre hesapla
                                    const waitingPatients = history.filter(h =>
                                        h.status === DoseStatus.PREPARED &&
                                        !patientsInRooms[h.id] &&
                                        !patientsInImaging[h.id]
                                    );

                                    if (waitingPatients.length === 0) {
                                        return <p className="text-xs text-slate-500 text-center py-4">Yaklaşan randevu yok</p>;
                                    }

                                    // Randevu saatine göre sırala ve göster
                                    return waitingPatients
                                        .map(patient => {
                                            // appointmentTime varsa kullan, yoksa timestamp'ten hesapla
                                            let minutesUntilAppointment = 0;
                                            let appointmentTimeStr = '';

                                            if (patient.appointmentTime) {
                                                // PDF'den gelen randevu saati
                                                const today = now.toISOString().split('T')[0];
                                                const [hours, minutes] = patient.appointmentTime.split(':').map(Number);
                                                const appointmentDate = new Date(today);
                                                appointmentDate.setHours(hours, minutes, 0, 0);

                                                minutesUntilAppointment = Math.round((appointmentDate.getTime() - now.getTime()) / 60000);
                                                appointmentTimeStr = patient.appointmentTime;
                                            } else {
                                                // appointmentTime yoksa timestamp'ten geçen süreyi göster
                                                const elapsed = Math.floor((now.getTime() - new Date(patient.timestamp).getTime()) / 60000);
                                                minutesUntilAppointment = -elapsed; // negatif = geçmiş
                                                appointmentTimeStr = new Date(patient.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                            }

                                            return { ...patient, minutesUntilAppointment, appointmentTimeStr };
                                        })
                                        .sort((a, b) => a.minutesUntilAppointment - b.minutesUntilAppointment) // En yakın randevu önce
                                        .slice(0, 5)
                                        .map(patient => (
                                            <div key={patient.id} className="flex items-center justify-between bg-amber-500/10 rounded-lg px-3 py-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{patient.patientName}</p>
                                                    <p className="text-[10px] text-slate-400">{patient.procedure}</p>
                                                </div>
                                                <div className="text-right">
                                                    {patient.minutesUntilAppointment > 0 ? (
                                                        <>
                                                            <p className="text-xs font-bold text-emerald-400">{patient.minutesUntilAppointment} dk</p>
                                                            <p className="text-[9px] text-slate-500">kaldı • {patient.appointmentTimeStr}</p>
                                                        </>
                                                    ) : patient.minutesUntilAppointment === 0 ? (
                                                        <>
                                                            <p className="text-xs font-bold text-amber-400 animate-pulse">ŞİMDİ</p>
                                                            <p className="text-[9px] text-slate-500">{patient.appointmentTimeStr}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-xs font-bold text-amber-400">{Math.abs(patient.minutesUntilAppointment)} dk</p>
                                                            <p className="text-[9px] text-slate-500">bekliyor</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ));
                                })()}
                            </div>
                        </div>

                        {/* Gecikmiş Randevular */}
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                                <h4 className="text-sm font-bold text-red-400">Gecikmiş Randevular</h4>
                                <span className="ml-auto text-xs text-red-400/70">(60+ dk)</span>
                            </div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-thin">
                                {(() => {
                                    const delayedPatients = Object.entries(patientsInRooms).filter(([id, info]: [string, RoomPatientInfo]) => {
                                        const elapsed = Math.floor((now.getTime() - new Date(info.startTime).getTime()) / 60000);
                                        return elapsed >= 60;
                                    });

                                    if (delayedPatients.length === 0) {
                                        return <p className="text-xs text-slate-500 text-center py-4">Gecikmiş randevu yok</p>;
                                    }

                                    return delayedPatients.map(([id, info]: [string, RoomPatientInfo]) => {
                                        const elapsed = Math.floor((now.getTime() - new Date(info.startTime).getTime()) / 60000);
                                        const patient = history.find(h => h.id === id);
                                        return (
                                            <div key={id} className="flex items-center justify-between bg-red-500/10 rounded-lg px-3 py-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{info.patientName}</p>
                                                    <p className="text-[10px] text-slate-400">Oda {info.roomId} • {patient?.procedure || 'Prosedür'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-red-400">{elapsed} dk</p>
                                                    <p className="text-[9px] text-red-300">gecikmiş!</p>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Özet İstatistikler */}
                    <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/50">
                        <div className="text-center">
                            <p className="text-lg font-black text-blue-400">{history.filter(h => h.status === DoseStatus.PREPARED && !patientsInRooms[h.id] && !patientsInImaging[h.id]).length}</p>
                            <p className="text-[9px] text-slate-500 uppercase">Bekleyen</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-emerald-400">{Object.keys(patientsInRooms).length}</p>
                            <p className="text-[9px] text-slate-500 uppercase">Odada</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-purple-400">{Object.keys(patientsInImaging).length}</p>
                            <p className="text-[9px] text-slate-500 uppercase">Çekimde</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-red-400">{Object.entries(patientsInRooms).filter(([id, info]: [string, RoomPatientInfo]) => {
                                const elapsed = Math.floor((now.getTime() - new Date(info.startTime).getTime()) / 60000);
                                return elapsed >= 60;
                            }).length}</p>
                            <p className="text-[9px] text-slate-500 uppercase">Gecikmiş</p>
                        </div>
                    </div>
                </div>


                {/* FDG ve Galyum-68 Flakon Durumu */}
                <div className="grid grid-cols-2 gap-4">
                    {/* FDG Flakonları */}
                    <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/60 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 blur-[80px] animate-pulse"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl animate-bounce">💙</span>
                                    <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider">FDG (F-18)</h3>
                                </div>
                                <div className="px-3 py-1 bg-blue-500/20 rounded-lg">
                                    <span className="text-xs font-bold text-blue-300">
                                        {allVials.filter(v => v.isotopeId === 'f18').length} Flakon
                                    </span>
                                </div>
                            </div>

                            {/* FDG Toplam Doz */}
                            <div className="bg-blue-500/10 rounded-xl p-4 mb-3 border border-blue-500/20">
                                <div className="text-center">
                                    <div className="text-4xl font-black text-blue-400 tabular-nums animate-pulse">
                                        {allVials.filter(v => v.isotopeId === 'f18').reduce((sum, v) => sum + v.currentActivity, 0).toFixed(1)}
                                        <span className="text-lg ml-1 text-blue-300">{unit}</span>
                                    </div>
                                    <div className="text-[10px] text-blue-300/60 font-bold uppercase mt-1">Toplam Mevcut Aktivite</div>
                                </div>
                            </div>

                            {/* FDG Flakon Listesi */}
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {allVials.filter(v => v.isotopeId === 'f18').length > 0 ? (
                                    allVials.filter(v => v.isotopeId === 'f18').map((vial, idx) => (
                                        <div key={vial.id} className="flex items-center justify-between bg-blue-500/5 rounded-lg px-3 py-2 border border-blue-500/10 hover:bg-blue-500/10 transition-colors" style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.1}s both` }}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center text-sm">💉</div>
                                                <div>
                                                    <p className="text-xs font-bold text-white">Flakon #{idx + 1}</p>
                                                    <p className="text-[10px] text-blue-300/60">{new Date(vial.calibrationTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-blue-400">{vial.currentActivity.toFixed(1)}</div>
                                                <div className="text-[8px] text-blue-300/50 uppercase">{unit}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-blue-300/40 text-xs">FDG flakon yok</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Galyum-68 Flakonları */}
                    <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/60 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-10 blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>💚</span>
                                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider">Galyum-68</h3>
                                </div>
                                <div className="px-3 py-1 bg-emerald-500/20 rounded-lg">
                                    <span className="text-xs font-bold text-emerald-300">
                                        {allVials.filter(v => v.isotopeId === 'ga68').length} Flakon
                                    </span>
                                </div>
                            </div>

                            {/* Ga-68 Toplam Doz */}
                            <div className="bg-emerald-500/10 rounded-xl p-4 mb-3 border border-emerald-500/20">
                                <div className="text-center">
                                    <div className="text-4xl font-black text-emerald-400 tabular-nums animate-pulse" style={{ animationDelay: '0.3s' }}>
                                        {allVials.filter(v => v.isotopeId === 'ga68').reduce((sum, v) => sum + v.currentActivity, 0).toFixed(1)}
                                        <span className="text-lg ml-1 text-emerald-300">{unit}</span>
                                    </div>
                                    <div className="text-[10px] text-emerald-300/60 font-bold uppercase mt-1">Toplam Mevcut Aktivite</div>
                                </div>
                            </div>

                            {/* Ga-68 Flakon Listesi */}
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {allVials.filter(v => v.isotopeId === 'ga68').length > 0 ? (
                                    allVials.filter(v => v.isotopeId === 'ga68').map((vial, idx) => (
                                        <div key={vial.id} className="flex items-center justify-between bg-emerald-500/5 rounded-lg px-3 py-2 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors" style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.1}s both` }}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center text-sm">💉</div>
                                                <div>
                                                    <p className="text-xs font-bold text-white">Flakon #{idx + 1}</p>
                                                    <p className="text-[10px] text-emerald-300/60">{new Date(vial.calibrationTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-emerald-400">{vial.currentActivity.toFixed(1)}</div>
                                                <div className="text-[8px] text-emerald-300/50 uppercase">{unit}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-emerald-300/40 text-xs">Ga-68 flakon yok</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📊 Gelişmiş İstatistikler */}
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6">
                    <h3 className="text-[9px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">📊 BUGÜNÜN İSTATİSTİKLERİ</h3>

                    {/* Ana İstatistikler */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                        <div className="text-center bg-slate-800/30 rounded-xl p-3">
                            <div className="text-2xl md:text-3xl font-black text-white">{stats.total}</div>
                            <div className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase mt-1">Toplam Hasta</div>
                        </div>
                        <div className="text-center bg-emerald-500/10 rounded-xl p-3">
                            <div className="text-2xl md:text-3xl font-black text-emerald-400">{stats.completed}</div>
                            <div className="text-[7px] md:text-[8px] font-black text-emerald-300/50 uppercase mt-1">Tamamlanan</div>
                        </div>
                        <div className="text-center bg-blue-500/10 rounded-xl p-3">
                            <div className="text-2xl md:text-3xl font-black text-blue-400">{stats.occupiedRooms}<span className="text-sm md:text-lg text-blue-300/50">/7</span></div>
                            <div className="text-[7px] md:text-[8px] font-black text-blue-300/50 uppercase mt-1">Dolu Oda</div>
                        </div>
                        <div className="text-center bg-orange-500/10 rounded-xl p-3">
                            <div className="text-2xl md:text-3xl font-black text-orange-400">{additionalScanPatients.length}</div>
                            <div className="text-[7px] md:text-[8px] font-black text-orange-300/50 uppercase mt-1">Ek Çekim</div>
                        </div>
                    </div>

                    {/* Mini Grafik - Prosedür Dağılımı */}
                    <div className="bg-slate-800/30 rounded-xl p-4">
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-3">Prosedür Dağılımı</h4>
                        <div className="flex items-end gap-1 h-16">
                            {(() => {
                                const procedureCounts: Record<string, number> = {};
                                history.forEach(h => {
                                    const proc = h.procedure || 'Diğer';
                                    procedureCounts[proc] = (procedureCounts[proc] || 0) + 1;
                                });
                                const entries = Object.entries(procedureCounts).slice(0, 6);
                                const maxCount = Math.max(...entries.map(([_, c]) => c), 1);
                                const colors = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

                                return entries.map(([proc, count], i) => (
                                    <div key={proc} className="flex-1 flex flex-col items-center">
                                        <div
                                            className={`w-full ${colors[i % colors.length]} rounded-t-md transition-all`}
                                            style={{ height: `${(count / maxCount) * 60}px` }}
                                            title={`${proc}: ${count}`}
                                        />
                                        <span className="text-[7px] text-slate-500 mt-1 truncate w-full text-center">{proc.slice(0, 8)}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* 👨‍⚕️ Hasta Detay Modalı */}
            {showPatientModal && selectedPatient && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPatientModal(false)}>
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-purple-900/40 p-4 md:p-6 border-b border-white/10">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-purple-500 flex items-center justify-center text-2xl md:text-3xl">
                                        👤
                                    </div>
                                    <div>
                                        <h2 className="text-lg md:text-xl font-black text-white">{selectedPatient.patientName}</h2>
                                        <p className="text-xs text-purple-300">{selectedPatient.procedure}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowPatientModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 md:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                            {/* Hasta Bilgileri */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                <div className="bg-slate-800/50 rounded-xl p-3">
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">Enjeksiyon Saati</p>
                                    <p className="text-sm font-bold text-white">
                                        {new Date(selectedPatient.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-3">
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">Doz</p>
                                    <p className="text-sm font-bold text-white">{selectedPatient.dose?.toFixed(1)} {unit}</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-3">
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">İzotop</p>
                                    <p className="text-sm font-bold text-white">{selectedPatient.isotopeId || 'F-18'}</p>
                                </div>
                                {/* Kan Şekeri */}
                                <div className={`bg-slate-800/50 rounded-xl p-3 ${selectedPatient.bloodGlucose && parseInt(selectedPatient.bloodGlucose) > 200 ? 'border border-red-500/50 bg-red-900/10' : ''}`}>
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">Kan Şekeri</p>
                                    <p className={`text-sm font-bold ${selectedPatient.bloodGlucose && parseInt(selectedPatient.bloodGlucose) > 200 ? 'text-red-400' : 'text-white'}`}>
                                        {selectedPatient.bloodGlucose ? `${selectedPatient.bloodGlucose} mg/dL` : 'Belirtilmemiş'}
                                    </p>
                                </div>
                                {/* Durum */}
                                <div className="bg-slate-800/50 rounded-xl p-3">
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">Durum</p>
                                    <p className="text-sm font-bold text-emerald-400">
                                        {patientsInImaging[selectedPatient.id] ? '📸 Çekimde' :
                                            Object.values(patientsInRooms).find((r: any) => r.patientId === selectedPatient.id) ? '💉 Odada' :
                                                '✓ Tamamlandı'}
                                    </p>
                                </div>
                                {/* İlaçlar */}
                                <div className="bg-slate-800/50 rounded-xl p-3">
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">Enjeksiyon Öncesi İlaçlar</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {selectedPatient.medications?.oralKontrast && (
                                            <span className="px-1.5 py-0.5 rounded bg-purple-500/30 text-[9px] font-bold text-purple-300 border border-purple-500/50">Oral Kontrast</span>
                                        )}
                                        {selectedPatient.medications?.xanax && (
                                            <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-[9px] font-bold text-blue-300 border border-blue-500/50">Xanax</span>
                                        )}
                                        {selectedPatient.medications?.lasix && (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-[9px] font-bold text-amber-300 border border-amber-500/50">Lasix</span>
                                        )}
                                        {!selectedPatient.medications?.oralKontrast && !selectedPatient.medications?.xanax && !selectedPatient.medications?.lasix && (
                                            <span className="text-[10px] text-slate-500 italic">İlaç verilmedi</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="bg-slate-800/30 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-white mb-3">📍 Hasta Akışı</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm">💉</div>
                                        <div>
                                            <p className="text-xs font-bold text-white">Enjeksiyon Yapıldı</p>
                                            <p className="text-[10px] text-slate-400">
                                                {new Date(selectedPatient.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    {Object.values(patientsInRooms).find((r: any) => r.patientId === selectedPatient.id) && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm">🚪</div>
                                            <div>
                                                <p className="text-xs font-bold text-white">Odaya Alındı</p>
                                                <p className="text-[10px] text-slate-400">Oda {(Object.values(patientsInRooms).find((r: any) => r.patientId === selectedPatient.id) as any)?.roomId}</p>
                                            </div>
                                        </div>
                                    )}
                                    {patientsInImaging[selectedPatient.id] && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-sm">📸</div>
                                            <div>
                                                <p className="text-xs font-bold text-white">Çekim Başladı</p>
                                                <p className="text-[10px] text-slate-400">
                                                    {new Date(patientsInImaging[selectedPatient.id].startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 📋 Prosedür Notları */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-amber-400">📝 Prosedür Notları</h4>
                                    {editingNote !== selectedPatient.id && (
                                        <button
                                            onClick={() => { setEditingNote(selectedPatient.id); setNoteText(patientNotes[selectedPatient.id] || ''); }}
                                            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold"
                                        >
                                            {patientNotes[selectedPatient.id] ? 'Düzenle' : '+ Not Ekle'}
                                        </button>
                                    )}
                                </div>

                                {editingNote === selectedPatient.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            placeholder="Hasta için not yazın..."
                                            className="w-full bg-slate-900/50 border border-amber-500/30 rounded-lg p-3 text-sm text-white placeholder-slate-500 resize-none"
                                            rows={3}
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => saveNote(selectedPatient.id, noteText)}
                                                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold"
                                            >
                                                Kaydet
                                            </button>
                                            <button
                                                onClick={() => { setEditingNote(null); setNoteText(''); }}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold"
                                            >
                                                İptal
                                            </button>
                                        </div>
                                    </div>
                                ) : patientNotes[selectedPatient.id] ? (
                                    <p className="text-sm text-white/80 whitespace-pre-wrap">{patientNotes[selectedPatient.id]}</p>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">Henüz not eklenmemiş</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {
                showAcademicResource && (
                    <DoctorAcademicResource onClose={() => setShowAcademicResource(false)} />
                )
            }
        </div >
    );
};

// Status Card Component
interface StatusCardProps {
    title: string;
    count: number;
    color: 'blue' | 'amber' | 'emerald' | 'rose';
    emoji: string;
    patients: DoseLogEntry[];
    now: Date;
    onStartImaging?: (patientId: string, patientName: string) => void;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, count, color, emoji, patients, now, onStartImaging }) => {
    const [expanded, setExpanded] = React.useState(false);

    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
        amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
        emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
        rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400'
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform`}
            onClick={() => setExpanded(!expanded)}>
            <div className="text-center">
                <div className="text-3xl mb-2">{emoji}</div>
                <div className="text-4xl font-black">{count}</div>
                <div className="text-[8px] font-black uppercase mt-2 opacity-60">{title}</div>
            </div>

            {expanded && patients.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2" onClick={(e) => e.stopPropagation()}>
                    {patients.map(p => {
                        const mins = Math.floor((now.getTime() - new Date(p.timestamp).getTime()) / 60000);
                        return (
                            <div key={p.id} className="flex items-center justify-between text-xs bg-black/20 rounded-lg p-2">
                                <div>
                                    <div className="font-bold text-white">{p.patientName}</div>
                                    <div className="text-[8px] opacity-60">{mins} dk</div>
                                </div>
                                {onStartImaging && (color === 'emerald' || color === 'rose') && (
                                    <button
                                        onClick={() => onStartImaging(p.id, p.patientName)}
                                        className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-[8px] font-black"
                                    >
                                        AL
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

