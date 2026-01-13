import React, { useState, useMemo } from 'react';
import { Isotope, PendingPatient } from '../types';
import { ISOTOPES } from '../constants';

interface Appointment {
    id: string;
    patientName: string;
    patientId?: string;
    procedure: string;
    isotope: string;
    date: string;
    time: string;
    duration: number;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
}

interface AppointmentSchedulerProps {
    onClose: () => void;
    pendingPatients: PendingPatient[];
    onAddPatient: (patient: PendingPatient) => void;
    selectedIsotope: Isotope;
}

const translations = {
    tr: {
        title: 'Randevu Takvimi',
        subtitle: 'Haftalık çizelge ve planlama',
        today: 'Bugün',
        addAppointment: 'Randevu Ekle',
        newAppointment: 'Yeni Randevu',
        editAppointment: 'Randevu Düzenle',
        patientName: 'Hasta Adı',
        procedure: 'Prosedür',
        isotope: 'İzotop',
        date: 'Tarih',
        time: 'Saat',
        duration: 'Süre (dakika)',
        notes: 'Notlar',
        notesPlaceholder: 'Ek notlar...',
        save: 'Kaydet',
        cancel: 'İptal',
        delete: 'Sil',
        status: 'Durum',
        scheduled: 'Planlandı',
        confirmed: 'Onaylandı',
        completed: 'Tamamlandı',
        cancelled: 'İptal Edildi',
        noAppointments: 'Bu gün için randevu yok',
        weekDays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'],
        addToQueue: 'Sıraya Ekle',
        minutes: 'dk',
    },
    en: {
        title: 'Appointment Scheduler',
        subtitle: 'Weekly schedule and planning',
        today: 'Today',
        addAppointment: 'Add Appointment',
        newAppointment: 'New Appointment',
        editAppointment: 'Edit Appointment',
        patientName: 'Patient Name',
        procedure: 'Procedure',
        isotope: 'Isotope',
        date: 'Date',
        time: 'Time',
        duration: 'Duration (minutes)',
        notes: 'Notes',
        notesPlaceholder: 'Additional notes...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        status: 'Status',
        scheduled: 'Scheduled',
        confirmed: 'Confirmed',
        completed: 'Completed',
        cancelled: 'Cancelled',
        noAppointments: 'No appointments for this day',
        weekDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        addToQueue: 'Add to Queue',
        minutes: 'min',
    },
};

const STORAGE_KEY = 'nt_appointments';

const TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
    onClose,
    pendingPatients,
    onAddPatient,
    selectedIsotope,
}) => {
    const lang = useMemo(() => {
        try {
            const settings = localStorage.getItem('nt_app_settings');
            if (settings) return JSON.parse(settings).language || 'tr';
        } catch { }
        return 'tr';
    }, []);

    const t = translations[lang as 'tr' | 'en'];

    const [appointments, setAppointments] = useState<Appointment[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    });
    const [showModal, setShowModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [formData, setFormData] = useState({
        patientName: '',
        procedure: '',
        isotope: selectedIsotope.id,
        date: '',
        time: '09:00',
        duration: 30,
        notes: '',
        status: 'scheduled' as const,
    });

    const weekDates = useMemo(() => {
        return t.weekDays.map((_, i) => {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            return date;
        });
    }, [currentWeekStart, t.weekDays]);

    const saveAppointments = (apps: Appointment[]) => {
        setAppointments(apps);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    };

    const handleAddAppointment = () => {
        if (!formData.patientName || !formData.date || !formData.time) return;

        const appointment: Appointment = {
            id: editingAppointment?.id || Date.now().toString(),
            patientName: formData.patientName,
            procedure: formData.procedure,
            isotope: formData.isotope,
            date: formData.date,
            time: formData.time,
            duration: formData.duration,
            status: formData.status,
            notes: formData.notes || undefined,
        };

        if (editingAppointment) {
            saveAppointments(appointments.map(a => a.id === editingAppointment.id ? appointment : a));
        } else {
            saveAppointments([...appointments, appointment]);
        }

        setShowModal(false);
        setEditingAppointment(null);
        setFormData({
            patientName: '',
            procedure: '',
            isotope: selectedIsotope.id,
            date: '',
            time: '09:00',
            duration: 30,
            notes: '',
            status: 'scheduled',
        });
    };

    const handleDeleteAppointment = (id: string) => {
        saveAppointments(appointments.filter(a => a.id !== id));
        setShowModal(false);
        setEditingAppointment(null);
    };

    const handleAddToQueue = (appointment: Appointment) => {
        const patient: PendingPatient = {
            id: Date.now().toString(),
            name: appointment.patientName,
            procedure: appointment.procedure,
            appointmentTime: appointment.time,
            appointmentDate: appointment.date,
        };
        onAddPatient(patient);

        saveAppointments(appointments.map(a =>
            a.id === appointment.id ? { ...a, status: 'confirmed' as const } : a
        ));
    };

    const openEditModal = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setFormData({
            patientName: appointment.patientName,
            procedure: appointment.procedure,
            isotope: appointment.isotope,
            date: appointment.date,
            time: appointment.time,
            duration: appointment.duration,
            notes: appointment.notes || '',
            status: appointment.status,
        });
        setShowModal(true);
    };

    const getAppointmentsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return appointments.filter(a => a.date === dateStr);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-500';
            case 'completed': return 'bg-blue-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-amber-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'scheduled': return t.scheduled;
            case 'confirmed': return t.confirmed;
            case 'completed': return t.completed;
            case 'cancelled': return t.cancelled;
            default: return status;
        }
    };

    const navigateWeek = (direction: number) => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + (direction * 7));
        setCurrentWeekStart(newStart);
    };

    const goToToday = () => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        setCurrentWeekStart(new Date(today.setDate(diff)));
    };

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📅</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t.title}</h2>
                            <p className="text-teal-200 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={goToToday}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                        >
                            {t.today}
                        </button>
                        <button
                            onClick={() => {
                                setEditingAppointment(null);
                                setFormData({
                                    patientName: '',
                                    procedure: '',
                                    isotope: selectedIsotope.id,
                                    date: todayStr,
                                    time: '09:00',
                                    duration: 30,
                                    notes: '',
                                    status: 'scheduled',
                                });
                                setShowModal(true);
                            }}
                            className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            + {t.addAppointment}
                        </button>
                        <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Week Navigation */}
                <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                    <button onClick={() => navigateWeek(-1)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-white font-medium">
                        {weekDates[0].toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { month: 'long', day: 'numeric' })} - {weekDates[4].toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button onClick={() => navigateWeek(1)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="p-4 overflow-y-auto max-h-[calc(95vh-180px)]">
                    <div className="grid grid-cols-5 gap-3">
                        {weekDates.map((date, dayIdx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const dayAppointments = getAppointmentsForDate(date);
                            const isToday = dateStr === todayStr;

                            return (
                                <div
                                    key={dayIdx}
                                    className={`rounded-xl border ${isToday ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700 bg-slate-800/30'}`}
                                >
                                    <div className={`px-3 py-2 border-b ${isToday ? 'border-teal-500/50 bg-teal-500/10' : 'border-slate-700'}`}>
                                        <p className={`text-xs font-medium ${isToday ? 'text-teal-400' : 'text-slate-400'}`}>
                                            {t.weekDays[dayIdx]}
                                        </p>
                                        <p className={`text-lg font-bold ${isToday ? 'text-teal-300' : 'text-white'}`}>
                                            {date.getDate()}
                                        </p>
                                    </div>
                                    <div className="p-2 min-h-[200px] space-y-2">
                                        {dayAppointments.length === 0 ? (
                                            <p className="text-slate-500 text-xs text-center py-4">{t.noAppointments}</p>
                                        ) : (
                                            dayAppointments.map(appointment => (
                                                <div
                                                    key={appointment.id}
                                                    onClick={() => openEditModal(appointment)}
                                                    className="bg-slate-700/50 rounded-lg p-2 cursor-pointer hover:bg-slate-700 transition-colors border-l-2"
                                                    style={{ borderLeftColor: getStatusColor(appointment.status).replace('bg-', '') }}
                                                >
                                                    <div className="flex items-start justify-between gap-1">
                                                        <p className="text-white text-xs font-medium truncate">{appointment.patientName}</p>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(appointment.status)} flex-shrink-0 mt-1`}></span>
                                                    </div>
                                                    <p className="text-slate-400 text-[10px]">{appointment.time} • {appointment.duration}{t.minutes}</p>
                                                    {appointment.procedure && (
                                                        <p className="text-slate-500 text-[10px] truncate">{appointment.procedure}</p>
                                                    )}
                                                    {appointment.status === 'scheduled' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddToQueue(appointment);
                                                            }}
                                                            className="mt-1 w-full px-2 py-0.5 bg-teal-600/50 hover:bg-teal-600 rounded text-[10px] text-white transition-colors"
                                                        >
                                                            {t.addToQueue}
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Appointment Modal */}
                {showModal && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-600">
                            <h3 className="text-lg font-bold text-white mb-4">
                                {editingAppointment ? t.editAppointment : t.newAppointment}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">{t.patientName} *</label>
                                    <input
                                        type="text"
                                        value={formData.patientName}
                                        onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-teal-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.date} *</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-teal-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.time} *</label>
                                        <select
                                            value={formData.time}
                                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-teal-500 outline-none"
                                        >
                                            {TIME_SLOTS.map(slot => (
                                                <option key={slot} value={slot}>{slot}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.isotope}</label>
                                        <select
                                            value={formData.isotope}
                                            onChange={e => setFormData({ ...formData, isotope: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-teal-500 outline-none"
                                        >
                                            {ISOTOPES.map(iso => (
                                                <option key={iso.id} value={iso.id}>{iso.symbol}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.duration}</label>
                                        <input
                                            type="number"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                                            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-teal-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">{t.procedure}</label>
                                    <input
                                        type="text"
                                        value={formData.procedure}
                                        onChange={e => setFormData({ ...formData, procedure: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-teal-500 outline-none"
                                    />
                                </div>
                                {editingAppointment && (
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">{t.status}</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-teal-500 outline-none"
                                        >
                                            <option value="scheduled">{t.scheduled}</option>
                                            <option value="confirmed">{t.confirmed}</option>
                                            <option value="completed">{t.completed}</option>
                                            <option value="cancelled">{t.cancelled}</option>
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">{t.notes}</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-teal-500 outline-none resize-none"
                                        rows={2}
                                        placeholder={t.notesPlaceholder}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between mt-6">
                                {editingAppointment && (
                                    <button
                                        onClick={() => handleDeleteAppointment(editingAppointment.id)}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors"
                                    >
                                        {t.delete}
                                    </button>
                                )}
                                <div className="flex gap-3 ml-auto">
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingAppointment(null);
                                        }}
                                        className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-medium transition-colors"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        onClick={handleAddAppointment}
                                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-white font-medium transition-colors"
                                    >
                                        {t.save}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
