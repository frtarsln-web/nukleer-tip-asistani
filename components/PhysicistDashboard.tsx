import React, { useState, useMemo, useEffect } from 'react';
import { DoseLogEntry, DoseStatus, Isotope, DoseUnit, Vial, WasteBin, WasteItem, StaffUser, UserRole } from '../types';
import { calculateDecay } from '../utils/physics';
import { ISOTOPES } from '../constants';

// QC Record Interface
interface QCRecord {
    id: string;
    date: string;
    type: 'daily' | 'weekly' | 'kit';
    equipmentName?: string;
    kitName?: string;
    tests: { id: string; name: string; value: number | null; passed: boolean | null }[];
    performedBy: string;
    passed: boolean;
    notes?: string;
    timestamp: Date;
}

// Contamination Event Interface
interface ContaminationEvent {
    id: string;
    location: string;
    isotope: string;
    activityLevel: number;
    unit: DoseUnit;
    reportedBy: string;
    reportedAt: Date;
    status: 'active' | 'contained' | 'resolved';
    description: string;
    actions: string[];
}

// Extended Vial with isotope info
interface ExtendedVial extends Vial {
    currentActivity: number;
    calibrationTime: Date;
    isotopeId: string;
    isotopeName: string;
}

// Extended WasteBin with isotope info
interface ExtendedWasteBin extends WasteBin {
    isotopeId: string;
    isotopeName: string;
}

interface PhysicistDashboardProps {
    history: DoseLogEntry[];
    selectedIsotope: Isotope;
    now: Date;
    unit: DoseUnit;
    wasteBins: WasteBin[];
    staffUsers: StaffUser[];
    allVials?: (Vial & { currentActivity: number; calibrationTime: Date; isotopeId: string })[];
    onLogout?: () => void;
}

const STORAGE_KEY_QC = 'nt_qc_records';
const STORAGE_KEY_CONTAMINATION = 'nt_contamination_events';
const STORAGE_KEY_DAILY_CONTROLS = 'nt_daily_controls';
const STORAGE_KEY_DAILY_CHECKLIST = 'nt_physicist_checklist';
const STORAGE_KEY_SHIFT_NOTES = 'nt_shift_notes';
const STORAGE_KEY_EMERGENCY_CONTACTS = 'nt_emergency_contacts';
const STORAGE_KEY_CAMERA_QC = 'nt_camera_qc';

// Daily Checklist Interface
interface ChecklistItem {
    id: string;
    label: string;
    category: 'morning' | 'during' | 'evening';
    completed: boolean;
    completedAt?: Date;
}

interface DailyChecklistRecord {
    date: string;
    items: ChecklistItem[];
    completedBy?: string;
}

// Shift Note Interface
interface ShiftNote {
    id: string;
    date: string;
    shift: 'morning' | 'evening';
    note: string;
    author: string;
    createdAt: Date;
    isRead: boolean;
}

// Emergency Contact Interface
interface EmergencyContact {
    id: string;
    name: string;
    role: string;
    phone: string;
    email?: string;
}

// Camera QC Record Interface
interface CameraQCRecord {
    id: string;
    date: string;
    cameraType: 'SPECT' | 'PET' | 'PET/CT';
    cameraName: string;
    testType: 'uniformity' | 'center_rotation' | 'resolution' | 'sensitivity';
    result: 'passed' | 'failed' | 'marginal';
    values?: { [key: string]: number };
    notes: string;
    performedBy: string;
}

// Dose Calibrator Constancy Test Interface
interface ConstancyTest {
    id: string;
    date: string;
    time: string;
    sourceActivity: number; // Reference source activity (Cs-137 etc)
    measuredActivity: number;
    deviation: number; // Percentage
    result: 'passed' | 'failed';
    performedBy: string;
}

// Survey Meter Log Interface
interface SurveyMeterLog {
    id: string;
    date: string;
    meterName: string;
    batteryLevel: 'good' | 'low' | 'dead';
    calibrationExpiry: Date;
    functionCheck: boolean;
    performedBy: string;
}

// Maintenance Record Interface
interface MaintenanceRecord {
    id: string;
    equipmentName: string;
    maintenanceType: 'preventive' | 'corrective' | 'calibration';
    lastDate: Date;
    nextDueDate: Date;
    notes?: string;
}

// Audit Log Entry Interface
interface AuditLogEntry {
    id: string;
    timestamp: Date;
    action: string;
    user: string;
    details: string;
    category: 'dose' | 'qc' | 'waste' | 'patient' | 'system';
}

const STORAGE_KEY_CONSTANCY = 'nt_constancy_tests';
const STORAGE_KEY_SURVEY_METER = 'nt_survey_meter_logs';
const STORAGE_KEY_MAINTENANCE = 'nt_maintenance_records';
const STORAGE_KEY_AUDIT = 'nt_audit_log';

// Daily Control Record Interface - Updated for room-based measurements
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
    recordedBy: { id: string; name: string };
    recordedAt: Date;
    lastUpdatedAt: Date;
}

// Helper to get dynamic storage keys for each isotope
const getDynamicKeys = (isoId: string) => ({
    VIALS: `nt_vials_${isoId}`,
    HISTORY: `nt_history_${isoId}`,
    WASTE_BINS: `nt_waste_${isoId}`
});


export function PhysicistDashboard({
    history,
    selectedIsotope,
    now,
    unit,
    wasteBins,
    staffUsers,
    allVials = [],
    onLogout
}: PhysicistDashboardProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'technicians' | 'vials' | 'waste' | 'contamination' | 'qc' | 'radiation' | 'calibration' | 'protocols' | 'archive' | 'settings' | 'audit'>('overview');
    const [menuOpen, setMenuOpen] = useState(false);
    const [qcRecords, setQcRecords] = useState<QCRecord[]>([]);

    const [contaminationEvents, setContaminationEvents] = useState<ContaminationEvent[]>([]);
    const [showContaminationForm, setShowContaminationForm] = useState(false);
    const [archiveFilter, setArchiveFilter] = useState<'daily' | 'monthly' | 'yearly'>('daily');
    const [archiveDate, setArchiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [newContamination, setNewContamination] = useState({
        location: '',
        isotope: 'Tc-99m',
        activityLevel: 0,
        description: ''
    });

    // State for all isotopes data
    const [allIsotopesHistory, setAllIsotopesHistory] = useState<(DoseLogEntry & { isotopeId: string; isotopeName: string })[]>([]);
    const [allIsotopesVials, setAllIsotopesVials] = useState<ExtendedVial[]>([]);
    const [allIsotopesWaste, setAllIsotopesWaste] = useState<ExtendedWasteBin[]>([]);
    const [dailyControls, setDailyControls] = useState<DailyControlRecord[]>([]);

    // New feature states
    const [dailyChecklist, setDailyChecklist] = useState<DailyChecklistRecord | null>(null);
    const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>([]);
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
    const [cameraQCRecords, setCameraQCRecords] = useState<CameraQCRecord[]>([]);
    const [newShiftNote, setNewShiftNote] = useState('');

    // Default checklist items
    const defaultChecklistItems: Omit<ChecklistItem, 'completed' | 'completedAt'>[] = [
        { id: 'morning_1', label: 'Doz kalibratör açıldı ve ısındı', category: 'morning' },
        { id: 'morning_2', label: 'Günlük constancy testi yapıldı', category: 'morning' },
        { id: 'morning_3', label: 'Survey metre pil kontrolü yapıldı', category: 'morning' },
        { id: 'morning_4', label: 'Ortam sıcaklık/nem kontrolü (sabah)', category: 'morning' },
        { id: 'morning_5', label: 'Radyofarmasötik teslimat kontrolü', category: 'morning' },
        { id: 'during_1', label: 'Doz hazırlama kayıtları kontrol edildi', category: 'during' },
        { id: 'during_2', label: 'Hasta dozları doğrulandı', category: 'during' },
        { id: 'during_3', label: 'Atık kutuları kontrol edildi', category: 'during' },
        { id: 'evening_1', label: 'Ortam sıcaklık/nem kontrolü (akşam)', category: 'evening' },
        { id: 'evening_2', label: 'Günlük aktivite raporu oluşturuldu', category: 'evening' },
        { id: 'evening_3', label: 'Atık kayıtları güncellendi', category: 'evening' },
        { id: 'evening_4', label: 'Kapanış kontrolleri tamamlandı', category: 'evening' },
    ];

    // Default emergency contacts
    const defaultEmergencyContacts: EmergencyContact[] = [
        { id: 'e1', name: 'TAEK Acil Hattı', role: 'Düzenleyici Kurum', phone: '0312 xxx xx xx' },
        { id: 'e2', name: 'Radyasyon Güvenliği Sorumlusu', role: 'RSO', phone: 'xxx xxx xx xx' },
        { id: 'e3', name: 'Hastane Nükleer Tıp', role: 'Bölüm', phone: 'xxx xxx xx xx' },
    ];

    // New advanced feature states
    const [constancyTests, setConstancyTests] = useState<ConstancyTest[]>([]);
    const [surveyMeterLogs, setSurveyMeterLogs] = useState<SurveyMeterLog[]>([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

    // Default maintenance equipment
    const defaultMaintenanceEquipment: MaintenanceRecord[] = [
        { id: 'm1', equipmentName: 'Doz Kalibratör', maintenanceType: 'calibration', lastDate: new Date('2025-06-01'), nextDueDate: new Date('2026-06-01'), notes: 'Yıllık kalibrasyon' },
        { id: 'm2', equipmentName: 'SPECT Kamera', maintenanceType: 'preventive', lastDate: new Date('2025-11-15'), nextDueDate: new Date('2026-05-15'), notes: '6 aylık bakım' },
        { id: 'm3', equipmentName: 'PET/CT', maintenanceType: 'preventive', lastDate: new Date('2025-12-01'), nextDueDate: new Date('2026-06-01'), notes: '6 aylık bakım' },
        { id: 'm4', equipmentName: 'Survey Metre #1', maintenanceType: 'calibration', lastDate: new Date('2025-09-01'), nextDueDate: new Date('2026-09-01'), notes: 'Yıllık kalibrasyon' },
        { id: 'm5', equipmentName: 'Kontaminasyon Monitörü', maintenanceType: 'calibration', lastDate: new Date('2025-08-01'), nextDueDate: new Date('2026-08-01'), notes: 'Yıllık kalibrasyon' },
    ];

    // Load data from ALL isotopes
    useEffect(() => {
        const loadAllIsotopesData = () => {
            const allHistory: (DoseLogEntry & { isotopeId: string; isotopeName: string })[] = [];
            const allVialsList: ExtendedVial[] = [];
            const allWasteBinsList: ExtendedWasteBin[] = [];

            ISOTOPES.forEach(isotope => {
                const keys = getDynamicKeys(isotope.id);

                // Load history for this isotope
                try {
                    const historyData = localStorage.getItem(keys.HISTORY);
                    if (historyData) {
                        const parsed = JSON.parse(historyData) as DoseLogEntry[];
                        parsed.forEach(entry => {
                            allHistory.push({
                                ...entry,
                                timestamp: new Date(entry.timestamp),
                                isotopeId: isotope.id,
                                isotopeName: isotope.name
                            });
                        });
                    }
                } catch (e) {
                    console.error(`Error loading history for ${isotope.id}:`, e);
                }

                // Load vials for this isotope
                try {
                    const vialsData = localStorage.getItem(keys.VIALS);
                    if (vialsData) {
                        const parsed = JSON.parse(vialsData) as Vial[];
                        parsed.forEach(vial => {
                            const hoursSinceReceived = (now.getTime() - new Date(vial.receivedAt).getTime()) / (1000 * 60 * 60);
                            const currentActivity = vial.initialAmount * Math.pow(0.5, hoursSinceReceived / isotope.halfLifeHours);
                            allVialsList.push({
                                ...vial,
                                receivedAt: new Date(vial.receivedAt),
                                currentActivity,
                                calibrationTime: new Date(vial.receivedAt),
                                isotopeId: isotope.id,
                                isotopeName: isotope.name
                            });
                        });
                    }
                } catch (e) {
                    console.error(`Error loading vials for ${isotope.id}:`, e);
                }

                // Load waste bins for this isotope
                try {
                    const wasteData = localStorage.getItem(keys.WASTE_BINS);
                    if (wasteData) {
                        const parsed = JSON.parse(wasteData) as WasteBin[];
                        parsed.forEach(bin => {
                            allWasteBinsList.push({
                                ...bin,
                                isotopeId: isotope.id,
                                isotopeName: isotope.name
                            });
                        });
                    }
                } catch (e) {
                    console.error(`Error loading waste for ${isotope.id}:`, e);
                }
            });

            // Sort history by timestamp (newest first)
            allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setAllIsotopesHistory(allHistory);
            setAllIsotopesVials(allVialsList);
            setAllIsotopesWaste(allWasteBinsList);
        };

        loadAllIsotopesData();

        // Refresh every 30 seconds
        const interval = setInterval(loadAllIsotopesData, 30000);
        return () => clearInterval(interval);
    }, [now]);

    // Load QC records from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_QC);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setQcRecords(parsed.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })));
            } catch (e) {
                console.error('Error parsing QC records:', e);
            }
        }
    }, []);

    // Load contamination events from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_CONTAMINATION);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setContaminationEvents(parsed.map((e: any) => ({ ...e, reportedAt: new Date(e.reportedAt) })));
            } catch (e) {
                console.error('Error parsing contamination events:', e);
            }
        }
    }, []);

    // Load daily controls from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_DAILY_CONTROLS);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setDailyControls(parsed.map((r: any) => ({ ...r, recordedAt: new Date(r.recordedAt) })));
            } catch (e) {
                console.error('Error parsing daily controls:', e);
            }
        }
    }, []);

    // Load daily checklist from localStorage
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem(STORAGE_KEY_DAILY_CHECKLIST);
        if (stored) {
            try {
                const allRecords = JSON.parse(stored) as DailyChecklistRecord[];
                const todayRecord = allRecords.find(r => r.date === today);
                if (todayRecord) {
                    setDailyChecklist(todayRecord);
                } else {
                    // Create new checklist for today
                    const newChecklist: DailyChecklistRecord = {
                        date: today,
                        items: defaultChecklistItems.map(item => ({ ...item, completed: false }))
                    };
                    setDailyChecklist(newChecklist);
                }
            } catch (e) {
                console.error('Error parsing checklist:', e);
            }
        } else {
            // First time - create new checklist
            const newChecklist: DailyChecklistRecord = {
                date: today,
                items: defaultChecklistItems.map(item => ({ ...item, completed: false }))
            };
            setDailyChecklist(newChecklist);
        }
    }, []);

    // Load shift notes from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_SHIFT_NOTES);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as ShiftNote[];
                setShiftNotes(parsed.map(n => ({ ...n, createdAt: new Date(n.createdAt) })));
            } catch (e) {
                console.error('Error parsing shift notes:', e);
            }
        }
    }, []);

    // Load emergency contacts from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_EMERGENCY_CONTACTS);
        if (stored) {
            try {
                setEmergencyContacts(JSON.parse(stored));
            } catch (e) {
                console.error('Error parsing emergency contacts:', e);
            }
        } else {
            setEmergencyContacts(defaultEmergencyContacts);
        }
    }, []);

    // Load camera QC records from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_CAMERA_QC);
        if (stored) {
            try {
                setCameraQCRecords(JSON.parse(stored));
            } catch (e) {
                console.error('Error parsing camera QC records:', e);
            }
        }
    }, []);

    // Toggle checklist item
    const toggleChecklistItem = (itemId: string) => {
        if (!dailyChecklist) return;

        const updatedItems = dailyChecklist.items.map(item =>
            item.id === itemId
                ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date() : undefined }
                : item
        );

        const updatedChecklist = { ...dailyChecklist, items: updatedItems };
        setDailyChecklist(updatedChecklist);

        // Save to localStorage
        const stored = localStorage.getItem(STORAGE_KEY_DAILY_CHECKLIST);
        const allRecords: DailyChecklistRecord[] = stored ? JSON.parse(stored) : [];
        const existingIndex = allRecords.findIndex(r => r.date === dailyChecklist.date);
        if (existingIndex >= 0) {
            allRecords[existingIndex] = updatedChecklist;
        } else {
            allRecords.unshift(updatedChecklist);
        }
        localStorage.setItem(STORAGE_KEY_DAILY_CHECKLIST, JSON.stringify(allRecords.slice(0, 90)));
    };

    // Add shift note
    const addShiftNote = () => {
        if (!newShiftNote.trim()) return;

        const currentHour = new Date().getHours();
        const note: ShiftNote = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            shift: currentHour < 14 ? 'morning' : 'evening',
            note: newShiftNote.trim(),
            author: 'Fizikçi',
            createdAt: new Date(),
            isRead: false
        };

        const updated = [note, ...shiftNotes];
        setShiftNotes(updated);
        localStorage.setItem(STORAGE_KEY_SHIFT_NOTES, JSON.stringify(updated.slice(0, 100)));
        setNewShiftNote('');
    };

    // Mark shift note as read
    const markNoteAsRead = (noteId: string) => {
        const updated = shiftNotes.map(n => n.id === noteId ? { ...n, isRead: true } : n);
        setShiftNotes(updated);
        localStorage.setItem(STORAGE_KEY_SHIFT_NOTES, JSON.stringify(updated));
    };

    // Calculate technician statistics (from ALL isotopes)

    const technicianStats = useMemo(() => {
        const technicians = staffUsers.filter(u => u.role === UserRole.TECHNICIAN);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return technicians.map(tech => {
            const techDoses = allIsotopesHistory.filter(h =>
                h.preparedBy?.id === tech.id &&
                new Date(h.timestamp).getTime() >= today.getTime()
            );

            const totalActivity = techDoses.reduce((sum, d) => sum + d.amount, 0);
            const completedDoses = techDoses.filter(d => d.status === DoseStatus.INJECTED).length;
            const pendingDoses = techDoses.filter(d => d.status === DoseStatus.PREPARED).length;

            return {
                id: tech.id,
                name: tech.name,
                totalDoses: techDoses.length,
                totalActivity,
                completedDoses,
                pendingDoses,
                lastActivity: techDoses.length > 0 ? new Date(Math.max(...techDoses.map(d => new Date(d.timestamp).getTime()))) : null
            };
        });
    }, [staffUsers, allIsotopesHistory]);

    // Today's statistics (from ALL isotopes)
    const todayStats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayDoses = allIsotopesHistory.filter(h => new Date(h.timestamp).getTime() >= today.getTime());
        const totalActivity = todayDoses.reduce((sum, d) => sum + d.amount, 0);
        const completedCount = todayDoses.filter(d => d.status === DoseStatus.INJECTED).length;

        // QC status
        const todayQC = qcRecords.filter(r => {
            const recordDate = new Date(r.date);
            return recordDate.toDateString() === today.toDateString();
        });
        const dailyQCDone = todayQC.some(r => r.type === 'daily');
        const dailyQCPassed = todayQC.find(r => r.type === 'daily')?.passed ?? null;

        // Waste stats (from ALL isotopes)
        const totalWasteActivity = allIsotopesWaste.reduce((sum, bin) => {
            const isotope = ISOTOPES.find(i => i.id === bin.isotopeId);
            if (!isotope) return sum;
            return sum + bin.items.reduce((itemSum, item) => {
                const halfLifeMinutes = isotope.halfLifeHours * 60;
                const elapsedMinutes = (now.getTime() - new Date(item.disposedAt).getTime()) / (1000 * 60);
                const currentActivity = calculateDecay(item.activity, halfLifeMinutes, elapsedMinutes);
                return itemSum + currentActivity;
            }, 0);
        }, 0);

        // Active contamination events
        const activeContaminations = contaminationEvents.filter(e => e.status === 'active').length;

        return {
            totalDoses: todayDoses.length,
            totalActivity,
            completedCount,
            pendingCount: todayDoses.length - completedCount,
            dailyQCDone,
            dailyQCPassed,
            totalWasteActivity,
            activeContaminations,
            activeVialsCount: allIsotopesVials.filter(v => v.currentActivity > 0.1).length,
            totalWasteBins: allIsotopesWaste.length
        };
    }, [allIsotopesHistory, qcRecords, allIsotopesWaste, contaminationEvents, allIsotopesVials, now]);

    // Today's daily control record
    const todayDailyControl = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return dailyControls.find(c => c.date === today) || null;
    }, [dailyControls]);

    // Add contamination event

    const handleAddContamination = () => {
        if (!newContamination.location || newContamination.activityLevel <= 0) return;

        const event: ContaminationEvent = {
            id: Math.random().toString(36).substr(2, 9),
            location: newContamination.location,
            isotope: newContamination.isotope,
            activityLevel: newContamination.activityLevel,
            unit: unit,
            reportedBy: 'Fizikçi',
            reportedAt: new Date(),
            status: 'active',
            description: newContamination.description,
            actions: []
        };

        const updated = [...contaminationEvents, event];
        setContaminationEvents(updated);
        localStorage.setItem(STORAGE_KEY_CONTAMINATION, JSON.stringify(updated));
        setShowContaminationForm(false);
        setNewContamination({ location: '', isotope: 'Tc-99m', activityLevel: 0, description: '' });
    };

    // Update contamination status
    const updateContaminationStatus = (id: string, status: 'active' | 'contained' | 'resolved') => {
        const updated = contaminationEvents.map(e => e.id === id ? { ...e, status } : e);
        setContaminationEvents(updated);
        localStorage.setItem(STORAGE_KEY_CONTAMINATION, JSON.stringify(updated));
    };

    const formatActivity = (value: number) => {
        if (value >= 100) return value.toFixed(0);
        if (value >= 10) return value.toFixed(1);
        return value.toFixed(2);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Tab button component
    const TabButton = ({ id, label, icon, count }: { id: typeof activeTab; label: string; icon: string; count?: number }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === id
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
        >
            <span>{icon}</span>
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === id ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-400'
                    }`}>
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202] text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-2xl shadow-lg shadow-teal-500/30">
                                ⚛️
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight">
                                    <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                                        Fizikçi Kontrol Paneli
                                    </span>
                                </h1>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Nükleer Tıp Sağlık Fizikçisi
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Current Time */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-sm font-bold tabular-nums">{formatTime(now)}</span>
                                <span className="text-xs text-slate-500">{formatDate(now)}</span>
                            </div>

                            {/* Logout Button */}
                            {onLogout && (
                                <button
                                    onClick={onLogout}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-400 text-red-400 hover:text-white rounded-xl font-bold text-sm transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Çıkış
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tab Navigation - Dropdown Menu */}
                    <div className="mt-4 relative">
                        <div className="flex items-center gap-3">
                            {/* Current Tab Display */}
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl font-bold text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all"
                            >
                                <span className="text-lg">
                                    {activeTab === 'overview' && '📊'}
                                    {activeTab === 'technicians' && '👥'}
                                    {activeTab === 'vials' && '🧪'}
                                    {activeTab === 'waste' && '♻️'}
                                    {activeTab === 'contamination' && '⚠️'}
                                    {activeTab === 'qc' && '✅'}
                                    {activeTab === 'radiation' && '☢️'}
                                    {activeTab === 'calibration' && '🔧'}
                                    {activeTab === 'protocols' && '📋'}
                                    {activeTab === 'archive' && '📁'}
                                </span>
                                <span>
                                    {activeTab === 'overview' && 'Genel Bakış'}
                                    {activeTab === 'technicians' && 'Teknisyen Takibi'}
                                    {activeTab === 'vials' && 'Flakon İzleme'}
                                    {activeTab === 'waste' && 'Atık Takibi'}
                                    {activeTab === 'contamination' && 'Kontaminasyon'}
                                    {activeTab === 'qc' && 'Kalite Kontrol'}
                                    {activeTab === 'radiation' && 'Personel Dozları'}
                                    {activeTab === 'calibration' && 'Kalibrasyon'}
                                    {activeTab === 'protocols' && 'Acil Protokoller'}
                                    {activeTab === 'archive' && 'Arşiv & Raporlar'}
                                </span>
                                <svg className={`w-5 h-5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                                {todayStats.activeContaminations > 0 && (
                                    <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">
                                        {todayStats.activeContaminations}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                                <div className="p-2">
                                    <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ana İşlemler</p>
                                    {[
                                        { id: 'overview' as const, label: 'Genel Bakış', icon: '📊' },
                                        { id: 'technicians' as const, label: 'Teknisyen Takibi', icon: '👥' },
                                        { id: 'vials' as const, label: 'Flakon İzleme', icon: '🧪' },
                                        { id: 'waste' as const, label: 'Atık Takibi', icon: '♻️' },
                                        { id: 'contamination' as const, label: 'Kontaminasyon', icon: '⚠️', count: todayStats.activeContaminations },
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => { setActiveTab(item.id); setMenuOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                                ? 'bg-teal-600/20 text-teal-400'
                                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <span className="text-lg">{item.icon}</span>
                                            <span>{item.label}</span>
                                            {item.count !== undefined && item.count > 0 && (
                                                <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">
                                                    {item.count}
                                                </span>
                                            )}
                                            {activeTab === item.id && (
                                                <svg className="ml-auto w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}

                                    <div className="my-2 border-t border-white/10"></div>
                                    <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Yönetim & Raporlama</p>
                                    {[
                                        { id: 'qc' as const, label: 'Kalite Kontrol', icon: '✅' },
                                        { id: 'radiation' as const, label: 'Personel Dozları', icon: '☢️' },
                                        { id: 'calibration' as const, label: 'Kalibrasyon', icon: '🔧' },
                                        { id: 'protocols' as const, label: 'Acil Protokoller', icon: '📋' },
                                        { id: 'archive' as const, label: 'Arşiv & Raporlar', icon: '📁' },
                                        { id: 'settings' as const, label: 'Ayarlar', icon: '⚙️' },
                                        { id: 'audit' as const, label: 'Audit Log', icon: '📜' },
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => { setActiveTab(item.id); setMenuOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                                ? 'bg-teal-600/20 text-teal-400'
                                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <span className="text-lg">{item.icon}</span>
                                            <span>{item.label}</span>
                                            {activeTab === item.id && (
                                                <svg className="ml-auto w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>




                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/20 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">💉</div>
                                    <div>
                                        <p className="text-2xl font-black text-blue-400">{todayStats.totalDoses}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Günlük Doz</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-500/20 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl">✓</div>
                                    <div>
                                        <p className="text-2xl font-black text-emerald-400">{todayStats.completedCount}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Tamamlanan</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-500/20 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">🧪</div>
                                    <div>
                                        <p className="text-2xl font-black text-amber-400">{todayStats.activeVialsCount}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Aktif Flakon</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`bg-gradient-to-br ${todayStats.dailyQCDone
                                ? (todayStats.dailyQCPassed ? 'from-emerald-900/30 to-emerald-800/20 border-emerald-500/20' : 'from-red-900/30 to-red-800/20 border-red-500/20')
                                : 'from-orange-900/30 to-orange-800/20 border-orange-500/20'} border rounded-2xl p-4`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${todayStats.dailyQCDone
                                        ? (todayStats.dailyQCPassed ? 'bg-emerald-500/20' : 'bg-red-500/20')
                                        : 'bg-orange-500/20'} flex items-center justify-center text-xl`}>
                                        {todayStats.dailyQCDone ? (todayStats.dailyQCPassed ? '✅' : '❌') : '⏳'}
                                    </div>
                                    <div>
                                        <p className={`text-2xl font-black ${todayStats.dailyQCDone
                                            ? (todayStats.dailyQCPassed ? 'text-emerald-400' : 'text-red-400')
                                            : 'text-orange-400'}`}>
                                            {todayStats.dailyQCDone ? (todayStats.dailyQCPassed ? 'OK' : 'FAIL') : 'Bekliyor'}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Günlük QC</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Daily Environmental Controls Panel */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center text-sm">🌡️</span>
                                Günlük Ortam Kontrolleri
                                {todayDailyControl ? (
                                    <span className="ml-auto px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold">
                                        ✅ {todayDailyControl.recordedBy.name} - {new Date(todayDailyControl.lastUpdatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                ) : (
                                    <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold animate-pulse">
                                        ⏳ Henüz Kaydedilmedi
                                    </span>
                                )}
                            </h3>

                            {todayDailyControl ? (
                                <div className="space-y-4">
                                    {/* Morning Measurements - 08:00 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">🌅</span>
                                            <span className="text-xs font-bold text-amber-400 uppercase">Sabah 08:00</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { key: 'sicakOda' as const, name: 'Sıcak Oda', icon: '☢️', color: 'text-orange-400' },
                                                { key: 'petCt' as const, name: 'PET/CT', icon: '🔬', color: 'text-blue-400' },
                                                { key: 'gamaKamera' as const, name: 'Gama Kamera', icon: '📷', color: 'text-purple-400' }
                                            ].map(room => (
                                                <div key={room.key} className="bg-white/5 rounded-xl p-3">
                                                    <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                                                        {room.icon} {room.name}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-bold ${room.color}`}>
                                                            {todayDailyControl.morning?.[room.key]?.temperature ?? '-'}°C
                                                        </span>
                                                        <span className="text-slate-600">|</span>
                                                        <span className="text-sm font-bold text-cyan-400">
                                                            {todayDailyControl.morning?.[room.key]?.humidity ?? '-'}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Evening Measurements - 16:00 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">🌆</span>
                                            <span className="text-xs font-bold text-indigo-400 uppercase">Akşam 16:00</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { key: 'sicakOda' as const, name: 'Sıcak Oda', icon: '☢️', color: 'text-orange-400' },
                                                { key: 'petCt' as const, name: 'PET/CT', icon: '🔬', color: 'text-blue-400' },
                                                { key: 'gamaKamera' as const, name: 'Gama Kamera', icon: '📷', color: 'text-purple-400' }
                                            ].map(room => (
                                                <div key={room.key} className="bg-white/5 rounded-xl p-3">
                                                    <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                                                        {room.icon} {room.name}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-bold ${room.color}`}>
                                                            {todayDailyControl.evening?.[room.key]?.temperature ?? '-'}°C
                                                        </span>
                                                        <span className="text-slate-600">|</span>
                                                        <span className="text-sm font-bold text-cyan-400">
                                                            {todayDailyControl.evening?.[room.key]?.humidity ?? '-'}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Oxygen Cylinder Check */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${todayDailyControl.oxygenCylinderCheck ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {todayDailyControl.oxygenCylinderCheck ? '✓' : '✗'} 🫁 Mobil Oksijen Tüpü
                                        </span>
                                    </div>

                                    {/* Notes */}
                                    {todayDailyControl.notes && (
                                        <div className="px-3 py-2 bg-slate-500/10 rounded-lg">
                                            <span className="text-xs text-slate-400">📝 {todayDailyControl.notes}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 text-sm">Tekniker henüz bugünkü ortam kontrollerini kaydetmedi.</p>
                                    <p className="text-slate-600 text-xs mt-1">Araçlar menüsünden "Günlük Kontrol" formunu doldurmalıdır.</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Active Alerts */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center text-sm">🚨</span>
                                    Aktif Uyarılar
                                </h3>
                                <div className="space-y-2">
                                    {todayStats.activeContaminations > 0 && (
                                        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <span className="text-xl">⚠️</span>
                                            <div>
                                                <p className="text-sm font-bold text-red-400">{todayStats.activeContaminations} Aktif Kontaminasyon</p>
                                                <p className="text-[10px] text-slate-500">Hemen müdahale gerekiyor</p>
                                            </div>
                                        </div>
                                    )}
                                    {!todayStats.dailyQCDone && (
                                        <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                            <span className="text-xl">📋</span>
                                            <div>
                                                <p className="text-sm font-bold text-orange-400">Günlük QC Yapılmadı</p>
                                                <p className="text-[10px] text-slate-500">Kalite kontrol testlerini tamamlayın</p>
                                            </div>
                                        </div>
                                    )}
                                    {todayStats.activeContaminations === 0 && todayStats.dailyQCDone && (
                                        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <span className="text-xl">✅</span>
                                            <div>
                                                <p className="text-sm font-bold text-emerald-400">Tüm Sistemler Normal</p>
                                                <p className="text-[10px] text-slate-500">Aktif uyarı bulunmuyor</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Technician Summary */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm">👥</span>
                                    Teknisyen Özeti
                                </h3>
                                <div className="space-y-2">
                                    {technicianStats.length === 0 ? (
                                        <p className="text-sm text-slate-500">Kayıtlı teknisyen bulunamadı</p>
                                    ) : (
                                        technicianStats.slice(0, 3).map(tech => (
                                            <div key={tech.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                        {tech.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{tech.name}</p>
                                                        <p className="text-[10px] text-slate-500">
                                                            {tech.lastActivity ? `Son: ${formatTime(tech.lastActivity)}` : 'Henüz işlem yok'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-blue-400">{tech.totalDoses}</p>
                                                    <p className="text-[10px] text-slate-500">doz</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Activity Summary */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-sm">📈</span>
                                Aktivite Özeti
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-white/5 rounded-xl">
                                    <p className="text-3xl font-black text-purple-400">{formatActivity(todayStats.totalActivity)}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Toplam Aktivite ({unit})</p>
                                </div>
                                <div className="text-center p-4 bg-white/5 rounded-xl">
                                    <p className="text-3xl font-black text-orange-400">{formatActivity(todayStats.totalWasteActivity)}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Atık Aktivite ({unit})</p>
                                </div>
                                <div className="text-center p-4 bg-white/5 rounded-xl">
                                    <p className="text-3xl font-black text-teal-400">{wasteBins.length}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Atık Kutusu</p>
                                </div>
                            </div>
                        </div>

                        {/* Daily Checklist & Shift Notes - 2 columns */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Daily Checklist Panel */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm">📋</span>
                                    Günlük Checklist
                                    {dailyChecklist && (
                                        <span className="ml-auto px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold">
                                            {dailyChecklist.items.filter(i => i.completed).length}/{dailyChecklist.items.length}
                                        </span>
                                    )}
                                </h3>
                                {dailyChecklist && (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                        {['morning', 'during', 'evening'].map(category => (
                                            <div key={category}>
                                                <p className={`text-[10px] font-bold uppercase mb-2 flex items-center gap-1 ${category === 'morning' ? 'text-amber-400' :
                                                    category === 'during' ? 'text-blue-400' : 'text-purple-400'
                                                    }`}>
                                                    {category === 'morning' ? '🌅 Sabah' : category === 'during' ? '☀️ Gün İçi' : '🌆 Kapanış'}
                                                </p>
                                                <div className="space-y-1">
                                                    {dailyChecklist.items.filter(i => i.category === category).map(item => (
                                                        <label key={item.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${item.completed ? 'bg-emerald-500/10' : 'bg-white/5 hover:bg-white/10'}`}>
                                                            <input type="checkbox" checked={item.completed} onChange={() => toggleChecklistItem(item.id)} className="w-4 h-4 rounded text-emerald-500" />
                                                            <span className={`text-xs ${item.completed ? 'text-emerald-400 line-through' : 'text-white'}`}>{item.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Shift Notes Panel */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-pink-500/20 flex items-center justify-center text-sm">📝</span>
                                    Vardiya Notları
                                    {shiftNotes.filter(n => !n.isRead).length > 0 && (
                                        <span className="ml-auto px-2 py-0.5 bg-pink-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                                            {shiftNotes.filter(n => !n.isRead).length} yeni
                                        </span>
                                    )}
                                </h3>
                                <div className="flex gap-2 mb-4">
                                    <input type="text" value={newShiftNote} onChange={(e) => setNewShiftNote(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addShiftNote()} placeholder="Vardiya notu ekle..." className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50" />
                                    <button onClick={addShiftNote} className="px-3 py-2 bg-pink-600 hover:bg-pink-500 rounded-lg text-white text-sm font-bold transition-all">Ekle</button>
                                </div>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                    {shiftNotes.length === 0 ? (
                                        <p className="text-xs text-slate-500 text-center py-4">Henüz vardiya notu yok</p>
                                    ) : (
                                        shiftNotes.slice(0, 10).map(note => (
                                            <div key={note.id} onClick={() => !note.isRead && markNoteAsRead(note.id)} className={`p-3 rounded-lg cursor-pointer transition-all ${note.isRead ? 'bg-white/5' : 'bg-pink-500/10 border border-pink-500/20'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${note.shift === 'morning' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{note.shift === 'morning' ? '🌅 Sabah' : '🌆 Akşam'}</span>
                                                    <span className="text-[10px] text-slate-500">{note.date}</span>
                                                    {!note.isRead && <span className="ml-auto w-2 h-2 rounded-full bg-pink-500"></span>}
                                                </div>
                                                <p className="text-xs text-white">{note.note}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Activity Trend Graph & Isotope Usage */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Weekly Activity Trend */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm">📈</span>
                                    Haftalık Aktivite Trendi
                                </h3>
                                <div className="flex items-end gap-2 h-32">
                                    {(() => {
                                        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
                                        const today = new Date().getDay();
                                        const weekData = days.map((day, i) => {
                                            const dayHistory = allIsotopesHistory.filter(h => {
                                                const d = new Date(h.timestamp);
                                                return d.getDay() === (i + 1) % 7;
                                            });
                                            return { day, total: dayHistory.reduce((sum, h) => sum + h.amount, 0), count: dayHistory.length };
                                        });
                                        const maxActivity = Math.max(...weekData.map(d => d.total), 1);

                                        return weekData.map((d, i) => (
                                            <div key={d.day} className="flex-1 flex flex-col items-center">
                                                <div className="w-full flex flex-col items-center justify-end h-24">
                                                    <span className="text-[8px] text-blue-400 mb-1">{d.count > 0 ? d.count : ''}</span>
                                                    <div
                                                        className={`w-full rounded-t transition-all ${(i + 1) % 7 === today ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-blue-600 to-cyan-400'}`}
                                                        style={{ height: `${Math.max(5, (d.total / maxActivity) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-[10px] mt-1 ${(i + 1) % 7 === today ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>{d.day}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Isotope Usage Pie Chart */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-sm">🥧</span>
                                    İzotop Kullanım Dağılımı
                                </h3>
                                <div className="flex items-center gap-4">
                                    {/* Pie Chart Simulation */}
                                    <div className="relative w-24 h-24">
                                        <svg viewBox="0 0 36 36" className="w-24 h-24 transform -rotate-90">
                                            {(() => {
                                                const isotopeUsage = ISOTOPES.map(iso => ({
                                                    id: iso.id,
                                                    name: iso.symbol,
                                                    color: iso.color,
                                                    total: allIsotopesHistory.filter(h => h.isotopeId === iso.id).length
                                                })).filter(i => i.total > 0);
                                                const totalUsage = isotopeUsage.reduce((sum, i) => sum + i.total, 0) || 1;
                                                let offset = 0;

                                                return isotopeUsage.map((iso, i) => {
                                                    const percent = (iso.total / totalUsage) * 100;
                                                    const strokeDasharray = `${percent} ${100 - percent}`;
                                                    const strokeDashoffset = -offset;
                                                    offset += percent;

                                                    return (
                                                        <circle
                                                            key={iso.id}
                                                            cx="18" cy="18" r="15.9"
                                                            fill="none"
                                                            stroke={iso.color}
                                                            strokeWidth="3"
                                                            strokeDasharray={strokeDasharray}
                                                            strokeDashoffset={strokeDashoffset}
                                                        />
                                                    );
                                                });
                                            })()}
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xl font-black text-white">{allIsotopesHistory.length}</span>
                                        </div>
                                    </div>
                                    {/* Legend */}
                                    <div className="flex-1 space-y-1">
                                        {ISOTOPES.filter(iso => allIsotopesHistory.some(h => h.isotopeId === iso.id)).slice(0, 5).map(iso => {
                                            const count = allIsotopesHistory.filter(h => h.isotopeId === iso.id).length;
                                            const percent = ((count / (allIsotopesHistory.length || 1)) * 100).toFixed(0);
                                            return (
                                                <div key={iso.id} className="flex items-center gap-2 text-xs">
                                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: iso.color }}></div>
                                                    <span className="text-white">{iso.symbol}</span>
                                                    <span className="text-slate-500 ml-auto">{count} ({percent}%)</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Procedure Stats & Equipment Maintenance */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Procedure Statistics */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm">📊</span>
                                    Prosedür İstatistikleri
                                </h3>
                                <div className="space-y-2">
                                    {(() => {
                                        const procedureCounts: { [key: string]: number } = {};
                                        allIsotopesHistory.forEach(h => {
                                            procedureCounts[h.procedure] = (procedureCounts[h.procedure] || 0) + 1;
                                        });
                                        const sorted = Object.entries(procedureCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
                                        const maxCount = sorted[0]?.[1] || 1;

                                        return sorted.length === 0 ? (
                                            <p className="text-slate-500 text-xs text-center py-4">Veri yok</p>
                                        ) : sorted.map(([procedure, count]) => (
                                            <div key={procedure} className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400 w-28 truncate">{procedure}</span>
                                                <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded"
                                                        style={{ width: `${(count / maxCount) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-400 w-8 text-right">{count}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Equipment Maintenance Calendar */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center text-sm">🔧</span>
                                    Cihaz Bakım Takvimi
                                </h3>
                                <div className="space-y-2">
                                    {defaultMaintenanceEquipment.map(eq => {
                                        const daysUntil = Math.ceil((eq.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                        const isOverdue = daysUntil < 0;
                                        const isUrgent = daysUntil >= 0 && daysUntil <= 30;

                                        return (
                                            <div key={eq.id} className={`flex items-center justify-between p-2 rounded-lg ${isOverdue ? 'bg-red-500/10 border border-red-500/20' : isUrgent ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5'}`}>
                                                <div>
                                                    <p className="text-xs font-bold text-white">{eq.equipmentName}</p>
                                                    <p className="text-[10px] text-slate-500">{eq.notes}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold ${isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                    {isOverdue ? `${Math.abs(daysUntil)} gün gecikmiş` : daysUntil === 0 ? 'Bugün' : `${daysUntil} gün`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Technicians Tab */}
                {activeTab === 'technicians' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">👥</span>
                                Teknisyen Performans Takibi
                            </h3>

                            {technicianStats.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-500">Kayıtlı teknisyen bulunamadı</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {technicianStats.map(tech => (
                                        <div key={tech.id} className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-5">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-black">
                                                    {tech.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-black text-white">{tech.name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Tekniker</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-white/5 rounded-xl p-3">
                                                    <p className="text-2xl font-black text-blue-400">{tech.totalDoses}</p>
                                                    <p className="text-[9px] text-slate-500 uppercase">Toplam Doz</p>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-3">
                                                    <p className="text-2xl font-black text-emerald-400">{tech.completedDoses}</p>
                                                    <p className="text-[9px] text-slate-500 uppercase">Tamamlanan</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Toplam Aktivite:</span>
                                                <span className="font-bold text-purple-400">{formatActivity(tech.totalActivity)} {unit}</span>
                                            </div>

                                            {tech.lastActivity && (
                                                <div className="flex items-center justify-between text-sm mt-2">
                                                    <span className="text-slate-500">Son İşlem:</span>
                                                    <span className="font-bold text-white">{formatTime(tech.lastActivity)}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Activity Log */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl">📋</span>
                                Son İşlemler
                            </h3>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {allIsotopesHistory.slice(0, 20).map(entry => (
                                    <div key={entry.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${entry.status === DoseStatus.INJECTED ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{entry.patientName}</p>
                                                <p className="text-[10px] text-slate-500">{entry.procedure} • <span className="text-blue-400">{entry.isotopeName}</span></p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-blue-400">{formatActivity(entry.amount)} {unit}</p>
                                            <p className="text-[10px] text-slate-500">
                                                {entry.preparedBy?.name || 'Bilinmeyen'} • {formatTime(new Date(entry.timestamp))}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Vials Tab */}
                {activeTab === 'vials' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">🧪</span>
                                Flakon İzleme
                            </h3>

                            {allIsotopesVials.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-500">Aktif flakon bulunamadı</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allIsotopesVials.map(vial => {

                                        const activityPercent = (vial.currentActivity / vial.initialAmount) * 100;
                                        const isLow = activityPercent < 20;
                                        const isCritical = activityPercent < 5;

                                        return (
                                            <div key={vial.id} className={`bg-gradient-to-br ${isCritical ? 'from-red-900/30 to-red-800/20 border-red-500/30' :
                                                isLow ? 'from-amber-900/30 to-amber-800/20 border-amber-500/30' :
                                                    'from-emerald-900/30 to-emerald-800/20 border-emerald-500/30'
                                                } border rounded-2xl p-5`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl ${isCritical ? 'bg-red-500/20' :
                                                            isLow ? 'bg-amber-500/20' :
                                                                'bg-emerald-500/20'
                                                            } flex items-center justify-center text-xl`}>
                                                            🧪
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white">{vial.label}</p>
                                                            <p className="text-[10px] text-slate-500 uppercase">{vial.isotopeName}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${isCritical ? 'bg-red-500/20 text-red-400' :
                                                        isLow ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-emerald-500/20 text-emerald-400'
                                                        }`}>
                                                        {isCritical ? 'Kritik' : isLow ? 'Düşük' : 'Normal'}
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-slate-500">Güncel Aktivite</span>
                                                            <span className={`font-black ${isCritical ? 'text-red-400' :
                                                                isLow ? 'text-amber-400' :
                                                                    'text-emerald-400'
                                                                }`}>{formatActivity(vial.currentActivity)} {unit}</span>
                                                        </div>
                                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${isCritical ? 'bg-red-500' :
                                                                    isLow ? 'bg-amber-500' :
                                                                        'bg-emerald-500'
                                                                    } transition-all`}
                                                                style={{ width: `${Math.min(100, activityPercent)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-500">Başlangıç:</span>
                                                        <span className="text-white">{formatActivity(vial.initialAmount)} {unit}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-500">Kalibrasyon:</span>
                                                        <span className="text-white">{formatTime(vial.calibrationTime)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Activity Decay Prediction Graph */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">📉</span>
                                24 Saatlik Aktivite Tahmini
                            </h3>
                            {allIsotopesVials.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-8">Aktif flakon bulunamadı</p>
                            ) : (
                                <div className="space-y-4">
                                    {allIsotopesVials.slice(0, 3).map(vial => {
                                        const isotope = ISOTOPES.find(i => i.id === vial.isotopeId);
                                        const halfLife = isotope?.halfLifeHours || 6;
                                        const hours = [0, 2, 4, 6, 8, 12, 16, 20, 24];
                                        const decayData = hours.map(h => ({
                                            hour: h,
                                            activity: vial.currentActivity * Math.pow(0.5, h / halfLife)
                                        }));
                                        const maxActivity = vial.currentActivity;

                                        return (
                                            <div key={vial.id} className="bg-white/5 rounded-xl p-4">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{vial.isotopeName}</p>
                                                        <p className="text-[10px] text-slate-500">t½ = {halfLife.toFixed(1)} saat</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-blue-400">{formatActivity(vial.currentActivity)} {unit}</span>
                                                </div>
                                                <div className="flex items-end gap-1 h-16">
                                                    {decayData.map((d, i) => (
                                                        <div key={i} className="flex-1 flex flex-col items-center">
                                                            <div
                                                                className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t"
                                                                style={{ height: `${(d.activity / maxActivity) * 100}%`, minHeight: '2px' }}
                                                            ></div>
                                                            <span className="text-[8px] text-slate-500 mt-1">{d.hour}h</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Stock Alerts */}
                        <div className="bg-gradient-to-br from-red-900/20 to-slate-800/50 border border-red-500/20 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-xl">⚠️</span>
                                Stok Uyarıları
                            </h3>
                            <div className="space-y-3">
                                {(() => {
                                    const lowVials = allIsotopesVials.filter(v => (v.currentActivity / v.initialAmount) * 100 < 20);
                                    const criticalVials = allIsotopesVials.filter(v => (v.currentActivity / v.initialAmount) * 100 < 5);

                                    if (lowVials.length === 0) {
                                        return <p className="text-emerald-400 text-sm text-center py-4">✓ Tüm stoklar yeterli seviyede</p>;
                                    }

                                    return (
                                        <>
                                            {criticalVials.length > 0 && (
                                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                                                    <p className="text-red-400 font-bold text-sm">🔴 Kritik Seviye ({criticalVials.length} flakon)</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {criticalVials.map(v => v.isotopeName).join(', ')} - Hemen sipariş gerekli
                                                    </p>
                                                </div>
                                            )}
                                            {lowVials.filter(v => (v.currentActivity / v.initialAmount) * 100 >= 5).length > 0 && (
                                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                                    <p className="text-amber-400 font-bold text-sm">🟡 Düşük Seviye ({lowVials.filter(v => (v.currentActivity / v.initialAmount) * 100 >= 5).length} flakon)</p>
                                                    <p className="text-xs text-slate-400 mt-1">Yarın için sipariş planlaması yapılmalı</p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Waste Tab */}
                {activeTab === 'waste' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl">♻️</span>
                                Atık Takibi
                            </h3>

                            {allIsotopesWaste.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-500">Atık kutusu bulunamadı</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allIsotopesWaste.map(bin => {
                                        const isotope = ISOTOPES.find(i => i.id === bin.isotopeId);
                                        const totalActivity = bin.items.reduce((sum, item) => {
                                            if (!isotope) return sum;
                                            const halfLifeMinutes = isotope.halfLifeHours * 60;
                                            const elapsedMinutes = (now.getTime() - new Date(item.disposedAt).getTime()) / (1000 * 60);
                                            return sum + calculateDecay(item.activity, halfLifeMinutes, elapsedMinutes);
                                        }, 0);

                                        const typeLabels = {
                                            'sharp': { label: 'Kesici/Delici', icon: '🔪', color: 'red' },
                                            'solid': { label: 'Katı', icon: '📦', color: 'amber' },
                                            'liquid': { label: 'Sıvı', icon: '💧', color: 'blue' }
                                        };
                                        const typeInfo = typeLabels[bin.type];

                                        return (
                                            <div key={bin.id} className={`bg-gradient-to-br from-${typeInfo.color}-900/20 to-${typeInfo.color}-800/10 border border-${typeInfo.color}-500/20 rounded-2xl p-5`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl bg-${typeInfo.color}-500/20 flex items-center justify-center text-xl`}>
                                                            {typeInfo.icon}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white">{bin.name}</p>
                                                            <p className="text-[10px] text-slate-500 uppercase">{typeInfo.label} • <span className="text-blue-400">{bin.isotopeName}</span></p>
                                                        </div>
                                                    </div>
                                                    {bin.isSealed && (
                                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-[10px] font-bold uppercase">
                                                            Mühürlü
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Güncel Aktivite:</span>
                                                        <span className="font-black text-orange-400">{formatActivity(totalActivity)} {unit}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Öğe Sayısı:</span>
                                                        <span className="font-bold text-white">{bin.items.length}</span>
                                                    </div>
                                                    {bin.sealedAt && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-500">Mühür Tarihi:</span>
                                                            <span className="font-bold text-white">{formatDate(new Date(bin.sealedAt))}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* Contamination Tab */}
                {activeTab === 'contamination' && (
                    <div className="space-y-6">
                        {/* Add Contamination Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowContaminationForm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-xl font-bold text-sm transition-all"
                            >
                                <span>➕</span>
                                Kontaminasyon Bildir
                            </button>
                        </div>

                        {/* Contamination Form Modal */}
                        {showContaminationForm && (
                            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                                    <h3 className="text-lg font-black text-white mb-4">Kontaminasyon Bildir</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2">Konum</label>
                                            <input
                                                type="text"
                                                value={newContamination.location}
                                                onChange={(e) => setNewContamination(prev => ({ ...prev, location: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
                                                placeholder="Örn: Sıcak Lab Tezgah 2"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2">İzotop</label>
                                            <select
                                                value={newContamination.isotope}
                                                onChange={(e) => setNewContamination(prev => ({ ...prev, isotope: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
                                            >
                                                <option value="Tc-99m">Tc-99m</option>
                                                <option value="F-18">F-18</option>
                                                <option value="Ga-68">Ga-68</option>
                                                <option value="I-131">I-131</option>
                                                <option value="Lu-177">Lu-177</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2">Aktivite Seviyesi ({unit})</label>
                                            <input
                                                type="number"
                                                value={newContamination.activityLevel}
                                                onChange={(e) => setNewContamination(prev => ({ ...prev, activityLevel: parseFloat(e.target.value) || 0 }))}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2">Açıklama</label>
                                            <textarea
                                                value={newContamination.description}
                                                onChange={(e) => setNewContamination(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 resize-none"
                                                rows={3}
                                                placeholder="Olay detayları..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={() => setShowContaminationForm(false)}
                                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm text-slate-400 transition-all"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={handleAddContamination}
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-xl font-bold text-sm transition-all"
                                        >
                                            Kaydet
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contamination Events */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-xl">⚠️</span>
                                Kontaminasyon Olayları
                            </h3>

                            {contaminationEvents.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-4">✅</div>
                                    <p className="text-slate-500">Kayıtlı kontaminasyon olayı bulunamadı</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {contaminationEvents.map(event => {
                                        const statusColors = {
                                            'active': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Aktif' },
                                            'contained': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Kontrol Altında' },
                                            'resolved': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Çözüldü' }
                                        };
                                        const statusInfo = statusColors[event.status];

                                        return (
                                            <div key={event.id} className={`bg-gradient-to-br from-slate-800/50 to-slate-700/30 border ${statusInfo.border} rounded-2xl p-5`}>
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl ${statusInfo.bg} flex items-center justify-center text-xl`}>
                                                            {event.status === 'active' ? '🔴' : event.status === 'contained' ? '🟡' : '🟢'}
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-black text-white">{event.location}</p>
                                                            <p className="text-[10px] text-slate-500">{event.isotope} • {formatActivity(event.activityLevel)} {event.unit}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 ${statusInfo.bg} ${statusInfo.text} rounded-lg text-[10px] font-bold uppercase`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </div>

                                                {event.description && (
                                                    <p className="text-sm text-slate-400 mb-4">{event.description}</p>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] text-slate-500">
                                                        {event.reportedBy} • {formatDate(event.reportedAt)} {formatTime(event.reportedAt)}
                                                    </p>

                                                    {event.status !== 'resolved' && (
                                                        <div className="flex gap-2">
                                                            {event.status === 'active' && (
                                                                <button
                                                                    onClick={() => updateContaminationStatus(event.id, 'contained')}
                                                                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-bold transition-all"
                                                                >
                                                                    Kontrol Altına Al
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => updateContaminationStatus(event.id, 'resolved')}
                                                                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-all"
                                                            >
                                                                Çözüldü
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* QC Tab */}
                {activeTab === 'qc' && (
                    <div className="space-y-6">
                        {/* QC Summary */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-500/20 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl">📅</div>
                                    <div>
                                        <p className="text-sm font-black text-white">Günlük QC</p>
                                        <p className="text-[10px] text-slate-500">Bugünkü durum</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {todayStats.dailyQCDone ? (
                                        todayStats.dailyQCPassed ? (
                                            <>
                                                <span className="text-2xl">✅</span>
                                                <span className="text-emerald-400 font-bold">Başarılı</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-2xl">❌</span>
                                                <span className="text-red-400 font-bold">Başarısız</span>
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <span className="text-2xl">⏳</span>
                                            <span className="text-amber-400 font-bold">Bekliyor</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/20 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">📊</div>
                                    <div>
                                        <p className="text-sm font-black text-white">Toplam Test</p>
                                        <p className="text-[10px] text-slate-500">Bu ay</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-blue-400">{qcRecords.length}</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/20 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl">📈</div>
                                    <div>
                                        <p className="text-sm font-black text-white">Başarı Oranı</p>
                                        <p className="text-[10px] text-slate-500">Genel</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-purple-400">
                                    {qcRecords.length > 0
                                        ? `${((qcRecords.filter(r => r.passed).length / qcRecords.length) * 100).toFixed(0)}%`
                                        : '-'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* QC Records */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-xl">✅</span>
                                Kalite Kontrol Kayıtları
                            </h3>

                            {qcRecords.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-500">Henüz QC kaydı bulunamadı</p>
                                    <p className="text-[10px] text-slate-600 mt-2">Kalite Kontrol modülünden yeni test ekleyebilirsiniz</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {qcRecords.slice(0, 20).map(record => {
                                        const typeLabels = {
                                            'daily': { label: 'Günlük', icon: '📅', color: 'blue' },
                                            'weekly': { label: 'Haftalık', icon: '📆', color: 'purple' },
                                            'kit': { label: 'Kit', icon: '🧪', color: 'teal' }
                                        };
                                        const typeInfo = typeLabels[record.type];

                                        return (
                                            <div key={record.id} className={`flex items-center justify-between p-4 bg-white/5 rounded-xl border ${record.passed ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl bg-${typeInfo.color}-500/20 flex items-center justify-center text-xl`}>
                                                        {typeInfo.icon}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-white">{typeInfo.label} QC</p>
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${record.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {record.passed ? 'Geçti' : 'Kaldı'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500">
                                                            {record.equipmentName || record.kitName || 'Genel'} • {record.performedBy}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-white">{record.date}</p>
                                                    <p className="text-[10px] text-slate-500">{record.tests.length} test</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Radiation Dose Tracking Tab */}
                {activeTab === 'radiation' && (
                    <div className="space-y-6">
                        {/* Dose Limits Overview */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-500/20 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-xl">☢️</div>
                                    <div>
                                        <p className="text-sm font-black text-white">Yıllık Limit</p>
                                        <p className="text-[10px] text-slate-500">Tüm Vücut</p>
                                    </div>
                                </div>
                                <p className="text-3xl font-black text-yellow-400">20 <span className="text-sm">mSv</span></p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-500/20 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl">✋</div>
                                    <div>
                                        <p className="text-sm font-black text-white">El Limiti</p>
                                        <p className="text-[10px] text-slate-500">Yıllık</p>
                                    </div>
                                </div>
                                <p className="text-3xl font-black text-orange-400">500 <span className="text-sm">mSv</span></p>
                            </div>

                            <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border border-cyan-500/20 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-xl">👁️</div>
                                    <div>
                                        <p className="text-sm font-black text-white">Göz Limiti</p>
                                        <p className="text-[10px] text-slate-500">Yıllık</p>
                                    </div>
                                </div>
                                <p className="text-3xl font-black text-cyan-400">20 <span className="text-sm">mSv</span></p>
                            </div>
                        </div>

                        {/* Staff Dose Table */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center text-xl">📊</span>
                                Personel Doz Kayıtları
                            </h3>

                            <div className="space-y-3">
                                {staffUsers.filter(u => u.role === 'tekniker').map(staff => (
                                    <div key={staff.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{staff.name}</p>
                                                <p className="text-[10px] text-slate-500">Dozimetre Okuması Bekleniyor</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-emerald-400">0.0 mSv</p>
                                                <p className="text-[10px] text-slate-500">Bu Ay</p>
                                            </div>
                                            <div className="h-8 w-20 bg-white/10 rounded-lg overflow-hidden">
                                                <div className="h-full bg-emerald-500 transition-all" style={{ width: '0%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {staffUsers.filter(u => u.role === 'tekniker').length === 0 && (
                                    <p className="text-center text-slate-500 py-8">Kayıtlı teknisyen bulunamadı</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Calibration Tab */}
                {activeTab === 'calibration' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">🔧</span>
                                Cihaz Kalibrasyon Takvimi
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Dose Calibrator */}
                                <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/20 rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">📟</div>
                                            <div>
                                                <p className="text-base font-black text-white">Doz Kalibratör</p>
                                                <p className="text-[10px] text-slate-500 uppercase">Günlük Constancy</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold">Geçerli</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Son Kalibrasyon:</span><span className="text-white">Bugün</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Sonraki:</span><span className="text-emerald-400">Yarın</span></div>
                                    </div>
                                </div>

                                {/* Gamma Camera */}
                                <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">📷</div>
                                            <div>
                                                <p className="text-base font-black text-white">Gamma Kamera</p>
                                                <p className="text-[10px] text-slate-500 uppercase">Haftalık QC</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold">Geçerli</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Son Kalibrasyon:</span><span className="text-white">3 gün önce</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Sonraki:</span><span className="text-blue-400">4 gün</span></div>
                                    </div>
                                </div>

                                {/* PET/CT */}
                                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/20 rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">🏥</div>
                                            <div>
                                                <p className="text-base font-black text-white">PET/CT</p>
                                                <p className="text-[10px] text-slate-500 uppercase">Yıllık Kalibrasyon</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold">Geçerli</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Son Kalibrasyon:</span><span className="text-white">2 ay önce</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Sonraki:</span><span className="text-purple-400">10 ay</span></div>
                                    </div>
                                </div>

                                {/* Survey Meter */}
                                <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-500/20 rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">📡</div>
                                            <div>
                                                <p className="text-base font-black text-white">Survey Metre</p>
                                                <p className="text-[10px] text-slate-500 uppercase">Yıllık</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold">Geçerli</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Son Kalibrasyon:</span><span className="text-white">1 ay önce</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Sonraki:</span><span className="text-amber-400">11 ay</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Emergency Protocols Tab */}
                {activeTab === 'protocols' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-xl">🚨</span>
                                Acil Durum Protokolleri
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Spill Protocol */}
                                <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/30 rounded-2xl p-5 hover:border-red-500/50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl">💧</div>
                                        <div>
                                            <p className="text-base font-black text-white">Radyoaktif Sızıntı</p>
                                            <p className="text-[10px] text-red-400 uppercase font-bold">Acil Müdahale</p>
                                        </div>
                                    </div>
                                    <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                                        <li>Alanı tahliye edin</li>
                                        <li>Koruyucu ekipman giyin</li>
                                        <li>Absorbent malzeme ile örtün</li>
                                        <li>Fizikçiyi bilgilendirin</li>
                                        <li>Dekontaminasyon prosedürü uygulayın</li>
                                    </ol>
                                </div>

                                {/* Personnel Contamination */}
                                <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border border-orange-500/30 rounded-2xl p-5 hover:border-orange-500/50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-2xl">👤</div>
                                        <div>
                                            <p className="text-base font-black text-white">Personel Kontaminasyonu</p>
                                            <p className="text-[10px] text-orange-400 uppercase font-bold">Hızlı Eylem</p>
                                        </div>
                                    </div>
                                    <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                                        <li>Kontamine giysiyi çıkarın</li>
                                        <li>Bol suyla yıkayın</li>
                                        <li>Survey metre ile kontrol edin</li>
                                        <li>Gerekirse tekrar yıkayın</li>
                                        <li>Olay formunu doldurun</li>
                                    </ol>
                                </div>

                                {/* Equipment Failure */}
                                <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-500/30 rounded-2xl p-5 hover:border-amber-500/50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">⚙️</div>
                                        <div>
                                            <p className="text-base font-black text-white">Cihaz Arızası</p>
                                            <p className="text-[10px] text-amber-400 uppercase font-bold">Prosedür</p>
                                        </div>
                                    </div>
                                    <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                                        <li>Cihazı kapatın</li>
                                        <li>Hastayı güvenli alana alın</li>
                                        <li>Radyasyon güvenliğini kontrol edin</li>
                                        <li>Teknik servisi arayın</li>
                                        <li>Olay kaydı oluşturun</li>
                                    </ol>
                                </div>

                                {/* Fire Emergency */}
                                <div className="bg-gradient-to-br from-rose-900/20 to-rose-800/10 border border-rose-500/30 rounded-2xl p-5 hover:border-rose-500/50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-2xl">🔥</div>
                                        <div>
                                            <p className="text-base font-black text-white">Yangın Acil Durumu</p>
                                            <p className="text-[10px] text-rose-400 uppercase font-bold">Tahliye</p>
                                        </div>
                                    </div>
                                    <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                                        <li>Yangın alarmını çalın</li>
                                        <li>Hastaları tahliye edin</li>
                                        <li>Radyoaktif kaynakları emniyete alın</li>
                                        <li>İtfaiyeyi bilgilendirin</li>
                                        <li>Toplanma noktasına gidin</li>
                                    </ol>
                                </div>
                            </div>

                            {/* Emergency Contacts */}
                            <div className="mt-6 p-4 bg-white/5 rounded-xl">
                                <h4 className="text-sm font-black text-white mb-3">📞 Acil İletişim</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                    <div className="p-3 bg-red-500/10 rounded-lg">
                                        <p className="text-lg font-black text-red-400">112</p>
                                        <p className="text-[10px] text-slate-500">Acil Yardım</p>
                                    </div>
                                    <div className="p-3 bg-blue-500/10 rounded-lg">
                                        <p className="text-lg font-black text-blue-400">TAEK</p>
                                        <p className="text-[10px] text-slate-500">(312) 287 12 00</p>
                                    </div>
                                    <div className="p-3 bg-amber-500/10 rounded-lg">
                                        <p className="text-lg font-black text-amber-400">İtfaiye</p>
                                        <p className="text-[10px] text-slate-500">110</p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                                        <p className="text-lg font-black text-emerald-400">Güvenlik</p>
                                        <p className="text-[10px] text-slate-500">Dahili: 1111</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Archive Tab */}
                {activeTab === 'archive' && (
                    <div className="space-y-6">
                        {/* Filter Controls */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-400">Dönem:</span>
                                    <div className="flex gap-1">
                                        {(['daily', 'monthly', 'yearly'] as const).map(filter => (
                                            <button
                                                key={filter}
                                                onClick={() => setArchiveFilter(filter)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${archiveFilter === filter
                                                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {filter === 'daily' ? 'Günlük' : filter === 'monthly' ? 'Aylık' : 'Yıllık'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-400">Tarih:</span>
                                    <input
                                        type={archiveFilter === 'daily' ? 'date' : archiveFilter === 'monthly' ? 'month' : 'number'}
                                        value={archiveFilter === 'yearly' ? new Date(archiveDate).getFullYear() : archiveDate.substring(0, archiveFilter === 'monthly' ? 7 : 10)}
                                        onChange={(e) => {
                                            if (archiveFilter === 'yearly') {
                                                setArchiveDate(`${e.target.value}-01-01`);
                                            } else if (archiveFilter === 'monthly') {
                                                setArchiveDate(`${e.target.value}-01`);
                                            } else {
                                                setArchiveDate(e.target.value);
                                            }
                                        }}
                                        min={archiveFilter === 'yearly' ? 2020 : undefined}
                                        max={archiveFilter === 'yearly' ? 2030 : undefined}
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Archive Statistics */}
                        <div className="grid md:grid-cols-4 gap-4">
                            {(() => {
                                const filterDate = new Date(archiveDate);
                                const filteredHistory = history.filter(h => {
                                    const entryDate = new Date(h.timestamp);
                                    if (archiveFilter === 'daily') {
                                        return entryDate.toDateString() === filterDate.toDateString();
                                    } else if (archiveFilter === 'monthly') {
                                        return entryDate.getMonth() === filterDate.getMonth() &&
                                            entryDate.getFullYear() === filterDate.getFullYear();
                                    } else {
                                        return entryDate.getFullYear() === filterDate.getFullYear();
                                    }
                                });
                                const filteredQC = qcRecords.filter(r => {
                                    const recordDate = new Date(r.date);
                                    if (archiveFilter === 'daily') {
                                        return recordDate.toDateString() === filterDate.toDateString();
                                    } else if (archiveFilter === 'monthly') {
                                        return recordDate.getMonth() === filterDate.getMonth() &&
                                            recordDate.getFullYear() === filterDate.getFullYear();
                                    } else {
                                        return recordDate.getFullYear() === filterDate.getFullYear();
                                    }
                                });
                                const filteredContamination = contaminationEvents.filter(e => {
                                    const eventDate = new Date(e.reportedAt);
                                    if (archiveFilter === 'daily') {
                                        return eventDate.toDateString() === filterDate.toDateString();
                                    } else if (archiveFilter === 'monthly') {
                                        return eventDate.getMonth() === filterDate.getMonth() &&
                                            eventDate.getFullYear() === filterDate.getFullYear();
                                    } else {
                                        return eventDate.getFullYear() === filterDate.getFullYear();
                                    }
                                });
                                const totalActivity = filteredHistory.reduce((sum, h) => sum + h.amount, 0);

                                return (
                                    <>
                                        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/20 rounded-2xl p-4">
                                            <p className="text-3xl font-black text-blue-400">{filteredHistory.length}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Toplam Doz</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/20 rounded-2xl p-4">
                                            <p className="text-3xl font-black text-purple-400">{formatActivity(totalActivity)}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Toplam Aktivite ({unit})</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-500/20 rounded-2xl p-4">
                                            <p className="text-3xl font-black text-emerald-400">{filteredQC.length}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">QC Testi</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-500/20 rounded-2xl p-4">
                                            <p className="text-3xl font-black text-red-400">{filteredContamination.length}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Kontaminasyon</p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Archive Details */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* QC Archive */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                                <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm">✅</span>
                                    Kalite Kontrol Arşivi
                                </h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {(() => {
                                        const filterDate = new Date(archiveDate);
                                        const filtered = qcRecords.filter(r => {
                                            const recordDate = new Date(r.date);
                                            if (archiveFilter === 'daily') return recordDate.toDateString() === filterDate.toDateString();
                                            if (archiveFilter === 'monthly') return recordDate.getMonth() === filterDate.getMonth() && recordDate.getFullYear() === filterDate.getFullYear();
                                            return recordDate.getFullYear() === filterDate.getFullYear();
                                        });
                                        if (filtered.length === 0) {
                                            return <p className="text-slate-500 text-sm text-center py-4">Bu dönemde QC kaydı yok</p>;
                                        }
                                        return filtered.map(record => (
                                            <div key={record.id} className={`p-3 rounded-xl border ${record.passed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-white">{record.type === 'daily' ? 'Günlük' : record.type === 'weekly' ? 'Haftalık' : 'Kit'} QC</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${record.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {record.passed ? 'Geçti' : 'Kaldı'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500">{record.date} • {record.performedBy}</p>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Contamination Archive */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                                <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center text-sm">⚠️</span>
                                    Kontaminasyon Arşivi
                                </h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {(() => {
                                        const filterDate = new Date(archiveDate);
                                        const filtered = contaminationEvents.filter(e => {
                                            const eventDate = new Date(e.reportedAt);
                                            if (archiveFilter === 'daily') return eventDate.toDateString() === filterDate.toDateString();
                                            if (archiveFilter === 'monthly') return eventDate.getMonth() === filterDate.getMonth() && eventDate.getFullYear() === filterDate.getFullYear();
                                            return eventDate.getFullYear() === filterDate.getFullYear();
                                        });
                                        if (filtered.length === 0) {
                                            return <p className="text-slate-500 text-sm text-center py-4">Bu dönemde kontaminasyon olayı yok</p>;
                                        }
                                        return filtered.map(event => (
                                            <div key={event.id} className={`p-3 rounded-xl border ${event.status === 'resolved' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                                event.status === 'contained' ? 'bg-amber-500/10 border-amber-500/20' :
                                                    'bg-red-500/10 border-red-500/20'
                                                }`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-white">{event.location}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${event.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        event.status === 'contained' ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {event.status === 'resolved' ? 'Çözüldü' : event.status === 'contained' ? 'Kontrol Altında' : 'Aktif'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500">{event.isotope} • {formatActivity(event.activityLevel)} {unit}</p>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Ortam Kontrolleri Arşivi - Full Width */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-black text-white flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center text-sm">🌡️</span>
                                    Ortam Kontrolleri Arşivi
                                </h4>
                                <button
                                    onClick={() => {
                                        const filterDate = new Date(archiveDate);
                                        const periodLabel = archiveFilter === 'daily' ? formatDate(filterDate) :
                                            archiveFilter === 'monthly' ? filterDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' }) :
                                                `${filterDate.getFullYear()} Yılı`;

                                        const filteredControls = dailyControls.filter(c => {
                                            const recordDate = new Date(c.date);
                                            if (archiveFilter === 'daily') return recordDate.toDateString() === filterDate.toDateString();
                                            if (archiveFilter === 'monthly') return recordDate.getMonth() === filterDate.getMonth() && recordDate.getFullYear() === filterDate.getFullYear();
                                            return recordDate.getFullYear() === filterDate.getFullYear();
                                        });

                                        const rooms = [
                                            { key: 'sicakOda', name: 'Sıcak Oda' },
                                            { key: 'petCt', name: 'PET/CT' },
                                            { key: 'gamaKamera', name: 'Gama Kamera' }
                                        ];

                                        let report = `GÜNLÜK ORTAM KONTROLLERİ RAPORU\n${'='.repeat(50)}\nDönem: ${periodLabel}\nRapor Tarihi: ${formatDate(now)} ${formatTime(now)}\n\n`;

                                        if (filteredControls.length === 0) {
                                            report += 'Bu dönemde kayıt bulunmamaktadır.\n';
                                        } else {
                                            filteredControls.forEach(control => {
                                                report += `${'='.repeat(50)}\nTARİH: ${control.date}\nKaydeden: ${control.recordedBy.name}\n\n`;

                                                report += `SABAH 08:00 ÖLÇÜMLERİ:\n${'-'.repeat(30)}\n`;
                                                rooms.forEach(room => {
                                                    const m = (control.morning as any)?.[room.key];
                                                    report += `  ${room.name}: ${m?.temperature ?? '-'}°C | ${m?.humidity ?? '-'}%RH\n`;
                                                });

                                                report += `\nAKŞAM 16:00 ÖLÇÜMLERİ:\n${'-'.repeat(30)}\n`;
                                                rooms.forEach(room => {
                                                    const e = (control.evening as any)?.[room.key];
                                                    report += `  ${room.name}: ${e?.temperature ?? '-'}°C | ${e?.humidity ?? '-'}%RH\n`;
                                                });

                                                report += `\nEKİPMAN KONTROLLERİ:\n${'-'.repeat(30)}\n`;
                                                report += `  Mobil Oksijen Tüpü: ${control.oxygenCylinderCheck ? '✓ Kontrol Edildi' : '✗ Kontrol Edilmedi'}\n`;

                                                if (control.notes) {
                                                    report += `\nNOTLAR: ${control.notes}\n`;
                                                }
                                                report += '\n';
                                            });
                                        }

                                        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `ortam_kontrolleri_${archiveFilter}_${archiveDate}.txt`;
                                        a.click();
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600 border border-teal-500/30 text-teal-400 hover:text-white rounded-lg text-xs font-bold transition-all"
                                >
                                    <span>📥</span> Rapor İndir
                                </button>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {(() => {
                                    const filterDate = new Date(archiveDate);
                                    const filtered = dailyControls.filter(c => {
                                        const recordDate = new Date(c.date);
                                        if (archiveFilter === 'daily') return recordDate.toDateString() === filterDate.toDateString();
                                        if (archiveFilter === 'monthly') return recordDate.getMonth() === filterDate.getMonth() && recordDate.getFullYear() === filterDate.getFullYear();
                                        return recordDate.getFullYear() === filterDate.getFullYear();
                                    });

                                    if (filtered.length === 0) {
                                        return <p className="text-slate-500 text-sm text-center py-4">Bu dönemde ortam kontrolü kaydı yok</p>;
                                    }

                                    return filtered.map(control => (
                                        <div key={control.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white">{control.date}</span>
                                                    <span className="text-[10px] text-slate-500">• {control.recordedBy.name}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${control.oxygenCylinderCheck ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    🫁 {control.oxygenCylinderCheck ? 'OK' : '-'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-[10px] text-amber-400 font-bold mb-1">🌅 Sabah 08:00</p>
                                                    <div className="space-y-1 text-[10px]">
                                                        <div className="flex justify-between"><span className="text-slate-500">☢️ Sıcak Oda</span><span className="text-white">{(control.morning as any)?.sicakOda?.temperature ?? '-'}°C | {(control.morning as any)?.sicakOda?.humidity ?? '-'}%</span></div>
                                                        <div className="flex justify-between"><span className="text-slate-500">🔬 PET/CT</span><span className="text-white">{(control.morning as any)?.petCt?.temperature ?? '-'}°C | {(control.morning as any)?.petCt?.humidity ?? '-'}%</span></div>
                                                        <div className="flex justify-between"><span className="text-slate-500">📷 Gama</span><span className="text-white">{(control.morning as any)?.gamaKamera?.temperature ?? '-'}°C | {(control.morning as any)?.gamaKamera?.humidity ?? '-'}%</span></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-indigo-400 font-bold mb-1">🌆 Akşam 16:00</p>
                                                    <div className="space-y-1 text-[10px]">
                                                        <div className="flex justify-between"><span className="text-slate-500">☢️ Sıcak Oda</span><span className="text-white">{(control.evening as any)?.sicakOda?.temperature ?? '-'}°C | {(control.evening as any)?.sicakOda?.humidity ?? '-'}%</span></div>
                                                        <div className="flex justify-between"><span className="text-slate-500">🔬 PET/CT</span><span className="text-white">{(control.evening as any)?.petCt?.temperature ?? '-'}°C | {(control.evening as any)?.petCt?.humidity ?? '-'}%</span></div>
                                                        <div className="flex justify-between"><span className="text-slate-500">📷 Gama</span><span className="text-white">{(control.evening as any)?.gamaKamera?.temperature ?? '-'}°C | {(control.evening as any)?.gamaKamera?.humidity ?? '-'}%</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                            {control.notes && (
                                                <p className="mt-2 text-[10px] text-slate-400 bg-slate-800/50 rounded px-2 py-1">📝 {control.notes}</p>
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Dose Activity Archive */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5">
                            <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm">💉</span>
                                Doz Aktivite Arşivi
                            </h4>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {(() => {
                                    const filterDate = new Date(archiveDate);
                                    const filtered = history.filter(h => {
                                        const entryDate = new Date(h.timestamp);
                                        if (archiveFilter === 'daily') return entryDate.toDateString() === filterDate.toDateString();
                                        if (archiveFilter === 'monthly') return entryDate.getMonth() === filterDate.getMonth() && entryDate.getFullYear() === filterDate.getFullYear();
                                        return entryDate.getFullYear() === filterDate.getFullYear();
                                    });
                                    if (filtered.length === 0) {
                                        return <p className="text-slate-500 text-sm text-center py-4">Bu dönemde doz kaydı yok</p>;
                                    }
                                    return filtered.map(entry => (
                                        <div key={entry.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${entry.status === DoseStatus.INJECTED ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{entry.patientName}</p>
                                                    <p className="text-[10px] text-slate-500">{entry.procedure}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-blue-400">{formatActivity(entry.amount)} {unit}</p>
                                                <p className="text-[10px] text-slate-500">{formatTime(new Date(entry.timestamp))} • {formatDate(new Date(entry.timestamp))}</p>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Export Options */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    const filterDate = new Date(archiveDate);
                                    const periodLabel = archiveFilter === 'daily' ? formatDate(filterDate) :
                                        archiveFilter === 'monthly' ? `${filterDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}` :
                                            `${filterDate.getFullYear()} Yılı`;
                                    const filteredHistory = history.filter(h => {
                                        const entryDate = new Date(h.timestamp);
                                        if (archiveFilter === 'daily') return entryDate.toDateString() === filterDate.toDateString();
                                        if (archiveFilter === 'monthly') return entryDate.getMonth() === filterDate.getMonth() && entryDate.getFullYear() === filterDate.getFullYear();
                                        return entryDate.getFullYear() === filterDate.getFullYear();
                                    });
                                    const totalActivity = filteredHistory.reduce((sum, h) => sum + h.amount, 0);
                                    const report = `NÜKLEER TIP FİZİKÇİ ARŞİV RAPORU\n${'='.repeat(40)}\nDönem: ${periodLabel}\nRapor Tarihi: ${formatDate(now)} ${formatTime(now)}\n\nÖZET İSTATİSTİKLER\n${'-'.repeat(40)}\nToplam Doz Sayısı: ${filteredHistory.length}\nToplam Aktivite: ${formatActivity(totalActivity)} ${unit}\nQC Test Sayısı: ${qcRecords.filter(r => {
                                        const d = new Date(r.date);
                                        if (archiveFilter === 'daily') return d.toDateString() === filterDate.toDateString();
                                        if (archiveFilter === 'monthly') return d.getMonth() === filterDate.getMonth() && d.getFullYear() === filterDate.getFullYear();
                                        return d.getFullYear() === filterDate.getFullYear();
                                    }).length}\nKontaminasyon Sayısı: ${contaminationEvents.filter(e => {
                                        const d = new Date(e.reportedAt);
                                        if (archiveFilter === 'daily') return d.toDateString() === filterDate.toDateString();
                                        if (archiveFilter === 'monthly') return d.getMonth() === filterDate.getMonth() && d.getFullYear() === filterDate.getFullYear();
                                        return d.getFullYear() === filterDate.getFullYear();
                                    }).length}\n`;
                                    const blob = new Blob([report], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `fizikci_rapor_${archiveDate}.txt`;
                                    a.click();
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold text-sm transition-all"
                            >
                                <span>📄</span>
                                Rapor İndir
                            </button>
                        </div>
                    </div>
                )}

                {/* Calibration Tab - Constancy Tests & Survey Meter */}
                {activeTab === 'calibration' && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Daily Constancy Test */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">⚖️</span>
                                    Doz Kalibratör Constancy Testi
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <p className="text-xs text-blue-400 font-bold mb-1">Referans Kaynak: Cs-137</p>
                                        <p className="text-xs text-slate-400">Referans Aktivite: 7.4 MBq (Kalibrasyon Tarihi: 01.01.2025)</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 block mb-1">Ölçülen Aktivite (MBq)</label>
                                            <input type="number" step="0.1" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder="7.35" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 block mb-1">Sapma (%)</label>
                                            <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm font-bold">
                                                ±0.7%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                        <p className="text-xs font-bold text-emerald-400">✓ Kabul Kriteri: ±5% dahilinde</p>
                                    </div>
                                    <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition-all">
                                        Test Kaydını Kaydet
                                    </button>
                                </div>
                            </div>

                            {/* Survey Meter Control */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">📡</span>
                                    Survey Metre Günlük Kontrol
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 block mb-1">Cihaz</label>
                                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                                                <option value="survey1">Survey Metre #1</option>
                                                <option value="survey2">Survey Metre #2</option>
                                                <option value="cont1">Kontaminasyon Monitörü</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 block mb-1">Pil Durumu</label>
                                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                                                <option value="good">🔋 İyi</option>
                                                <option value="low">🪫 Düşük</option>
                                                <option value="dead">❌ Bitti</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="w-4 h-4 rounded text-emerald-500" defaultChecked />
                                            <span className="text-xs text-white">Fonksiyon kontrolü yapıldı</span>
                                        </label>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Kalibrasyon Son Kullanma:</span>
                                            <span className="text-emerald-400 font-bold">01.09.2026</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-bold transition-all">
                                        Kontrol Kaydını Kaydet
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Constancy Tests */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">📋</span>
                                Son Constancy Test Sonuçları
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-2 px-3 text-slate-400 font-bold">Tarih</th>
                                            <th className="text-left py-2 px-3 text-slate-400 font-bold">Saat</th>
                                            <th className="text-left py-2 px-3 text-slate-400 font-bold">Referans</th>
                                            <th className="text-left py-2 px-3 text-slate-400 font-bold">Ölçülen</th>
                                            <th className="text-left py-2 px-3 text-slate-400 font-bold">Sapma</th>
                                            <th className="text-left py-2 px-3 text-slate-400 font-bold">Sonuç</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { date: '11.01.2026', time: '08:15', ref: 7.40, measured: 7.35, deviation: -0.7, result: 'passed' },
                                            { date: '10.01.2026', time: '08:22', ref: 7.40, measured: 7.42, deviation: 0.3, result: 'passed' },
                                            { date: '09.01.2026', time: '08:10', ref: 7.40, measured: 7.38, deviation: -0.3, result: 'passed' },
                                            { date: '08.01.2026', time: '08:18', ref: 7.40, measured: 7.44, deviation: 0.5, result: 'passed' },
                                            { date: '07.01.2026', time: '08:25', ref: 7.40, measured: 7.36, deviation: -0.5, result: 'passed' },
                                        ].map((test, i) => (
                                            <tr key={i} className="border-b border-white/5">
                                                <td className="py-2 px-3 text-white">{test.date}</td>
                                                <td className="py-2 px-3 text-slate-400">{test.time}</td>
                                                <td className="py-2 px-3 text-slate-400">{test.ref} MBq</td>
                                                <td className="py-2 px-3 text-white">{test.measured} MBq</td>
                                                <td className={`py-2 px-3 font-bold ${Math.abs(test.deviation) > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>{test.deviation > 0 ? '+' : ''}{test.deviation}%</td>
                                                <td className="py-2 px-3">
                                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Geçti</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Radiation Tab - Personnel Doses & TAEK Compliance */}
                {activeTab === 'radiation' && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Dosimeter Service Reminder */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-2xl">🔖</span>
                                    Dozimetre Takibi (Harici Servis)
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <p className="text-xs text-blue-400 font-bold mb-2">ℹ️ Bilgi</p>
                                        <p className="text-xs text-slate-300">Personel dozimetreleri harici dozimetri firması tarafından takip edilmektedir. TLD/OSL değişim ve okuma işlemleri firma tarafından gerçekleştirilir.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-white/5 rounded-xl">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Değişim Periyodu</p>
                                            <p className="text-sm font-bold text-white">2 Ayda Bir</p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-xl">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Sonraki Değişim</p>
                                            <p className="text-sm font-bold text-amber-400">Şubat 1</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Dozimetre Taşıyan Personel</p>
                                        {staffUsers.filter(s => s.role === UserRole.TECHNICIAN || s.role === UserRole.PHYSICIST).slice(0, 4).map(staff => (
                                            <div key={staff.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                                                <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{staff.name.charAt(0)}</div>
                                                <span className="text-xs text-white">{staff.name}</span>
                                                <span className="ml-auto text-[10px] text-emerald-400">✓ TLD Aktif</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Pediatric Dose Limits */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-2xl">👶</span>
                                    Pediatrik Doz Limitleri (EANM)
                                </h3>
                                <div className="space-y-2">
                                    {[
                                        { age: '0-1 yıl', weight: '3-10 kg', fdg: '14-37', tc: '15-56' },
                                        { age: '1-5 yıl', weight: '10-19 kg', fdg: '37-70', tc: '56-112' },
                                        { age: '5-10 yıl', weight: '19-32 kg', fdg: '70-110', tc: '112-168' },
                                        { age: '10-15 yıl', weight: '32-55 kg', fdg: '110-175', tc: '168-280' },
                                        { age: '>15 yıl', weight: '>55 kg', fdg: '175-370', tc: '280-740' },
                                    ].map(row => (
                                        <div key={row.age} className="grid grid-cols-4 gap-2 p-2 bg-white/5 rounded-lg text-xs">
                                            <span className="text-white font-bold">{row.age}</span>
                                            <span className="text-slate-400">{row.weight}</span>
                                            <span className="text-blue-400">{row.fdg} MBq</span>
                                            <span className="text-emerald-400">{row.tc} MBq</span>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-4 gap-2 p-2 text-[10px] text-slate-500 border-t border-white/10 mt-2">
                                        <span>Yaş</span><span>Kilo</span><span>F-18 FDG</span><span>Tc-99m</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TAEK Report Templates */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl">📋</span>
                                TAEK Rapor Şablonları
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {[
                                    { name: 'Aylık Aktivite Raporu', desc: 'Tüm izotopların aylık kullanım özeti', icon: '📊' },
                                    { name: 'Personel Doz Raporu', desc: 'Çalışan radyasyon maruziyeti', icon: '👥' },
                                    { name: 'Atık Bertaraf Raporu', desc: 'Radyoaktif atık kayıtları', icon: '♻️' },
                                    { name: 'Kontaminasyon Raporu', desc: 'Olay ve müdahale kayıtları', icon: '⚠️' },
                                    { name: 'Kalibrasyon Raporu', desc: 'Cihaz kalibrasyon sonuçları', icon: '🔧' },
                                    { name: 'Yıllık Özet Rapor', desc: 'TAEK yıllık zorunlu rapor', icon: '📁' },
                                ].map(report => (
                                    <button key={report.name} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left transition-all group">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{report.icon}</span>
                                            <div>
                                                <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{report.name}</p>
                                                <p className="text-[10px] text-slate-500">{report.desc}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Personnel Authorization */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl">🎫</span>
                                Personel Yetki Durumu
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {staffUsers.filter(s => s.role === UserRole.TECHNICIAN || s.role === UserRole.PHYSICIST).slice(0, 6).map((staff, i) => (
                                    <div key={staff.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">{staff.name.charAt(0)}</div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{staff.name}</p>
                                                <p className="text-[10px] text-slate-500">{staff.role === UserRole.TECHNICIAN ? 'Nükleer Tıp Teknisyeni' : 'Medikal Fizikçi'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between"><span className="text-slate-500">Radyasyon Çalışma İzni</span><span className={`font-bold ${i % 4 === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{i % 4 === 0 ? '⚠ 30 gün' : '✓ Geçerli'}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500">Sağlık Kontrolü</span><span className="text-emerald-400 font-bold">✓ Geçerli</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500">Dozimetre Kaydı</span><span className="text-emerald-400 font-bold">✓ Güncel</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* QC Tab - Quality Control */}
                {activeTab === 'qc' && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Camera QC Form */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">📷</span>
                                    Kamera QC Kaydı
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 block mb-1">Kamera Tipi</label>
                                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                                                <option value="SPECT">SPECT</option>
                                                <option value="PET">PET</option>
                                                <option value="PET/CT">PET/CT</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 block mb-1">Test Tipi</label>
                                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                                                <option value="uniformity">Uniformity</option>
                                                <option value="center_rotation">Center of Rotation</option>
                                                <option value="resolution">Çözünürlük</option>
                                                <option value="sensitivity">Hassasiyet</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-1">Sonuç</label>
                                        <div className="flex gap-2">
                                            {['passed', 'marginal', 'failed'].map(result => (
                                                <button key={result} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${result === 'passed' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' :
                                                    result === 'marginal' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' :
                                                        'bg-red-600/20 text-red-400 border border-red-500/30'
                                                    }`}>
                                                    {result === 'passed' ? '✓ Geçti' : result === 'marginal' ? '⚠ Sınırda' : '✗ Başarısız'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-1">Notlar</label>
                                        <textarea className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none" rows={2} placeholder="Test notları..."></textarea>
                                    </div>
                                    <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold transition-all">
                                        QC Kaydı Ekle
                                    </button>
                                </div>
                            </div>

                            {/* Recent QC Records */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">📋</span>
                                    Son QC Kayıtları
                                </h3>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                                    {cameraQCRecords.length === 0 ? (
                                        <p className="text-slate-500 text-sm text-center py-8">Henüz kamera QC kaydı yok</p>
                                    ) : (
                                        cameraQCRecords.slice(0, 10).map(record => (
                                            <div key={record.id} className={`p-3 rounded-xl border ${record.result === 'passed' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                                record.result === 'marginal' ? 'bg-amber-500/10 border-amber-500/20' :
                                                    'bg-red-500/10 border-red-500/20'
                                                }`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-white">{record.cameraType} - {record.testType}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${record.result === 'passed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        record.result === 'marginal' ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>{record.result === 'passed' ? 'Geçti' : record.result === 'marginal' ? 'Sınırda' : 'Başarısız'}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500">{record.date} • {record.performedBy}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* QC Schedule */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">📅</span>
                                QC Takvimi
                            </h3>
                            <div className="grid md:grid-cols-4 gap-4">
                                {[
                                    { name: 'Günlük Uniformity', freq: 'Her Gün', status: todayStats.dailyQCDone ? 'done' : 'pending' },
                                    { name: 'Haftalık COR', freq: 'Her Pazartesi', status: 'done' },
                                    { name: 'Aylık Çözünürlük', freq: 'Ayın 1\'i', status: 'pending' },
                                    { name: 'Yıllık ACR Fantom', freq: 'Yıllık', status: 'done' },
                                ].map(item => (
                                    <div key={item.name} className={`p-4 rounded-xl border ${item.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                        <p className="text-sm font-bold text-white">{item.name}</p>
                                        <p className="text-[10px] text-slate-500">{item.freq}</p>
                                        <span className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {item.status === 'done' ? '✓ Tamamlandı' : '⏳ Bekliyor'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Protocols Tab - Emergency Procedures */}
                {activeTab === 'protocols' && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Radioactive Spill Protocol */}
                            <div className="bg-gradient-to-br from-red-900/30 to-slate-800/50 border border-red-500/20 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl">☢️</span>
                                    Radyoaktif Döküntü Protokolü
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { step: 1, title: 'DURDUR', desc: 'Çalışmayı derhal durdurun. Sakin olun.', color: 'bg-red-500' },
                                        { step: 2, title: 'BİLDİR', desc: 'RSO ve bölüm sorumlusunu bilgilendirin.', color: 'bg-orange-500' },
                                        { step: 3, title: 'İZOLE ET', desc: 'Bölgeyi işaretleyin ve erişimi engelleyin.', color: 'bg-amber-500' },
                                        { step: 4, title: 'KORU', desc: 'Koruyucu ekipman (eldiven, önlük) giyin.', color: 'bg-yellow-500' },
                                        { step: 5, title: 'TEMİZLE', desc: 'Sıvı: Emici malzeme ile, Katı: Forseps ile toplayın.', color: 'bg-lime-500' },
                                        { step: 6, title: 'ÖLÇÜM', desc: 'Survey metre ile kontaminasyon kontrolü yapın.', color: 'bg-green-500' },
                                        { step: 7, title: 'KAYIT', desc: 'Olay formunu doldurun ve RSO\'ya iletin.', color: 'bg-emerald-500' },
                                    ].map(item => (
                                        <div key={item.step} className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-white font-black text-sm shrink-0`}>{item.step}</div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.title}</p>
                                                <p className="text-xs text-slate-400">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <p className="text-xs text-red-300 font-bold">⚠️ Büyük Döküntü (&gt;100 MBq):</p>
                                    <p className="text-xs text-slate-400 mt-1">Bölgeyi tamamen boşaltın, radyasyon güvenliği ekibini çağırın.</p>
                                </div>
                            </div>

                            {/* Emergency Contacts */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">📞</span>
                                    Acil İletişim Listesi
                                </h3>
                                <div className="space-y-3">
                                    {emergencyContacts.map(contact => (
                                        <div key={contact.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                                            <div>
                                                <p className="text-sm font-bold text-white">{contact.name}</p>
                                                <p className="text-[10px] text-slate-500">{contact.role}</p>
                                            </div>
                                            <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-bold transition-all">
                                                📞 {contact.phone}
                                            </a>
                                        </div>
                                    ))}
                                </div>

                                {/* Quick Reference */}
                                <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <p className="text-xs text-blue-300 font-bold mb-2">📋 Hızlı Başvuru</p>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div className="bg-white/5 rounded-lg p-2">
                                            <p className="text-slate-400">Tc-99m Yarı Ömür</p>
                                            <p className="text-white font-bold">6.01 saat</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-2">
                                            <p className="text-slate-400">F-18 Yarı Ömür</p>
                                            <p className="text-white font-bold">109.8 dk</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-2">
                                            <p className="text-slate-400">I-131 Yarı Ömür</p>
                                            <p className="text-white font-bold">8.02 gün</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-2">
                                            <p className="text-slate-400">Ga-68 Yarı Ömür</p>
                                            <p className="text-white font-bold">67.7 dk</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contamination Levels Guide */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">📊</span>
                                Kontaminasyon Seviyeleri ve Müdahale
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <p className="text-sm font-bold text-emerald-400 mb-2">🟢 Düşük Seviye</p>
                                    <p className="text-xs text-slate-400 mb-2">&lt; 4 kBq/cm² (β, γ)</p>
                                    <ul className="text-[10px] text-slate-300 space-y-1">
                                        <li>• Standart temizlik prosedürü</li>
                                        <li>• Tek kullanımlık eldiven</li>
                                        <li>• Normal atık bertarafı</li>
                                    </ul>
                                </div>
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                    <p className="text-sm font-bold text-amber-400 mb-2">🟡 Orta Seviye</p>
                                    <p className="text-xs text-slate-400 mb-2">4-40 kBq/cm²</p>
                                    <ul className="text-[10px] text-slate-300 space-y-1">
                                        <li>• Dekontaminasyon çözümü kullanın</li>
                                        <li>• Çift eldiven, koruyucu önlük</li>
                                        <li>• RSO'yu bilgilendirin</li>
                                    </ul>
                                </div>
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-sm font-bold text-red-400 mb-2">🔴 Yüksek Seviye</p>
                                    <p className="text-xs text-slate-400 mb-2">&gt; 40 kBq/cm²</p>
                                    <ul className="text-[10px] text-slate-300 space-y-1">
                                        <li>• Bölgeyi tahliye edin</li>
                                        <li>• RSO ve TAEK'i bilgilendirin</li>
                                        <li>• Profesyonel dekontaminasyon</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Default Values */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">⚙️</span>
                                    Varsayılan Değerler
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-1">Varsayılan Aktivite Birimi</label>
                                        <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" defaultValue={unit}>
                                            <option value="mCi">mCi (milliCurie)</option>
                                            <option value="MBq">MBq (megaBecquerel)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-1">Ortam Sıcaklık Limiti (°C)</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="number" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder="Min: 18" defaultValue="18" />
                                            <input type="number" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder="Max: 25" defaultValue="25" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-1">Ortam Nem Limiti (%)</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="number" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder="Min: 30" defaultValue="30" />
                                            <input type="number" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder="Max: 60" defaultValue="60" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-1">Constancy Test Sapma Limiti (%)</label>
                                        <input type="number" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder="5" defaultValue="5" />
                                    </div>
                                </div>
                            </div>

                            {/* Notification Preferences */}
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">🔔</span>
                                    Bildirim Tercihleri
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Düşük stok uyarıları', enabled: true },
                                        { label: 'Bakım hatırlatıcıları', enabled: true },
                                        { label: 'QC test hatırlatıcısı', enabled: true },
                                        { label: 'Vardiya notu bildirimleri', enabled: true },
                                        { label: 'Kontaminasyon uyarıları', enabled: true },
                                        { label: 'Sesli bildirimler', enabled: false },
                                    ].map((pref, i) => (
                                        <label key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                                            <span className="text-sm text-white">{pref.label}</span>
                                            <div className={`w-10 h-6 rounded-full transition-all ${pref.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                                                <div className={`w-4 h-4 mt-1 rounded-full bg-white transition-all ${pref.enabled ? 'ml-5' : 'ml-1'}`}></div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Data Management */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl">💾</span>
                                Veri Yönetimi
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                <button className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-left transition-all">
                                    <p className="text-sm font-bold text-blue-400">📤 Verileri Dışa Aktar</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Tüm kayıtları JSON formatında indir</p>
                                </button>
                                <button className="p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-left transition-all">
                                    <p className="text-sm font-bold text-amber-400">📥 Verileri İçe Aktar</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Yedek dosyasından geri yükle</p>
                                </button>
                                <button className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-left transition-all">
                                    <p className="text-sm font-bold text-red-400">🗑️ Günlük Verileri Temizle</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Sadece bugünün verilerini sil</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Audit Log Tab */}
                {activeTab === 'audit' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl">📜</span>
                                Sistem Aktivite Kaydı
                            </h3>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['Tümü', 'Doz', 'QC', 'Atık', 'Hasta', 'Sistem'].map(filter => (
                                    <button key={filter} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'Tümü' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            {/* Log Entries */}
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {[
                                    { time: '13:35', action: 'Doz hazırlandı', user: 'Teknisyen A', details: 'Tc-99m MDP 15 mCi - Ahmet Y.', category: 'dose' },
                                    { time: '13:20', action: 'Constancy testi kaydedildi', user: 'Fizikçi', details: 'Sapma: -0.7%, Sonuç: Geçti', category: 'qc' },
                                    { time: '12:45', action: 'Hasta çekimi tamamlandı', user: 'Teknisyen B', details: 'Kemik sintigrafisi - Mehmet K.', category: 'patient' },
                                    { time: '12:30', action: 'Atık kutusu güncellendi', user: 'Teknisyen A', details: 'Kesici atık kutusuna 0.5 mCi eklendi', category: 'waste' },
                                    { time: '11:15', action: 'Vardiya notu eklendi', user: 'Fizikçi', details: 'Sabah kontrolleri tamamlandı', category: 'system' },
                                    { time: '10:30', action: 'Flakon alındı', user: 'Teknisyen B', details: 'Tc-99m 250 mCi yeni flakon', category: 'dose' },
                                    { time: '09:00', action: 'Ortam kontrolü yapıldı', user: 'Teknisyen A', details: 'Sıcaklık: 22°C, Nem: 45%', category: 'qc' },
                                    { time: '08:30', action: 'Sistem başlatıldı', user: 'Fizikçi', details: 'Günlük oturum açıldı', category: 'system' },
                                ].map((log, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${log.category === 'dose' ? 'bg-blue-500/20 text-blue-400' :
                                                log.category === 'qc' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    log.category === 'waste' ? 'bg-orange-500/20 text-orange-400' :
                                                        log.category === 'patient' ? 'bg-pink-500/20 text-pink-400' :
                                                            'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {log.category === 'dose' ? '💉' :
                                                log.category === 'qc' ? '✅' :
                                                    log.category === 'waste' ? '♻️' :
                                                        log.category === 'patient' ? '👤' : '⚙️'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white">{log.action}</span>
                                                <span className="text-[10px] text-slate-500">• {log.user}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate">{log.details}</p>
                                        </div>
                                        <span className="text-[10px] text-slate-500 shrink-0">{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>


        </div>
    );
}

export default PhysicistDashboard;
