import React, { useState } from 'react';
import { DoseLogEntry, Isotope, DoseUnit, PendingPatient } from '../types';
import { useDebounce } from '../hooks';

interface AdvancedFiltersProps {
    history: DoseLogEntry[];
    pendingPatients: PendingPatient[];
    onFilterChange: (filtered: DoseLogEntry[]) => void;
    onPendingFilterChange: (filtered: PendingPatient[]) => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    history,
    pendingPatients,
    onFilterChange,
    onPendingFilterChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProcedure, setSelectedProcedure] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 300);

    React.useEffect(() => {
        let filtered = [...history];

        // Search term filter (name or protocol)
        if (debouncedSearch) {
            const term = debouncedSearch.toLowerCase();
            filtered = filtered.filter(h =>
                h.patientName.toLowerCase().includes(term) ||
                h.protocolNo?.toLowerCase().includes(term)
            );
        }

        // Procedure filter
        if (selectedProcedure !== 'all') {
            filtered = filtered.filter(h => h.procedure === selectedProcedure);
        }

        // Date range filter
        if (dateFrom) {
            const fromDate = new Date(dateFrom).getTime();
            filtered = filtered.filter(h => new Date(h.timestamp).getTime() >= fromDate);
        }
        if (dateTo) {
            const toDate = new Date(dateTo).getTime() + 86400000; // Add 1 day
            filtered = filtered.filter(h => new Date(h.timestamp).getTime() < toDate);
        }

        onFilterChange(filtered);

        // Also filter pending patients
        let filteredPending = [...pendingPatients];
        if (debouncedSearch) {
            const term = debouncedSearch.toLowerCase();
            filteredPending = filteredPending.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.protocolNo?.toLowerCase().includes(term)
            );
        }
        onPendingFilterChange(filteredPending);
    }, [debouncedSearch, selectedProcedure, dateFrom, dateTo, history, pendingPatients, onFilterChange, onPendingFilterChange]);

    const procedures = React.useMemo(() => {
        const unique = new Set(history.map(h => h.procedure));
        return Array.from(unique);
    }, [history]);

    const handleReset = () => {
        setSearchTerm('');
        setSelectedProcedure('all');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = searchTerm || selectedProcedure !== 'all' || dateFrom || dateTo;

    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                    🔍 Gelişmiş Filtreleme
                    {hasActiveFilters && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-[8px]">
                            Aktif
                        </span>
                    )}
                </h3>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-[8px] font-black text-purple-400 hover:text-purple-300 uppercase"
                >
                    {showFilters ? 'Gizle' : 'Göster'}
                </button>
            </div>

            {showFilters && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    {/* Search */}
                    <div className="space-y-1">
                        <label className="text-[7px] font-black text-slate-500 uppercase ml-1">Hasta Ara (İsim / Protokol)</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Ara..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-purple-500/30"
                        />
                    </div>

                    {/* Procedure Filter */}
                    <div className="space-y-1">
                        <label className="text-[7px] font-black text-slate-500 uppercase ml-1">Prosedür</label>
                        <select
                            value={selectedProcedure}
                            onChange={(e) => setSelectedProcedure(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                        >
                            <option value="all">Tümü</option>
                            {procedures.map(proc => (
                                <option key={proc} value={proc}>{proc}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[7px] font-black text-slate-500 uppercase ml-1">Başlangıç</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[7px] font-black text-slate-500 uppercase ml-1">Bitiş</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={handleReset}
                            className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 py-2 rounded-xl text-[9px] font-black uppercase transition-all"
                        >
                            Filtreleri Temizle
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
