import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PendingPatient, DoseLogEntry, DoseStatus } from '../types';

interface RoomPatient {
    roomId: string;
    startTime: Date;
    patientId: string;
    patientName: string;
    procedure?: string;
    isotopeId?: string;
}

interface ImagingPatient {
    startTime: Date;
}

interface AdditionalImagingInfo {
    region: string;
    addedAt: Date;
    scheduledMinutes: number;
}

interface PatientState {
    // Pending patients waiting to be processed
    pendingPatients: PendingPatient[];

    // Patients currently in injection rooms
    patientsInRooms: Record<string, RoomPatient>;

    // Patients currently in imaging
    patientsInImaging: Record<string, ImagingPatient>;

    // Patients scheduled for additional imaging
    additionalImagingPatients: Record<string, AdditionalImagingInfo>;

    // Dose history (all patients who received doses)
    history: DoseLogEntry[];

    // Actions
    addPendingPatient: (patient: PendingPatient) => void;
    removePendingPatient: (patientId: string) => void;
    updatePendingPatient: (patientId: string, updates: Partial<PendingPatient>) => void;

    assignToRoom: (patientId: string, roomInfo: RoomPatient) => void;
    removeFromRoom: (patientId: string) => void;

    startImaging: (patientId: string, startTime: Date) => void;
    finishImaging: (patientId: string) => void;

    addAdditionalImaging: (patientId: string, info: AdditionalImagingInfo) => void;
    removeAdditionalImaging: (patientId: string) => void;

    addToHistory: (entry: DoseLogEntry) => void;
    updateHistoryEntry: (entryId: string, updates: Partial<DoseLogEntry>) => void;

    // Bulk operations
    setPendingPatients: (patients: PendingPatient[]) => void;
    setHistory: (history: DoseLogEntry[]) => void;
    setPatientsInRooms: (rooms: Record<string, RoomPatient>) => void;
    setPatientsInImaging: (imaging: Record<string, ImagingPatient>) => void;
    setAdditionalImagingPatients: (additional: Record<string, AdditionalImagingInfo>) => void;
}

export const usePatientStore = create<PatientState>()(
    persist(
        (set) => ({
            pendingPatients: [],
            patientsInRooms: {},
            patientsInImaging: {},
            additionalImagingPatients: {},
            history: [],

            addPendingPatient: (patient) =>
                set((state) => ({
                    pendingPatients: [...state.pendingPatients, patient],
                })),

            removePendingPatient: (patientId) =>
                set((state) => ({
                    pendingPatients: state.pendingPatients.filter((p) => p.id !== patientId),
                })),

            updatePendingPatient: (patientId, updates) =>
                set((state) => ({
                    pendingPatients: state.pendingPatients.map((p) =>
                        p.id === patientId ? { ...p, ...updates } : p
                    ),
                })),

            assignToRoom: (patientId, roomInfo) =>
                set((state) => ({
                    patientsInRooms: { ...state.patientsInRooms, [patientId]: roomInfo },
                })),

            removeFromRoom: (patientId) =>
                set((state) => {
                    const { [patientId]: _, ...rest } = state.patientsInRooms;
                    return { patientsInRooms: rest };
                }),

            startImaging: (patientId, startTime) =>
                set((state) => ({
                    patientsInImaging: { ...state.patientsInImaging, [patientId]: { startTime } },
                })),

            finishImaging: (patientId) =>
                set((state) => {
                    const { [patientId]: _, ...rest } = state.patientsInImaging;
                    return { patientsInImaging: rest };
                }),

            addAdditionalImaging: (patientId, info) =>
                set((state) => ({
                    additionalImagingPatients: { ...state.additionalImagingPatients, [patientId]: info },
                })),

            removeAdditionalImaging: (patientId) =>
                set((state) => {
                    const { [patientId]: _, ...rest } = state.additionalImagingPatients;
                    return { additionalImagingPatients: rest };
                }),

            addToHistory: (entry) =>
                set((state) => ({
                    history: [entry, ...state.history],
                })),

            updateHistoryEntry: (entryId, updates) =>
                set((state) => ({
                    history: state.history.map((h) =>
                        h.id === entryId ? { ...h, ...updates } : h
                    ),
                })),

            // Bulk setters for migration
            setPendingPatients: (patients) => set({ pendingPatients: patients }),
            setHistory: (history) => set({ history }),
            setPatientsInRooms: (rooms) => set({ patientsInRooms: rooms }),
            setPatientsInImaging: (imaging) => set({ patientsInImaging: imaging }),
            setAdditionalImagingPatients: (additional) => set({ additionalImagingPatients: additional }),
        }),
        {
            name: 'nt_patient_store',
        }
    )
);
