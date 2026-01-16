import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Vial, IsotopeGenerator, WasteBin, Isotope, DoseUnit } from '../types';
import { ISOTOPES } from '../constants';

interface InventoryState {
    // Current selected isotope
    selectedIsotope: Isotope;

    // Unit preference
    unit: DoseUnit;

    // Vials for current isotope
    vials: Vial[];

    // Generator (for Tc-99m)
    generator: IsotopeGenerator | null;

    // Waste bins
    wasteBins: WasteBin[];

    // Actions
    setSelectedIsotope: (isotope: Isotope) => void;
    setUnit: (unit: DoseUnit) => void;

    addVial: (vial: Vial) => void;
    updateVial: (vialId: string, updates: Partial<Vial>) => void;
    removeVial: (vialId: string) => void;
    setVials: (vials: Vial[]) => void;

    setGenerator: (generator: IsotopeGenerator | null) => void;
    updateGenerator: (updates: Partial<IsotopeGenerator>) => void;

    addWasteBin: (bin: WasteBin) => void;
    updateWasteBin: (binId: string, updates: Partial<WasteBin>) => void;
    removeWasteBin: (binId: string) => void;
    setWasteBins: (bins: WasteBin[]) => void;
}

export const useInventoryStore = create<InventoryState>()(
    persist(
        (set) => ({
            selectedIsotope: ISOTOPES[0],
            unit: DoseUnit.MCI,
            vials: [],
            generator: null,
            wasteBins: [],

            setSelectedIsotope: (isotope) => set({ selectedIsotope: isotope }),

            setUnit: (unit) => set({ unit }),

            addVial: (vial) =>
                set((state) => ({ vials: [...state.vials, vial] })),

            updateVial: (vialId, updates) =>
                set((state) => ({
                    vials: state.vials.map((v) =>
                        v.id === vialId ? { ...v, ...updates } : v
                    ),
                })),

            removeVial: (vialId) =>
                set((state) => ({
                    vials: state.vials.filter((v) => v.id !== vialId),
                })),

            setVials: (vials) => set({ vials }),

            setGenerator: (generator) => set({ generator }),

            updateGenerator: (updates) =>
                set((state) => ({
                    generator: state.generator ? { ...state.generator, ...updates } : null,
                })),

            addWasteBin: (bin) =>
                set((state) => ({ wasteBins: [...state.wasteBins, bin] })),

            updateWasteBin: (binId, updates) =>
                set((state) => ({
                    wasteBins: state.wasteBins.map((b) =>
                        b.id === binId ? { ...b, ...updates } : b
                    ),
                })),

            removeWasteBin: (binId) =>
                set((state) => ({
                    wasteBins: state.wasteBins.filter((b) => b.id !== binId),
                })),

            setWasteBins: (bins) => set({ wasteBins: bins }),
        }),
        {
            name: 'nt_inventory_store',
        }
    )
);
