import React, { useMemo } from 'react';
import { DoseLogEntry, DoseStatus, PendingPatient } from '../types';

interface PatientTimelineProps {
    history: DoseLogEntry[];
    pendingPatients: PendingPatient[];
    patientsInRooms: { room: string; patient: PendingPatient; doseGiven: number; injectionTime: Date }[];
    patientsInImaging: { patient: PendingPatient; startTime: Date }[];
    now: Date;
    onClose: () => void;
}

interface TimelineEvent {
    id: string;
    time: Date;
    type: 'arrival' | 'injection' | 'imaging_start' | 'imaging_end' | 'completed' | 'pending';
    patientName: string;
    procedure: string;
    details?: string;
    room?: string;
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({
    history,
    pendingPatients,
    patientsInRooms,
    patientsInImaging,
    now,
    onClose
}) => {
    // Build timeline from all sources
    const timelineEvents = useMemo((): TimelineEvent[] => {
        const events: TimelineEvent[] = [];
        const today = now.toISOString().split('T')[0];

        // Add completed patients from history
        history
            .filter(h => new Date(h.timestamp).toISOString().split('T')[0] === today)
            .forEach(entry => {
                events.push({
                    id: `hist_${entry.id}`,
                    time: new Date(entry.timestamp),
                    type: entry.status === DoseStatus.INJECTED ? 'completed' : 'injection',
                    patientName: entry.patientName,
                    procedure: entry.procedure,
                    details: `${entry.amount.toFixed(2)} mCi`
                });
            });

        // Add patients currently in rooms
        patientsInRooms.forEach(({ room, patient, injectionTime }) => {
            events.push({
                id: `room_${patient.id}`,
                time: injectionTime,
                type: 'injection',
                patientName: patient.name,
                procedure: patient.procedure,
                room,
                details: `Oda ${room} - Bekleme`
            });
        });

        // Add patients in imaging
        patientsInImaging.forEach(({ patient, startTime }) => {
            events.push({
                id: `img_${patient.id}`,
                time: startTime,
                type: 'imaging_start',
                patientName: patient.name,
                procedure: patient.procedure,
                details: 'Çekimde'
            });
        });

        // Add pending patients as future events
        pendingPatients.forEach(patient => {
            const eventTime = patient.appointmentTime
                ? new Date(`${today}T${patient.appointmentTime}`)
                : now;
            events.push({
                id: `pending_${patient.id}`,
                time: eventTime,
                type: 'pending',
                patientName: patient.name,
                procedure: patient.procedure,
                details: 'Bekliyor'
            });
        });

        // Sort by time
        return events.sort((a, b) => a.time.getTime() - b.time.getTime());
    }, [history, pendingPatients, patientsInRooms, patientsInImaging, now]);

    const typeStyles: Record<TimelineEvent['type'], { color: string; icon: string; label: string }> = {
        pending: { color: 'bg-slate-500', icon: '⏳', label: 'Bekliyor' },
        arrival: { color: 'bg-blue-500', icon: '🚶', label: 'Geldi' },
        injection: { color: 'bg-amber-500', icon: '💉', label: 'Enjeksiyon' },
        imaging_start: { color: 'bg-purple-500', icon: '📷', label: 'Çekim Başladı' },
        imaging_end: { color: 'bg-indigo-500', icon: '✔️', label: 'Çekim Bitti' },
        completed: { color: 'bg-emerald-500', icon: '✅', label: 'Tamamlandı' }
    };

    // Group events by hour
    const groupedEvents = useMemo(() => {
        const groups: Record<string, TimelineEvent[]> = {};
        timelineEvents.forEach(event => {
            const hour = event.time.getHours().toString().padStart(2, '0') + ':00';
            if (!groups[hour]) groups[hour] = [];
            groups[hour].push(event);
        });
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [timelineEvents]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-xl">📊</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Hasta Zaman Çizelgesi</h2>
                            <p className="text-xs text-slate-500">
                                {now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
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

                {/* Stats */}
                <div className="p-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-around">
                    <div className="text-center">
                        <p className="text-2xl font-black text-white">{timelineEvents.length}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Toplam</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-emerald-400">
                            {timelineEvents.filter(e => e.type === 'completed').length}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">Tamamlanan</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-purple-400">
                            {timelineEvents.filter(e => e.type === 'imaging_start').length}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">Çekimde</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-400">
                            {timelineEvents.filter(e => e.type === 'pending').length}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">Bekliyor</p>
                    </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-auto p-4">
                    {groupedEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                            <span className="text-4xl">📭</span>
                            <p className="text-sm mt-2">Bugün için kayıt yok</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groupedEvents.map(([hour, events]) => (
                                <div key={hour}>
                                    {/* Hour Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-lg font-black text-white">{hour}</span>
                                        <div className="flex-1 h-px bg-slate-700"></div>
                                        <span className="text-xs text-slate-500">{events.length} etkinlik</span>
                                    </div>

                                    {/* Events */}
                                    <div className="space-y-2 pl-4 border-l-2 border-slate-700 ml-3">
                                        {events.map(event => {
                                            const style = typeStyles[event.type];
                                            return (
                                                <div
                                                    key={event.id}
                                                    className="relative flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/80 transition-colors"
                                                >
                                                    {/* Dot on timeline */}
                                                    <div className={`absolute -left-[22px] w-3 h-3 rounded-full ${style.color} ring-4 ring-slate-900`} />

                                                    {/* Time */}
                                                    <span className="text-xs text-slate-500 w-12">
                                                        {event.time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>

                                                    {/* Icon */}
                                                    <span className="text-lg">{style.icon}</span>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-white truncate">{event.patientName}</p>
                                                        <p className="text-xs text-slate-400">{event.procedure}</p>
                                                    </div>

                                                    {/* Status */}
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${style.color} text-white`}>
                                                        {style.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientTimeline;
