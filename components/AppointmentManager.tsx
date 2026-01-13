import React, { useState, useMemo, useCallback } from 'react';
import { PendingPatient } from '../types';

interface Appointment {
    id: string;
    patientName: string;
    protocolNo?: string;
    procedure: string;
    appointmentDate: string; // YYYY-MM-DD
    appointmentTime: string; // HH:mm
    notes?: string;
    status: 'scheduled' | 'arrived' | 'completed' | 'cancelled' | 'noshow';
    createdAt: Date;
}

interface AppointmentManagerProps {
    onClose: () => void;
    onAddToPending?: (patient: PendingPatient) => void;
}

const PROCEDURES = [
    'FDG PET/BT',
    'Ga-68 PSMA PET/BT',
    'Ga-68 DOTATATE PET/BT',
    'Kemik Sintigrafisi',
    'Tiroid Sintigrafisi',
    'Miyokard Perfüzyon SPECT',
    'Beyin SPECT',
    'Akciğer Perfüzyon',
    'Sentinel Lenf Nodu',
    'I-131 Tedavi',
    'Diğer'
];

const STATUS_LABELS: Record<Appointment['status'], { label: string; color: string; icon: string }> = {
    scheduled: { label: 'Planlandı', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '📅' },
    arrived: { label: 'Geldi', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '✓' },
    completed: { label: 'Tamamlandı', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '✔️' },
    cancelled: { label: 'İptal', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: '✕' },
    noshow: { label: 'Gelmedi', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '⚠' }
};

const STORAGE_KEY = 'nt_appointments';

const loadAppointments = (): Appointment[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveAppointments = (appointments: Appointment[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
};

export const AppointmentManager: React.FC<AppointmentManagerProps> = ({ onClose, onAddToPending }) => {
    const [appointments, setAppointments] = useState<Appointment[]>(loadAppointments);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        patientName: '',
        protocolNo: '',
        procedure: PROCEDURES[0],
        appointmentDate: selectedDate,
        appointmentTime: '09:00',
        notes: ''
    });

    // Filter appointments by selected date
    const dayAppointments = useMemo(() => {
        return appointments
            .filter(a => a.appointmentDate === selectedDate)
            .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
    }, [appointments, selectedDate]);

    // Statistics
    const stats = useMemo(() => {
        const dayAppts = dayAppointments;
        return {
            total: dayAppts.length,
            scheduled: dayAppts.filter(a => a.status === 'scheduled').length,
            arrived: dayAppts.filter(a => a.status === 'arrived').length,
            completed: dayAppts.filter(a => a.status === 'completed').length
        };
    }, [dayAppointments]);

    // Save whenever appointments change
    const updateAppointments = useCallback((newAppointments: Appointment[]) => {
        setAppointments(newAppointments);
        saveAppointments(newAppointments);
    }, []);

    // Check for conflicts
    const checkConflict = (date: string, time: string, excludeId?: string): Appointment | null => {
        return appointments.find(a =>
            a.appointmentDate === date &&
            a.appointmentTime === time &&
            a.status === 'scheduled' &&
            a.id !== excludeId
        ) || null;
    };

    // Add new appointment
    const handleAddAppointment = () => {
        if (!formData.patientName || !formData.procedure) return;

        // Check for conflict
        const conflict = checkConflict(formData.appointmentDate, formData.appointmentTime);
        if (conflict) {
            const proceed = confirm(
                `⚠️ Çakışma Uyarısı!\n\n` +
                `Bu saatte (${formData.appointmentTime}) zaten bir randevu var:\n` +
                `${conflict.patientName} - ${conflict.procedure}\n\n` +
                `Yine de eklemek istiyor musunuz?`
            );
            if (!proceed) return;
        }

        const newAppointment: Appointment = {
            id: `apt_${Date.now()}`,
            patientName: formData.patientName,
            protocolNo: formData.protocolNo || undefined,
            procedure: formData.procedure,
            appointmentDate: formData.appointmentDate,
            appointmentTime: formData.appointmentTime,
            notes: formData.notes || undefined,
            status: 'scheduled',
            createdAt: new Date()
        };

        updateAppointments([...appointments, newAppointment]);
        resetForm();
        setShowAddForm(false);
    };

    // Update appointment status
    const updateStatus = (id: string, status: Appointment['status']) => {
        updateAppointments(
            appointments.map(a => a.id === id ? { ...a, status } : a)
        );
    };

    // Delete appointment
    const deleteAppointment = (id: string) => {
        if (confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
            updateAppointments(appointments.filter(a => a.id !== id));
        }
    };

    // Convert to pending patient
    const convertToPending = (appointment: Appointment) => {
        if (onAddToPending) {
            const pending: PendingPatient = {
                id: `p_${Date.now()}`,
                name: appointment.patientName,
                protocolNo: appointment.protocolNo,
                procedure: appointment.procedure,
                appointmentTime: appointment.appointmentTime,
                appointmentDate: appointment.appointmentDate
            };
            onAddToPending(pending);
            updateStatus(appointment.id, 'arrived');
        }
    };

    const resetForm = () => {
        setFormData({
            patientName: '',
            protocolNo: '',
            procedure: PROCEDURES[0],
            appointmentDate: selectedDate,
            appointmentTime: '09:00',
            notes: ''
        });
        setEditingAppointment(null);
    };

    // Generate time slots
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let h = 8; h <= 17; h++) {
            for (let m = 0; m < 60; m += 30) {
                slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
        }
        return slots;
    }, []);

    // Navigate dates
    const navigateDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                            <span className="text-2xl">📅</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Randevu Yönetimi</h2>
                            <p className="text-xs text-slate-500">Günlük randevu planlaması ve takibi</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Date Navigation & Stats */}
                <div className="p-4 bg-slate-800/50 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                        {/* Date Nav */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigateDate(-1)}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                                />
                                <button
                                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                                    className="px-3 py-2 text-xs font-bold text-teal-400 hover:bg-teal-500/20 rounded-lg transition-colors"
                                >
                                    Bugün
                                </button>
                            </div>

                            <button
                                onClick={() => navigateDate(1)}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-lg font-black text-white">{stats.total}</p>
                                <p className="text-[9px] text-slate-500 uppercase">Toplam</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-blue-400">{stats.scheduled}</p>
                                <p className="text-[9px] text-slate-500 uppercase">Bekliyor</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-emerald-400">{stats.arrived}</p>
                                <p className="text-[9px] text-slate-500 uppercase">Geldi</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-purple-400">{stats.completed}</p>
                                <p className="text-[9px] text-slate-500 uppercase">Tamamlandı</p>
                            </div>

                            <button
                                onClick={() => setShowAddForm(true)}
                                className="ml-4 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Randevu Ekle
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {dayAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <span className="text-6xl mb-4">📭</span>
                            <p className="text-lg font-semibold">Bu tarih için randevu yok</p>
                            <p className="text-sm">Yeni randevu eklemek için "Randevu Ekle" butonunu kullanın</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {dayAppointments.map(appointment => {
                                const statusInfo = STATUS_LABELS[appointment.status];
                                return (
                                    <div
                                        key={appointment.id}
                                        className={`bg-slate-800/50 border ${appointment.status === 'scheduled' ? 'border-blue-500/20' : 'border-slate-700/50'} rounded-xl p-4 hover:bg-slate-800/80 transition-colors`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Time */}
                                                <div className="text-center w-16">
                                                    <p className="text-lg font-black text-white">{appointment.appointmentTime}</p>
                                                </div>

                                                {/* Divider */}
                                                <div className="w-px h-12 bg-slate-700"></div>

                                                {/* Patient Info */}
                                                <div>
                                                    <p className="text-base font-bold text-white">{appointment.patientName}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-slate-400">{appointment.procedure}</span>
                                                        {appointment.protocolNo && (
                                                            <span className="text-xs text-slate-500">• {appointment.protocolNo}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Status Badge */}
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                                                    {statusInfo.icon} {statusInfo.label}
                                                </span>

                                                {/* Actions */}
                                                {appointment.status === 'scheduled' && (
                                                    <button
                                                        onClick={() => convertToPending(appointment)}
                                                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Geldi
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => deleteAppointment(appointment.id)}
                                                    className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Add Form Modal */}
                {showAddForm && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold text-white mb-4">Yeni Randevu</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Hasta Adı *</label>
                                    <input
                                        type="text"
                                        value={formData.patientName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                                        placeholder="Hasta adı soyadı"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Protokol No</label>
                                    <input
                                        type="text"
                                        value={formData.protocolNo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, protocolNo: e.target.value }))}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                                        placeholder="Opsiyonel"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Prosedür *</label>
                                    <select
                                        value={formData.procedure}
                                        onChange={(e) => setFormData(prev => ({ ...prev, procedure: e.target.value }))}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                                    >
                                        {PROCEDURES.map(proc => (
                                            <option key={proc} value={proc}>{proc}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Tarih</label>
                                        <input
                                            type="date"
                                            value={formData.appointmentDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Saat</label>
                                        <select
                                            value={formData.appointmentTime}
                                            onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                                        >
                                            {timeSlots.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Notlar</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 resize-none"
                                        rows={2}
                                        placeholder="Opsiyonel notlar..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => { resetForm(); setShowAddForm(false); }}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleAddAppointment}
                                    disabled={!formData.patientName || !formData.procedure}
                                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentManager;
