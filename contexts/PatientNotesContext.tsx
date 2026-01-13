import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface PatientNote {
    id: string;
    patientId: string;
    patientName: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

interface PatientNotesContextType {
    notes: Record<string, PatientNote>;
    addNote: (patientId: string, patientName: string, text: string) => void;
    updateNote: (patientId: string, text: string) => void;
    deleteNote: (patientId: string) => void;
    getNote: (patientId: string) => PatientNote | undefined;
    hasNote: (patientId: string) => boolean;
}

const PatientNotesContext = createContext<PatientNotesContextType | undefined>(undefined);

const STORAGE_KEY = 'nt_patient_notes';

export function PatientNotesProvider({ children }: { children: ReactNode }) {
    const [notes, setNotes] = useState<Record<string, PatientNote>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }, [notes]);

    const addNote = useCallback((patientId: string, patientName: string, text: string) => {
        const now = new Date();
        setNotes(prev => ({
            ...prev,
            [patientId]: {
                id: patientId,
                patientId,
                patientName,
                text,
                createdAt: now,
                updatedAt: now
            }
        }));
    }, []);

    const updateNote = useCallback((patientId: string, text: string) => {
        setNotes(prev => {
            if (!prev[patientId]) return prev;
            return {
                ...prev,
                [patientId]: {
                    ...prev[patientId],
                    text,
                    updatedAt: new Date()
                }
            };
        });
    }, []);

    const deleteNote = useCallback((patientId: string) => {
        setNotes(prev => {
            const newNotes = { ...prev };
            delete newNotes[patientId];
            return newNotes;
        });
    }, []);

    const getNote = useCallback((patientId: string) => {
        return notes[patientId];
    }, [notes]);

    const hasNote = useCallback((patientId: string) => {
        return !!notes[patientId] && notes[patientId].text.trim().length > 0;
    }, [notes]);

    return (
        <PatientNotesContext.Provider value={{ notes, addNote, updateNote, deleteNote, getNote, hasNote }}>
            {children}
        </PatientNotesContext.Provider>
    );
}

export function usePatientNotes() {
    const context = useContext(PatientNotesContext);
    if (!context) {
        throw new Error('usePatientNotes must be used within PatientNotesProvider');
    }
    return context;
}
