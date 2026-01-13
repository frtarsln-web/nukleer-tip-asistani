import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { Isotope, Vial, IsotopeGenerator, DoseUnit, DoseLogEntry, DoseStatus, WasteBin, WasteItem } from '../types';
import { ISOTOPES } from '../constants';

// Dynamic storage keys based on isotope
const getDynamicKeys = (isoId: string) => ({
    VIALS: `nt_${isoId}_vials`,
    HISTORY: `nt_${isoId}_history`,
    GENERATORS: `nt_${isoId}_generators`,
    WASTE_BINS: `nt_${isoId}_wasteBins`
});

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

// Calculate current activity based on decay
export const calculateDecay = (initialActivity: number, halfLifeHours: number, elapsedMs: number): number => {
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    return initialActivity * Math.pow(0.5, elapsedHours / halfLifeHours);
};

// Get vial current activity
export const getVialCurrentActivity = (vial: Vial, halfLifeHours: number, now: Date): number => {
    const elapsedMs = now.getTime() - new Date(vial.receivedAt).getTime();
    return calculateDecay(vial.initialAmount, halfLifeHours, elapsedMs);
};

interface IsotopeContextType {
    // Selected isotope
    selectedIsotope: Isotope;
    setSelectedIsotope: (isotope: Isotope) => void;
    isWorkspaceActive: boolean;
    enterWorkspace: (isotope: Isotope) => void;
    exitWorkspace: () => void;

    // Vials
    vials: Vial[];
    addVial: (vial: Vial) => void;
    removeVial: (id: string) => void;
    updateVial: (id: string, updates: Partial<Vial>) => void;

    // Current activity calculations
    currentTotalActivity: number;
    currentTotalVolume: number;

    // Generators (for Tc-99m)
    generators: IsotopeGenerator[];
    addGenerator: (activity: number, efficiency: number) => void;
    performElution: (amount: number, volume: number) => void;

    // Dose history
    history: DoseLogEntry[];
    addHistoryEntry: (entry: DoseLogEntry) => void;
    updateHistoryEntry: (id: string, updates: Partial<DoseLogEntry>) => void;

    // Waste management
    wasteBins: WasteBin[];
    addWasteBin: (name: string, type: 'sharp' | 'solid' | 'liquid') => void;
    disposeItem: (binId: string, item: Omit<WasteItem, 'id' | 'disposedAt'>) => void;
    emptyBin: (binId: string) => void;

    // All PET vials (for doctor dashboard)
    allPETVials: (Vial & { currentActivity: number; calibrationTime: Date; isotopeId: string })[];
}

const IsotopeContext = createContext<IsotopeContextType | null>(null);

export const useIsotope = () => {
    const context = useContext(IsotopeContext);
    if (!context) {
        throw new Error('useIsotope must be used within IsotopeProvider');
    }
    return context;
};

interface IsotopeProviderProps {
    children: ReactNode;
    now: Date;
}

export const IsotopeProvider: React.FC<IsotopeProviderProps> = ({ children, now }) => {
    // Selected isotope
    const [selectedIsotope, setSelectedIsotopeState] = useState<Isotope>(() => {
        const savedId = localStorage.getItem('nt_selected_isotope');
        return ISOTOPES.find(i => i.id === savedId) || ISOTOPES[0];
    });

    const [isWorkspaceActive, setIsWorkspaceActive] = useState(false);

    // Get storage keys for current isotope
    const storageKeys = getDynamicKeys(selectedIsotope.id);

    // Vials
    const [vials, setVials] = useState<Vial[]>(() =>
        loadFromStorage(storageKeys.VIALS, [])
    );

    // Generators
    const [generators, setGenerators] = useState<IsotopeGenerator[]>(() =>
        loadFromStorage(storageKeys.GENERATORS, [])
    );

    // History
    const [history, setHistory] = useState<DoseLogEntry[]>(() =>
        loadFromStorage(storageKeys.HISTORY, [])
    );

    // Waste bins
    const [wasteBins, setWasteBins] = useState<WasteBin[]>(() =>
        loadFromStorage(storageKeys.WASTE_BINS, [
            { id: 'hot-room', name: 'Sıcak Oda', type: 'sharp' as const, items: [], isSealed: false },
            { id: 'solid-waste', name: 'Katı Atık', type: 'solid' as const, items: [], isSealed: false },
        ])
    );

    // Save to storage on change
    useEffect(() => {
        saveToStorage(storageKeys.VIALS, vials);
    }, [vials, storageKeys.VIALS]);

    useEffect(() => {
        saveToStorage(storageKeys.GENERATORS, generators);
    }, [generators, storageKeys.GENERATORS]);

    useEffect(() => {
        saveToStorage(storageKeys.HISTORY, history);
    }, [history, storageKeys.HISTORY]);

    useEffect(() => {
        saveToStorage(storageKeys.WASTE_BINS, wasteBins);
    }, [wasteBins, storageKeys.WASTE_BINS]);

    // Load data when isotope changes
    useEffect(() => {
        const keys = getDynamicKeys(selectedIsotope.id);
        setVials(loadFromStorage(keys.VIALS, []));
        setGenerators(loadFromStorage(keys.GENERATORS, []));
        setHistory(loadFromStorage(keys.HISTORY, []));
        setWasteBins(loadFromStorage(keys.WASTE_BINS, [
            { id: 'hot-room', name: 'Sıcak Oda', type: 'sharp' as const, items: [], isSealed: false },
            { id: 'solid-waste', name: 'Katı Atık', type: 'solid' as const, items: [], isSealed: false },
        ]));
    }, [selectedIsotope.id]);

    // Calculated values
    const currentTotalActivity = useMemo(() => {
        return vials.reduce((sum, vial) => {
            const activity = getVialCurrentActivity(vial, selectedIsotope.halfLifeHours, now);
            return sum + (isNaN(activity) || !isFinite(activity) ? 0 : Math.max(0, activity));
        }, 0);
    }, [vials, selectedIsotope.halfLifeHours, now]);

    const currentTotalVolume = useMemo(() => {
        return vials.reduce((sum, vial) => sum + (vial.initialVolumeMl || 0), 0);
    }, [vials]);

    // All PET vials for doctor dashboard
    const allPETVials = useMemo(() => {
        const PET_ISOTOPE_IDS = ['f18', 'ga68'];
        const allVials: (Vial & { currentActivity: number; calibrationTime: Date; isotopeId: string })[] = [];

        PET_ISOTOPE_IDS.forEach(isoId => {
            let sourceVials: Vial[] = [];
            const isotope = ISOTOPES.find(i => i.id === isoId);

            if (isoId === selectedIsotope.id) {
                sourceVials = vials;
            } else {
                const keys = getDynamicKeys(isoId);
                sourceVials = loadFromStorage(keys.VIALS, []);
            }

            sourceVials.forEach(vial => {
                let activity = getVialCurrentActivity(vial, isotope?.halfLifeHours || 1.83, now);
                if (isNaN(activity) || !isFinite(activity)) activity = 0;
                if (activity < 0) activity = 0;

                allVials.push({
                    ...vial,
                    isotopeId: isoId,
                    currentActivity: activity,
                    calibrationTime: new Date(vial.receivedAt)
                });
            });
        });

        return allVials;
    }, [now, vials, selectedIsotope.id]);

    // Isotope functions
    const setSelectedIsotope = useCallback((isotope: Isotope) => {
        setSelectedIsotopeState(isotope);
        localStorage.setItem('nt_selected_isotope', isotope.id);
    }, []);

    const enterWorkspace = useCallback((isotope: Isotope) => {
        setSelectedIsotope(isotope);
        setIsWorkspaceActive(true);
    }, [setSelectedIsotope]);

    const exitWorkspace = useCallback(() => {
        setIsWorkspaceActive(false);
    }, []);

    // Vial functions
    const addVial = useCallback((vial: Vial) => {
        setVials(prev => [...prev, vial]);
    }, []);

    const removeVial = useCallback((id: string) => {
        setVials(prev => prev.filter(v => v.id !== id));
    }, []);

    const updateVial = useCallback((id: string, updates: Partial<Vial>) => {
        setVials(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    }, []);

    // Generator functions
    const addGenerator = useCallback((activity: number, efficiency: number) => {
        const newGenerator: IsotopeGenerator = {
            id: `gen_${Date.now()}`,
            initialActivity: activity,
            receivedAt: new Date(),
            efficiency,
            lastElutionAt: undefined
        };
        setGenerators(prev => [...prev, newGenerator]);
    }, []);

    const performElution = useCallback((amount: number, volume: number) => {
        // Add eluted vial
        const newVial: Vial = {
            id: `vial_${Date.now()}`,
            initialAmount: amount,
            initialVolumeMl: volume,
            receivedAt: new Date(),
            label: `Sağım - ${new Date().toLocaleTimeString('tr-TR')}`,
            isotopeId: selectedIsotope.id
        };
        setVials(prev => [...prev, newVial]);

        // Update generator last elution time
        setGenerators(prev => prev.map(g => ({
            ...g,
            lastElutionAt: new Date()
        })));
    }, [selectedIsotope.id]);

    // History functions
    const addHistoryEntry = useCallback((entry: DoseLogEntry) => {
        setHistory(prev => [entry, ...prev]);
    }, []);

    const updateHistoryEntry = useCallback((id: string, updates: Partial<DoseLogEntry>) => {
        setHistory(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    }, []);

    // Waste functions
    const addWasteBin = useCallback((name: string, type: 'sharp' | 'solid' | 'liquid') => {
        const newBin: WasteBin = {
            id: `bin_${Date.now()}`,
            name,
            type,
            items: [],
            isSealed: false
        };
        setWasteBins(prev => [...prev, newBin]);
    }, []);

    const disposeItem = useCallback((binId: string, item: Omit<WasteItem, 'id' | 'disposedAt'>) => {
        const fullItem: WasteItem = {
            ...item,
            id: `waste_${Date.now()}`,
            disposedAt: new Date()
        };
        setWasteBins(prev => prev.map(bin =>
            bin.id === binId ? { ...bin, items: [...bin.items, fullItem] } : bin
        ));
    }, []);

    const emptyBin = useCallback((binId: string) => {
        setWasteBins(prev => prev.map(bin =>
            bin.id === binId ? { ...bin, items: [], isSealed: false } : bin
        ));
    }, []);

    const value: IsotopeContextType = {
        selectedIsotope,
        setSelectedIsotope,
        isWorkspaceActive,
        enterWorkspace,
        exitWorkspace,
        vials,
        addVial,
        removeVial,
        updateVial,
        currentTotalActivity,
        currentTotalVolume,
        generators,
        addGenerator,
        performElution,
        history,
        addHistoryEntry,
        updateHistoryEntry,
        wasteBins,
        addWasteBin,
        disposeItem,
        emptyBin,
        allPETVials
    };

    return (
        <IsotopeContext.Provider value={value}>
            {children}
        </IsotopeContext.Provider>
    );
};

export default IsotopeContext;
