import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { DoseLogEntry, PendingPatient, DoseStatus, AdditionalImaging } from '../types';

// Storage keys
const STORAGE_KEYS = {
    PENDING_PATIENTS: 'nt_global_patients',
    PATIENTS_IN_ROOMS: 'nt_patients_in_rooms',
    PATIENTS_IN_IMAGING: 'nt_patients_in_imaging',
    ADDITIONAL_IMAGING: 'nt_additional_imaging'
};

// Helper functions
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return defaultValue;
        return JSON.parse(stored);
    } catch {
        return defaultValue;
    }
};

const saveToStorage = <T,>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Storage save error:', e);
    }
};

// Room patient info type
export interface RoomPatientInfo {
    roomId: string;
    startTime: Date;
    patientId: string;
    patientName: string;
}

// Imaging patient info type
export interface ImagingPatientInfo {
    startTime: Date;
}

// Additional imaging info type
export interface AdditionalImagingInfo {
    region: string;
    addedAt: Date;
    scheduledMinutes: number;
}

interface PatientContextType {
    // Pending patients (waiting list)
    pendingPatients: PendingPatient[];
    addPendingPatient: (patient: PendingPatient) => void;
    removePendingPatient: (id: string) => void;
    setPendingPatients: React.Dispatch<React.SetStateAction<PendingPatient[]>>;

    // Patients in injection rooms
    patientsInRooms: Record<string, RoomPatientInfo>;
    assignToRoom: (patientId: string, patientName: string, roomId: string | number) => void;
    removeFromRoom: (roomId: string | number) => void;

    // Patients in imaging
    patientsInImaging: Record<string, ImagingPatientInfo>;
    startImaging: (patientId: string) => void;
    finishImaging: (patientId: string) => void;

    // Additional imaging requests
    additionalImagingPatients: Record<string, AdditionalImagingInfo>;
    requestAdditionalImaging: (patientId: string, region: string, scheduledMinutes: number) => void;
    cancelAdditionalImaging: (patientId: string) => void;

    // Patient selection
    selectedPatient: PendingPatient | null;
    selectPatient: (patient: PendingPatient | null) => void;
}

const PatientContext = createContext<PatientContextType | null>(null);

export const usePatients = () => {
    const context = useContext(PatientContext);
    if (!context) {
        throw new Error('usePatients must be used within PatientProvider');
    }
    return context;
};

interface PatientProviderProps {
    children: ReactNode;
}

export const PatientProvider: React.FC<PatientProviderProps> = ({ children }) => {
    // Pending patients
    const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>(() =>
        loadFromStorage(STORAGE_KEYS.PENDING_PATIENTS, [])
    );

    // Patients in rooms
    const [patientsInRooms, setPatientsInRooms] = useState<Record<string, RoomPatientInfo>>(() =>
        loadFromStorage(STORAGE_KEYS.PATIENTS_IN_ROOMS, {})
    );

    // Patients in imaging
    const [patientsInImaging, setPatientsInImaging] = useState<Record<string, ImagingPatientInfo>>(() =>
        loadFromStorage(STORAGE_KEYS.PATIENTS_IN_IMAGING, {})
    );

    // Additional imaging
    const [additionalImagingPatients, setAdditionalImagingPatients] = useState<Record<string, AdditionalImagingInfo>>(() =>
        loadFromStorage(STORAGE_KEYS.ADDITIONAL_IMAGING, {})
    );

    // Selected patient for dose preparation
    const [selectedPatient, setSelectedPatient] = useState<PendingPatient | null>(null);

    // Save to storage on change
    useEffect(() => {
        saveToStorage(STORAGE_KEYS.PENDING_PATIENTS, pendingPatients);
    }, [pendingPatients]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.PATIENTS_IN_ROOMS, patientsInRooms);
    }, [patientsInRooms]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.PATIENTS_IN_IMAGING, patientsInImaging);
    }, [patientsInImaging]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.ADDITIONAL_IMAGING, additionalImagingPatients);
    }, [additionalImagingPatients]);

    // Pending patient functions
    const addPendingPatient = useCallback((patient: PendingPatient) => {
        setPendingPatients(prev => [...prev, patient]);
    }, []);

    const removePendingPatient = useCallback((id: string) => {
        setPendingPatients(prev => prev.filter(p => p.id !== id));
    }, []);

    // Room functions
    const assignToRoom = useCallback((patientId: string, patientName: string, roomId: string | number) => {
        setPatientsInRooms(prev => ({
            ...prev,
            [patientId]: {
                roomId: String(roomId),
                startTime: new Date(),
                patientId,
                patientName
            }
        }));
    }, []);

    const removeFromRoom = useCallback((roomId: string | number) => {
        setPatientsInRooms(prev => {
            const updated = { ...prev };
            const patientId = Object.keys(updated).find(
                id => updated[id].roomId === String(roomId)
            );
            if (patientId) {
                delete updated[patientId];
            }
            return updated;
        });
    }, []);

    // Imaging functions
    const startImaging = useCallback((patientId: string) => {
        // Remove from room if in room
        setPatientsInRooms(prev => {
            const updated = { ...prev };
            delete updated[patientId];
            return updated;
        });

        // Add to imaging
        setPatientsInImaging(prev => ({
            ...prev,
            [patientId]: { startTime: new Date() }
        }));
    }, []);

    const finishImaging = useCallback((patientId: string) => {
        setPatientsInImaging(prev => {
            const updated = { ...prev };
            delete updated[patientId];
            return updated;
        });
    }, []);

    // Additional imaging functions
    const requestAdditionalImaging = useCallback((patientId: string, region: string, scheduledMinutes: number) => {
        setAdditionalImagingPatients(prev => ({
            ...prev,
            [patientId]: {
                region,
                addedAt: new Date(),
                scheduledMinutes
            }
        }));
    }, []);

    const cancelAdditionalImaging = useCallback((patientId: string) => {
        setAdditionalImagingPatients(prev => {
            const updated = { ...prev };
            delete updated[patientId];
            return updated;
        });
    }, []);

    // Patient selection
    const selectPatient = useCallback((patient: PendingPatient | null) => {
        setSelectedPatient(patient);
    }, []);

    const value: PatientContextType = {
        pendingPatients,
        addPendingPatient,
        removePendingPatient,
        setPendingPatients,
        patientsInRooms,
        assignToRoom,
        removeFromRoom,
        patientsInImaging,
        startImaging,
        finishImaging,
        additionalImagingPatients,
        requestAdditionalImaging,
        cancelAdditionalImaging,
        selectedPatient,
        selectPatient
    };

    return (
        <PatientContext.Provider value={value}>
            {children}
        </PatientContext.Provider>
    );
};

export default PatientContext;
