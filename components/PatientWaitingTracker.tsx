import React, { useEffect, useState, useMemo } from 'react';
import { DoseLogEntry, DoseStatus, Isotope } from '../types';
import { RegionSelector } from './RegionSelector';

// Enjeksiyon Odaları - 7 adet
// Enjeksiyon Odaları - 7 adet
const INJECTION_ROOMS = [
    { id: 'B1', name: 'B1' },
    { id: 'B2', name: 'B2' },
    { id: 'B3', name: 'B3' },
    { id: 'B4', name: 'B4' },
    { id: 'B5', name: 'B5' },
    { id: 'A1', name: 'A1' },
    { id: 'A2', name: 'A2' },
];

// Oda hastası tipi
type RoomPatientInfo = { roomId: string; startTime: Date; patientId: string; patientName: string };

interface PatientWaitingTrackerProps {
    history: DoseLogEntry[];
    selectedIsotope: Isotope;
    now: Date;
    onNotify: (message: string, type: 'info' | 'warning' | 'error' | 'success', description?: string) => void;
    onRequestAdditionalImaging?: (entryId: string, region: string, doseNeeded: boolean, scheduledMinutes?: number) => void;
    onMarkAsInjected?: (entryId: string) => void;
    // Çekimdeki hastalar (eski)
    patientsInImaging?: Record<string, { startTime: Date }>;
    setPatientsInImaging?: React.Dispatch<React.SetStateAction<Record<string, { startTime: Date }>>>;
    // Ek çekim hastaları
    additionalImagingPatients?: Record<string, { region: string; addedAt: Date; scheduledMinutes: number }>;
    setAdditionalImagingPatients?: React.Dispatch<React.SetStateAction<Record<string, { region: string; addedAt: Date; scheduledMinutes: number }>>>;
    // Enjeksiyon odaları
    patientsInRooms?: Record<string, { roomId: string; startTime: Date; patientId: string; patientName: string }>;
    onAssignToRoom?: (patientId: string, patientName: string, roomId: string) => void;
    onRemoveFromRoom?: (roomId: string) => void;
}

interface WaitingPatient {
    entry: DoseLogEntry;
    minutesPassed: number;
    status: 'waiting' | 'bathroom' | 'ready' | 'delayed' | 'imaging' | 'additionalReady' | 'inRoom';
    roomId?: string;
}

export const PatientWaitingTracker: React.FC<PatientWaitingTrackerProps> = ({
    history,
    selectedIsotope,
    now,
    onNotify,
    onRequestAdditionalImaging,
    onMarkAsInjected,
    patientsInImaging: externalPatientsInImaging,
    setPatientsInImaging: externalSetPatientsInImaging,
    additionalImagingPatients: externalAdditionalImagingPatients,
    setAdditionalImagingPatients: externalSetAdditionalImagingPatients,
    patientsInRooms = {},
    onAssignToRoom,
    onRemoveFromRoom
}) => {
    // Local time state to keep calculations up‑to‑date as real time passes
    const [currentTime, setCurrentTime] = useState<Date>(now);

    // Update currentTime every minute (or every 30 seconds for smoother UI)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 30_000); // 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Keep currentTime in sync if the parent provides a new "now" prop (e.g., on manual refresh)
    useEffect(() => {
        setCurrentTime(now);
    }, [now]);
    const [notifiedPatients, setNotifiedPatients] = useState<Record<string, { bathroom: boolean; ready: boolean; delayed: boolean; roomReady: boolean; critical: boolean }>>({});
    const [showAlert, setShowAlert] = useState<{ message: string; type: 'bathroom' | 'ready' | 'delayed' | 'roomReady' | 'critical' } | null>(null);

    // Local state kullan eğer external prop verilmediyse
    const [localPatientsInImaging, setLocalPatientsInImaging] = useState<Record<string, { startTime: Date }>>({});
    const patientsInImaging = externalPatientsInImaging || localPatientsInImaging;
    const setPatientsInImaging = externalSetPatientsInImaging || setLocalPatientsInImaging;

    const [localAdditionalImagingPatients, setLocalAdditionalImagingPatients] = useState<Record<string, { region: string; addedAt: Date; scheduledMinutes: number }>>({});
    const additionalImagingPatients = externalAdditionalImagingPatients || localAdditionalImagingPatients;
    const setAdditionalImagingPatients = externalSetAdditionalImagingPatients || setLocalAdditionalImagingPatients;

    const [showFinishDialog, setShowFinishDialog] = useState<{ patientId: string; patientName: string } | null>(null);
    const [showRoomSelector, setShowRoomSelector] = useState<{ patientId: string; patientName: string } | null>(null);
    const [showCriticalAlert, setShowCriticalAlert] = useState<{ patientName: string; roomId: string; minutes: number } | null>(null);
    const [showTimeSelector, setShowTimeSelector] = useState<{ patientId: string; patientName: string; region: string } | null>(null);
    const [showRegionSelector, setShowRegionSelector] = useState<{ patientId: string; patientName: string } | null>(null);

    // 🔍 Arama state'i
    const [searchQuery, setSearchQuery] = useState('');

    // PET izotopları - hem FDG hem Ga-68 aynı oda sistemini kullanır
    const PET_ISOTOPES = ['f18', 'ga68'];
    const isPETIsotope = PET_ISOTOPES.includes(selectedIsotope.id);

    // FDG için bekleme süreleri (dakika cinsinden) - yarı ömür ~110 dk
    const FDG_BATHROOM_TIME = 45;  // 45 dakika - tuvalete gönder
    const FDG_READY_TIME = 60;     // 60 dakika - çekime hazır (1 saat uyarı)
    const FDG_DELAYED_TIME = 75;   // 75 dakika - süre geçti
    const FDG_CRITICAL_TIME = 90;  // 90 dakika - kritik uyarı (1.5 saat)

    // Ga-68 için bekleme süreleri - yarı ömür ~68 dk (daha kısa)
    const GA68_BATHROOM_TIME = 30;  // 30 dakika - tuvalete gönder
    const GA68_READY_TIME = 45;     // 45 dakika - çekime hazır
    const GA68_DELAYED_TIME = 60;   // 60 dakika - süre geçti
    const GA68_CRITICAL_TIME = 75;  // 75 dakika - kritik uyarı

    // Seçili izotopa göre süreleri belirle
    const BATHROOM_TIME = selectedIsotope.id === 'ga68' ? GA68_BATHROOM_TIME : FDG_BATHROOM_TIME;
    const READY_TIME = selectedIsotope.id === 'ga68' ? GA68_READY_TIME : FDG_READY_TIME;
    const DELAYED_TIME = selectedIsotope.id === 'ga68' ? GA68_DELAYED_TIME : FDG_DELAYED_TIME;
    const CRITICAL_TIME = selectedIsotope.id === 'ga68' ? GA68_CRITICAL_TIME : FDG_CRITICAL_TIME;

    // Odadaki hasta ID'lerini al
    const roomValues = Object.values(patientsInRooms) as RoomPatientInfo[];
    const patientsInRoomIds = roomValues.map(p => p.patientId);

    // Bekleyen hastaları hesapla - odadakiler dahil (PET izotopları için)
    const waitingPatients: WaitingPatient[] = history
        .filter(entry => entry.status === DoseStatus.PREPARED && isPETIsotope)
        .map(entry => {
            const minutesPassed = (currentTime.getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60);

            // Ek çekim için bekleyen
            if (additionalImagingPatients[entry.id]) {
                return { entry, minutesPassed, status: 'additionalReady' as const };
            }

            // Çekimde
            if (patientsInImaging[entry.id]) {
                return { entry, minutesPassed, status: 'imaging' as const };
            }

            // Odada
            const roomInfo = roomValues.find(r => r.patientId === entry.id);
            if (roomInfo) {
                let status: WaitingPatient['status'] = 'inRoom';
                // Oda bazlı süre hesapla
                const roomMinutes = (currentTime.getTime() - new Date(roomInfo.startTime).getTime()) / (1000 * 60);
                if (roomMinutes >= DELAYED_TIME) status = 'delayed';
                else if (roomMinutes >= READY_TIME) status = 'ready';
                else if (roomMinutes >= BATHROOM_TIME) status = 'bathroom';
                else status = 'inRoom';
                return { entry, minutesPassed: roomMinutes, status, roomId: roomInfo.roomId };
            }

            let status: WaitingPatient['status'] = 'waiting';
            if (minutesPassed >= DELAYED_TIME) status = 'delayed';
            else if (minutesPassed >= READY_TIME) status = 'ready';
            else if (minutesPassed >= BATHROOM_TIME) status = 'bathroom';
            return { entry, minutesPassed, status };
        })
        .filter(p => p.minutesPassed < 120);

    // Boş odaları bul
    const occupiedRoomIds = roomValues.map(r => r.roomId);
    const availableRooms = INJECTION_ROOMS.filter(room => !occupiedRoomIds.includes(room.id));

    // Enjeksiyon sonrası oda seçimi göster
    const handleShowRoomSelector = (patientId: string, patientName: string) => {
        if (availableRooms.length === 0) {
            onNotify('Oda Yok', 'warning', 'Tüm odalar dolu! Lütfen bir odayı boşaltın.');
            return;
        }
        setShowRoomSelector({ patientId, patientName });
    };

    // Oda seçimi onayla
    const handleSelectRoom = (roomId: string) => {
        if (!showRoomSelector || !onAssignToRoom) return;
        onAssignToRoom(showRoomSelector.patientId, showRoomSelector.patientName, roomId);
        setShowRoomSelector(null);
    };

    const handleStartImaging = (patientId: string, patientName: string) => {
        // Önce odadan çıkar
        if (onRemoveFromRoom) {
            const roomInfo = roomValues.find(r => r.patientId === patientId);
            if (roomInfo) {
                onRemoveFromRoom(roomInfo.roomId);
            }
        }
        setPatientsInImaging(prev => ({ ...prev, [patientId]: { startTime: new Date() } }));
        onNotify('Çekime Alındı', 'success', `${patientName} PET/BT çekimine alındı.`);
    };

    const handleFinishImaging = (patientId: string, patientName: string) => {
        // Check if this is an additional imaging patient by looking at the imaging state
        const imagingInfo = patientsInImaging[patientId] as { startTime: Date; isAdditionalImaging?: boolean } | undefined;
        const isAdditionalImagingPatient = imagingInfo?.isAdditionalImaging === true;

        // Remove from imaging first
        setPatientsInImaging(prev => {
            const newState = { ...prev };
            delete newState[patientId];
            return newState;
        });

        if (isAdditionalImagingPatient) {
            // Ek çekim hastası - direkt tamamlandılar'a gönder
            if (onMarkAsInjected) onMarkAsInjected(patientId);
            onNotify('Ek Çekim Tamamlandı', 'success', `${patientName} ek çekimi başarıyla tamamlandı.`);
        } else {
            // Normal hasta - dialog göster
            setShowFinishDialog({ patientId, patientName });
        }
    };

    const confirmFinishImaging = (needsAdditionalImaging: boolean) => {
        if (!showFinishDialog) return;
        const { patientId, patientName } = showFinishDialog;

        setPatientsInImaging(prev => {
            const newState = { ...prev };
            delete newState[patientId];
            return newState;
        });

        if (needsAdditionalImaging) {
            // RegionSelector modal'ı göster
            setShowFinishDialog(null);
            setShowRegionSelector({ patientId, patientName });
        } else {
            if (onMarkAsInjected) onMarkAsInjected(patientId);
            onNotify('Çekim Tamamlandı', 'success', `${patientName} çekimi başarıyla tamamlandı.`);
            setShowFinishDialog(null);
        }
    };

    // Region seçildiğinde
    const handleRegionSelect = (region: string) => {
        if (!showRegionSelector) return;
        const { patientId, patientName } = showRegionSelector;
        setShowRegionSelector(null);
        setShowTimeSelector({ patientId, patientName, region });
    };

    // Ek çekim için süre seçimi
    const handleSelectAdditionalTime = (scheduledMinutes: number) => {
        if (!showTimeSelector) return;
        const { patientId, patientName, region } = showTimeSelector;

        if (onRequestAdditionalImaging) {
            onRequestAdditionalImaging(patientId, region, false, scheduledMinutes);
        } else {
            setAdditionalImagingPatients(prev => ({
                ...prev,
                [patientId]: { region, addedAt: new Date(), scheduledMinutes }
            }));
            const timeLabel = scheduledMinutes === 60 ? '1 saat' : scheduledMinutes === 90 ? '1.5 saat' : '2 saat';
            onNotify('Ek Çekim Planlandı', 'info', `${patientName} için ${region} bölgesi ${timeLabel} sonra çekime alınacak.`);
        }
        setShowTimeSelector(null);
    };

    const handleStartImagingWithAdditional = (patientId: string, patientName: string) => {
        const additionalInfo = additionalImagingPatients[patientId];
        // Add isAdditionalImaging flag to track this is an additional imaging patient
        setPatientsInImaging(prev => ({ ...prev, [patientId]: { startTime: new Date(), isAdditionalImaging: true } }));
        setAdditionalImagingPatients(prev => {
            const newState = { ...prev };
            delete newState[patientId];
            return newState;
        });
        onNotify('Ek Çekime Alındı', 'success', `${patientName} ${additionalInfo?.region || ''} ek çekimine alındı.`);
    };

    useEffect(() => {
        waitingPatients.forEach(patient => {
            const patientNotifs = notifiedPatients[patient.entry.id] || { bathroom: false, ready: false, delayed: false, roomReady: false, critical: false };

            // Çekimdeki hastaları atla
            if (patient.status === 'imaging') return;

            // ODADA OLAN HASTALAR İÇİN UYARILAR
            if (patient.roomId !== undefined) {
                // 60 dakika (1 saat) - Çekime Hazır Uyarısı
                if (patient.minutesPassed >= READY_TIME && patient.minutesPassed < CRITICAL_TIME && !patientNotifs.roomReady) {
                    setShowAlert({ message: `ODA ${patient.roomId}: ${patient.entry.patientName} ÇEKİME HAZIR!`, type: 'roomReady' });
                    onNotify('⏰ 1 Saat Doldu!', 'warning', `Oda ${patient.roomId} - ${patient.entry.patientName} çekime alınmalı!`);
                    setNotifiedPatients(prev => ({ ...prev, [patient.entry.id]: { ...patientNotifs, roomReady: true } }));
                    setTimeout(() => setShowAlert(null), 10000);
                }

                // 90 dakika (1.5 saat) - KRİTİK UYARI
                if (patient.minutesPassed >= CRITICAL_TIME && !patientNotifs.critical) {
                    setShowCriticalAlert({
                        patientName: patient.entry.patientName,
                        roomId: patient.roomId,
                        minutes: Math.floor(patient.minutesPassed)
                    });
                    onNotify('🚨 KRİTİK - 1.5 SAAT GEÇTİ!', 'error', `Oda ${patient.roomId} - ${patient.entry.patientName} ACİL çekime alınmalı! Görüntü kalitesi etkilenebilir!`);
                    setNotifiedPatients(prev => ({ ...prev, [patient.entry.id]: { ...patientNotifs, critical: true } }));
                    // Kritik uyarı 15 saniye gösterilsin
                    setTimeout(() => setShowCriticalAlert(null), 15000);
                }
                return; // Odadaki hastalar için diğer uyarıları atla
            }

            // ODADA OLMAYAN HASTALAR İÇİN UYARILAR (eski mantık)
            if (patient.minutesPassed >= BATHROOM_TIME && patient.minutesPassed < READY_TIME && !patientNotifs.bathroom) {
                setShowAlert({ message: `${patient.entry.patientName} tuvalete gönderilmeli!`, type: 'bathroom' });
                onNotify('Tuvalet Zamanı', 'info', `${patient.entry.patientName} için bekleme süresi doldu.`);
                setNotifiedPatients(prev => ({ ...prev, [patient.entry.id]: { ...patientNotifs, bathroom: true } }));
                setTimeout(() => setShowAlert(null), 8000);
            }

            if (patient.minutesPassed >= READY_TIME && patient.minutesPassed < DELAYED_TIME && !patientNotifs.ready) {
                setShowAlert({ message: `${patient.entry.patientName} çekime hazır!`, type: 'ready' });
                onNotify('Çekime Hazır', 'success', `${patient.entry.patientName} çekime alınabilir.`);
                setNotifiedPatients(prev => ({ ...prev, [patient.entry.id]: { ...patientNotifs, ready: true } }));
                setTimeout(() => setShowAlert(null), 8000);
            }

            if (patient.minutesPassed >= DELAYED_TIME && !patientNotifs.delayed) {
                setShowAlert({ message: `${patient.entry.patientName} çekim süresi geçti!`, type: 'delayed' });
                onNotify('⚠️ Süre Geçti', 'warning', `${patient.entry.patientName} için çekim süresini artırın!`);
                setNotifiedPatients(prev => ({ ...prev, [patient.entry.id]: { ...patientNotifs, delayed: true } }));
                setTimeout(() => setShowAlert(null), 10000);
            }
        });
    }, [waitingPatients, notifiedPatients, onNotify]);

    // Henüz odaya alınmamış hastalar (yeni enjekte edilmiş)
    const patientsWithoutRoom = waitingPatients.filter(p =>
        p.status !== 'imaging' &&
        p.status !== 'additionalReady' &&
        !patientsInRoomIds.includes(p.entry.id)
    );

    // Odadaki hastalar
    const patientsInRoomsList = waitingPatients.filter(p => patientsInRoomIds.includes(p.entry.id));

    // 📊 İstatistikleri hesapla
    const stats = useMemo(() => ({
        total: waitingPatients.length,
        inRooms: patientsInRoomsList.length,
        inImaging: waitingPatients.filter(p => p.status === 'imaging').length,
        additionalWaiting: waitingPatients.filter(p => p.status === 'additionalReady').length,
        ready: waitingPatients.filter(p => p.status === 'ready').length,
        delayed: waitingPatients.filter(p => p.status === 'delayed').length,
    }), [waitingPatients, patientsInRoomsList]);

    // 🔍 Arama ile filtreleme
    const filteredPatientsWithoutRoom = useMemo(() => {
        if (!searchQuery.trim()) return patientsWithoutRoom;
        const query = searchQuery.toLowerCase();
        return patientsWithoutRoom.filter(p =>
            p.entry.patientName.toLowerCase().includes(query) ||
            p.entry.procedure?.toLowerCase().includes(query)
        );
    }, [patientsWithoutRoom, searchQuery]);

    const filteredPatientsInRooms = useMemo(() => {
        if (!searchQuery.trim()) return patientsInRoomsList;
        const query = searchQuery.toLowerCase();
        return patientsInRoomsList.filter(p =>
            p.entry.patientName.toLowerCase().includes(query) ||
            p.entry.procedure?.toLowerCase().includes(query)
        );
    }, [patientsInRoomsList, searchQuery]);

    if (waitingPatients.length === 0) return null;

    const getStatusColor = (status: WaitingPatient['status']) => {
        switch (status) {
            case 'waiting': return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
            case 'bathroom': return 'from-amber-500/20 to-amber-600/10 border-amber-500/30';
            case 'ready': return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30';
            case 'delayed': return 'from-rose-500/20 to-rose-600/10 border-rose-500/30';
            case 'imaging': return 'from-purple-500/20 to-purple-600/10 border-purple-500/30';
            case 'additionalReady': return 'from-orange-500/20 to-orange-600/10 border-orange-500/30';
            case 'inRoom': return 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30';
        }
    };

    const getStatusText = (status: WaitingPatient['status'], roomId?: string) => {
        switch (status) {
            case 'waiting': return 'Bekliyor';
            case 'bathroom': return 'Tuvalete Gönder';
            case 'ready': return 'Çekime Hazır';
            case 'delayed': return 'Süre Geçti!';
            case 'imaging': return 'ÇEKİMDE';
            case 'additionalReady': return 'EK ÇEKİM BEKLIYOR';
            case 'inRoom': return roomId ? `ODA ${roomId}` : 'ODADA';
        }
    };

    return (
        <>
            <RegionSelector
                isOpen={!!showRegionSelector}
                patientName={showRegionSelector?.patientName || ''}
                onSelect={handleRegionSelect}
                onClose={() => setShowRegionSelector(null)}
            />

            {/* 🔍 Arama ve 🩺 Hızlı Durum Özeti */}
            <div className="mb-4 space-y-3">
                {/* Arama */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Hasta ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            <svg className="h-4 w-4 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Hızlı Durum Özet Kartları */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-blue-400">{stats.total}</div>
                        <div className="text-[9px] font-bold text-blue-300/60 uppercase tracking-wide">Toplam Hasta</div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-cyan-400">{stats.inRooms}</div>
                        <div className="text-[9px] font-bold text-cyan-300/60 uppercase tracking-wide">Odada</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-purple-400">{stats.inImaging}</div>
                        <div className="text-[9px] font-bold text-purple-300/60 uppercase tracking-wide">Çekimde</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-orange-400">{stats.additionalWaiting}</div>
                        <div className="text-[9px] font-bold text-orange-300/60 uppercase tracking-wide">Ek Çekim</div>
                    </div>
                </div>

                {/* Hazır ve Gecikmiş Uyarıları */}
                {(stats.ready > 0 || stats.delayed > 0) && (
                    <div className="flex gap-2">
                        {stats.ready > 0 && (
                            <div className="flex-1 bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
                                <span className="text-lg">✅</span>
                                <span className="text-xs font-bold text-emerald-400">{stats.ready} hasta çekime hazır</span>
                            </div>
                        )}
                        {stats.delayed > 0 && (
                            <div className="flex-1 bg-rose-500/20 border border-rose-500/30 rounded-xl px-3 py-2 flex items-center gap-2 animate-pulse">
                                <span className="text-lg">⚠️</span>
                                <span className="text-xs font-bold text-rose-400">{stats.delayed} hasta gecikmiş!</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Oda Seçim Dialog */}
            {showRoomSelector && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full animate-in zoom-in-95 fade-in duration-300 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-white mb-1">Oda Seçin</h3>
                            <p className="text-sm text-slate-400">{showRoomSelector.patientName} için enjeksiyon odası</p>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {availableRooms.map(room => (
                                <button
                                    key={room.id}
                                    onClick={() => handleSelectRoom(room.id)}
                                    className="py-4 bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 hover:text-white rounded-xl font-black text-lg transition-all active:scale-95"
                                >
                                    {room.id}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowRoomSelector(null)}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                            İptal
                        </button>
                    </div>
                </div>
            )}

            {/* Ek Çekim Süre Seçim Dialog */}
            {showTimeSelector && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full animate-in zoom-in-95 fade-in duration-300 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-white mb-1">Ek Çekim Süresi</h3>
                            <p className="text-sm text-slate-400">{showTimeSelector.patientName}</p>
                            <p className="text-xs text-orange-400 font-bold mt-1">{showTimeSelector.region} bölgesi</p>
                        </div>

                        <p className="text-center text-xs text-slate-500 mb-4">
                            Hasta ne kadar süre sonra çekime alınacak?
                        </p>

                        <div className="space-y-2 mb-4">
                            <button
                                onClick={() => handleSelectAdditionalTime(60)}
                                className="w-full py-4 bg-blue-500/20 hover:bg-blue-500 border border-blue-500/30 hover:border-blue-400 text-blue-400 hover:text-white rounded-xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span>🕐</span>
                                <span>1 Saat</span>
                            </button>
                            <button
                                onClick={() => handleSelectAdditionalTime(90)}
                                className="w-full py-4 bg-amber-500/20 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-white rounded-xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span>🕜</span>
                                <span>1.5 Saat</span>
                            </button>
                            <button
                                onClick={() => handleSelectAdditionalTime(120)}
                                className="w-full py-4 bg-purple-500/20 hover:bg-purple-500 border border-purple-500/30 hover:border-purple-400 text-purple-400 hover:text-white rounded-xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span>🕑</span>
                                <span>2 Saat</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowTimeSelector(null)}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                            İptal
                        </button>
                    </div>
                </div>
            )}

            {/* Çekim Bitirme Dialog */}
            {showFinishDialog && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 fade-in duration-300 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">{showFinishDialog.patientName}</h3>
                            <p className="text-sm text-slate-400">Çekim tamamlandı mı?</p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => confirmFinishImaging(false)}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-[0.98]"
                            >
                                ✓ Çekim Tamamlandı
                            </button>
                            <button
                                onClick={() => confirmFinishImaging(true)}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-[0.98]"
                            >
                                📸 Ek Çekim Gerekli
                            </button>
                            <button
                                onClick={() => setShowFinishDialog(null)}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Büyük Animasyonlu Alert */}
            {showAlert && (
                <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
                    <div className={`
                        animate-in zoom-in-95 fade-in duration-500 px-8 py-6 rounded-3xl border-2 shadow-2xl backdrop-blur-xl
                        ${showAlert.type === 'bathroom' ? 'bg-amber-500/90 border-amber-300 text-white' : ''}
                        ${showAlert.type === 'ready' ? 'bg-emerald-500/90 border-emerald-300 text-white' : ''}
                        ${showAlert.type === 'delayed' ? 'bg-rose-500/90 border-rose-300 text-white animate-pulse' : ''}
                        ${showAlert.type === 'roomReady' ? 'bg-purple-500/90 border-purple-300 text-white animate-pulse' : ''}
                    `}>
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center
                                ${showAlert.type === 'bathroom' ? 'bg-amber-400' : ''}
                                ${showAlert.type === 'ready' ? 'bg-emerald-400' : ''}
                                ${showAlert.type === 'delayed' ? 'bg-rose-400 animate-bounce' : ''}
                                ${showAlert.type === 'roomReady' ? 'bg-purple-400 animate-bounce' : ''}
                            `}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-black tracking-tight">{showAlert.message}</p>
                                <p className="text-sm font-bold opacity-80 mt-1">
                                    {showAlert.type === 'bathroom' && '🚻 Hastayı tuvalete yönlendirin'}
                                    {showAlert.type === 'ready' && '📸 Hasta PET çekimine alınabilir'}
                                    {showAlert.type === 'delayed' && '⏰ Çekim süresini artırın!'}
                                    {showAlert.type === 'roomReady' && '⏰ 1 SAAT DOLDU - Çekime alın!'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🚨 KRİTİK UYARI - 1.5 SAAT GEÇTİ - Tam Ekran Animasyonlu */}
            {showCriticalAlert && (
                <div className="fixed inset-0 z-[300] pointer-events-auto flex items-center justify-center">
                    {/* Kırmızı yanıp sönen arka plan */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-rose-900 animate-pulse"></div>
                    <div className="absolute inset-0 bg-red-500/20" style={{ animation: 'pulse 0.5s ease-in-out infinite' }}></div>

                    {/* Parıldayan efekt */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-gradient-radial from-yellow-500/30 via-transparent to-transparent animate-spin" style={{ animation: 'spin 4s linear infinite' }}></div>
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
            )}

            {/* Yeni Enjekte Edilen Hastalar - Oda Seçimi */}
            {patientsWithoutRoom.length > 0 && onAssignToRoom && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                            💉 YENİ ENJEKSİYON - ODA SEÇİN ({patientsWithoutRoom.length})
                        </h3>
                    </div>

                    <div className="grid gap-3">
                        {patientsWithoutRoom.map(patient => (
                            <div
                                key={patient.entry.id}
                                className="relative overflow-hidden rounded-2xl p-4 border bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/30"
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/30 text-emerald-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">{patient.entry.patientName}</p>
                                            <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">{patient.entry.procedure}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleShowRoomSelector(patient.entry.id, patient.entry.patientName)}
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-95"
                                    >
                                        🏠 ODA SEÇ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Odadaki Hastalar */}
            {filteredPatientsInRooms.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            HASTA TAKİBİ - ODALARDA ({filteredPatientsInRooms.length})
                        </h3>
                    </div>

                    <div className="grid gap-3">
                        {filteredPatientsInRooms.map(patient => {
                            const mins = Math.floor(patient.minutesPassed);
                            const secs = Math.floor((patient.minutesPassed % 1) * 60);
                            const progressPercent = Math.min((patient.minutesPassed / 90) * 100, 100);

                            // Progress bar rengi
                            let progressColor = 'bg-cyan-500';
                            if (patient.status === 'delayed') progressColor = 'bg-rose-500';
                            else if (patient.status === 'ready') progressColor = 'bg-emerald-500';
                            else if (patient.status === 'bathroom') progressColor = 'bg-amber-500';

                            return (
                                <div
                                    key={patient.entry.id}
                                    className={`relative overflow-hidden rounded-2xl p-3 md:p-4 border bg-gradient-to-r ${getStatusColor(patient.status)} transition-all duration-500 hover:scale-[1.01]
                                        ${patient.status === 'delayed' ? 'animate-pulse' : ''}
                                        ${patient.status === 'ready' ? 'ring-2 ring-emerald-500/50' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-base md:text-lg
                                                ${patient.status === 'delayed' ? 'bg-rose-500/30 text-rose-400' : ''}
                                                ${patient.status === 'ready' ? 'bg-emerald-500/30 text-emerald-400' : ''}
                                                ${patient.status === 'bathroom' ? 'bg-amber-500/30 text-amber-400' : ''}
                                                ${patient.status === 'inRoom' ? 'bg-cyan-500/30 text-cyan-400' : ''}
                                            `}>
                                                {patient.roomId}
                                            </div>
                                            <div>
                                                <p className="text-xs md:text-sm font-black text-white">{patient.entry.patientName}</p>
                                                <p className="text-[8px] md:text-[9px] font-bold text-white/60 uppercase tracking-wider">{patient.entry.procedure}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="text-right">
                                                <p className={`text-base md:text-lg font-black tabular-nums
                                                    ${patient.status === 'delayed' ? 'text-rose-400' : ''}
                                                    ${patient.status === 'ready' ? 'text-emerald-400' : ''}
                                                    ${patient.status === 'bathroom' ? 'text-amber-400' : ''}
                                                    ${patient.status === 'inRoom' ? 'text-cyan-400' : ''}
                                                `}>
                                                    {mins}:{secs.toString().padStart(2, '0')}
                                                </p>
                                                <p className={`text-[7px] md:text-[8px] font-black uppercase tracking-wider
                                                    ${patient.status === 'delayed' ? 'text-rose-400' : ''}
                                                    ${patient.status === 'ready' ? 'text-emerald-400' : ''}
                                                    ${patient.status === 'bathroom' ? 'text-amber-400' : ''}
                                                    ${patient.status === 'inRoom' ? 'text-cyan-400' : ''}
                                                `}>
                                                    {getStatusText(patient.status, patient.roomId)}
                                                </p>
                                            </div>

                                            {/* Çekime Al Butonu */}
                                            <button
                                                onClick={() => handleStartImaging(patient.entry.id, patient.entry.patientName)}
                                                className={`px-2 md:px-3 py-1.5 md:py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-tight transition-all active:scale-95 ${patient.status === 'ready' || patient.status === 'delayed'
                                                    ? 'bg-purple-500 hover:bg-purple-400 text-white'
                                                    : 'bg-slate-600 hover:bg-purple-500 text-slate-300 hover:text-white'
                                                    }`}
                                            >
                                                {patient.status === 'ready' || patient.status === 'delayed'
                                                    ? '📸 Çekime Al'
                                                    : '⏱️ Erken Çekim'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* ⏱️ Progress Bar */}
                                    <div className="mt-2">
                                        <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                            <div
                                                className={`absolute left-0 top-0 h-full ${progressColor} transition-all duration-1000 ease-out`}
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                            {/* Milestone markers */}
                                            <div className="absolute top-0 left-[50%] w-0.5 h-full bg-white/20" title="45 dk" />
                                            <div className="absolute top-0 left-[66.7%] w-0.5 h-full bg-white/30" title="60 dk" />
                                            <div className="absolute top-0 left-[83.3%] w-0.5 h-full bg-white/20" title="75 dk" />
                                        </div>
                                        <div className="flex justify-between mt-0.5 text-[6px] md:text-[7px] text-slate-500 font-bold">
                                            <span>0</span>
                                            <span>45</span>
                                            <span>60</span>
                                            <span>90dk</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Çekimdeki Hastalar */}
            {waitingPatients.filter(p => p.status === 'imaging').length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">
                            📸 ÇEKİMDE ({waitingPatients.filter(p => p.status === 'imaging').length})
                        </h3>
                    </div>

                    <div className="grid gap-3">
                        {waitingPatients.filter(p => p.status === 'imaging').map(patient => {
                            const imagingInfo = patientsInImaging[patient.entry.id];
                            const imagingMinutes = imagingInfo ? (currentTime.getTime() - new Date(imagingInfo.startTime).getTime()) / (1000 * 60) : 0;
                            const imagingMins = Math.floor(imagingMinutes);
                            const imagingSecs = Math.floor((imagingMinutes % 1) * 60);

                            return (
                                <div
                                    key={patient.entry.id}
                                    className="relative overflow-hidden rounded-2xl p-4 border bg-gradient-to-r from-purple-500/20 to-purple-600/10 border-purple-500/30 ring-2 ring-purple-500/50"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/30 text-purple-400">
                                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white">{patient.entry.patientName}</p>
                                                <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">{patient.entry.procedure}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-lg font-black tabular-nums text-purple-400">
                                                    {imagingMins}:{imagingSecs.toString().padStart(2, '0')}
                                                </p>
                                                <p className="text-[8px] font-black uppercase tracking-wider text-purple-400">ÇEKİMDE</p>
                                            </div>
                                            <button
                                                onClick={() => handleFinishImaging(patient.entry.id, patient.entry.patientName)}
                                                className="px-3 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-[9px] font-black uppercase tracking-tight transition-all active:scale-95"
                                            >
                                                Bitir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Ek Çekim Bekleyenler - Doğrudan additionalImagingPatients'dan */}
            {Object.keys(additionalImagingPatients).length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                        <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">
                            ➕ EK ÇEKİM BEKLEYENLER ({Object.keys(additionalImagingPatients).length})
                        </h3>
                    </div>

                    <div className="grid gap-3">
                        {(Object.entries(additionalImagingPatients) as [string, { region: string; addedAt: Date; scheduledMinutes: number }][]).map(([patientId, info]) => {
                            // History'den hastayı bul (status'a bakmadan)
                            const patient = history.find(h => h.id === patientId);
                            if (!patient) return null;

                            // Bekleme süresini hesapla
                            const waitingMinutes = Math.floor((currentTime.getTime() - new Date(info.addedAt).getTime()) / 60000);
                            const remainingMinutes = Math.max(0, info.scheduledMinutes - waitingMinutes);
                            const isReady = waitingMinutes >= info.scheduledMinutes;
                            const timeLabel = info.scheduledMinutes === 60 ? '1 saat' : info.scheduledMinutes === 90 ? '1.5 saat' : '2 saat';

                            return (
                                <div
                                    key={patientId}
                                    className={`relative overflow-hidden rounded-2xl p-4 border transition-all ${isReady
                                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 ring-2 ring-emerald-500/50'
                                        : 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-orange-500/30'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isReady ? 'bg-emerald-500/30 text-emerald-400' : 'bg-orange-500/30 text-orange-400 animate-pulse'
                                                }`}>
                                                {isReady ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white">{patient.patientName}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-orange-300 uppercase tracking-wider">
                                                        📍 {info.region}
                                                    </span>
                                                    <span className="text-[8px] text-slate-500">•</span>
                                                    <span className="text-[8px] text-slate-400">{patient.procedure}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                {isReady ? (
                                                    <>
                                                        <p className="text-lg font-black text-emerald-400">HAZIR!</p>
                                                        <p className="text-[8px] text-emerald-300">{waitingMinutes} dk bekledi</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-lg font-black text-orange-400 tabular-nums">{remainingMinutes} dk</p>
                                                        <p className="text-[8px] text-orange-300">kaldı ({timeLabel})</p>
                                                    </>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleStartImagingWithAdditional(patientId, patient.patientName)}
                                                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all active:scale-95 ${isReady
                                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white animate-pulse'
                                                    : 'bg-orange-500 hover:bg-orange-400 text-white'
                                                    }`}
                                            >
                                                {isReady ? '📸 Çekime Al' : '⏱️ Erken Başla'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </>
    );
};
