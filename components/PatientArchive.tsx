import React, { useState, useMemo } from 'react';
import { DoseLogEntry, DoseUnit } from '../types';

interface PatientArchiveProps {
    onClose: () => void;
    history: DoseLogEntry[];
    unit: DoseUnit;
}

interface PatientRecord {
    name: string;
    visits: DoseLogEntry[];
    totalDose: number;
    lastVisit: Date;
}

const translations = {
    tr: {
        title: 'Hasta Arşivi',
        subtitle: 'Geçmiş hasta kayıtları',
        searchPlaceholder: 'Hasta ara (isim veya protokol no)...',
        filterByProcedure: 'Prosedüre göre filtrele',
        allProcedures: 'Tüm Prosedürler',
        sortBy: 'Sırala',
        sortLastVisit: 'Son Ziyarete Göre',
        sortTotalDose: 'Toplam Doza Göre',
        sortVisitCount: 'Ziyaret Sayısına Göre',
        exportCsv: 'CSV İndir',
        noPatients: 'Kayıtlı hasta bulunamadı',
        patients: 'hasta',
        totalPatients: 'Toplam',
        visits: 'ziyaret',
        totalDose: 'toplam',
        lastVisit: 'Son ziyaret',
        viewHistory: 'Geçmişi Görüntüle',
        patientHistory: 'Hasta Geçmişi',
        procedure: 'Prosedür',
        dose: 'Doz',
        status: 'Durum',
        date: 'Tarih',
        completed: 'Tamamlandı',
        pending: 'Beklemede',
        cancelled: 'İptal',
        back: 'Geri',
        from: 'Başlangıç',
        to: 'Bitiş',
    },
    en: {
        title: 'Patient Archive',
        subtitle: 'Past patient records',
        searchPlaceholder: 'Search patient (name or protocol no)...',
        filterByProcedure: 'Filter by procedure',
        allProcedures: 'All Procedures',
        sortBy: 'Sort by',
        sortLastVisit: 'By Last Visit',
        sortTotalDose: 'By Total Dose',
        sortVisitCount: 'By Visit Count',
        exportCsv: 'Export CSV',
        noPatients: 'No patients found',
        patients: 'patients',
        totalPatients: 'Total',
        visits: 'visits',
        totalDose: 'total',
        lastVisit: 'Last visit',
        viewHistory: 'View History',
        patientHistory: 'Patient History',
        procedure: 'Procedure',
        dose: 'Dose',
        status: 'Status',
        date: 'Date',
        completed: 'Completed',
        pending: 'Pending',
        cancelled: 'Cancelled',
        back: 'Back',
        from: 'From',
        to: 'To',
    },
};

export const PatientArchive: React.FC<PatientArchiveProps> = ({
    onClose,
    history,
    unit,
}) => {
    const lang = useMemo(() => {
        try {
            const settings = localStorage.getItem('nt_app_settings');
            if (settings) return JSON.parse(settings).language || 'tr';
        } catch { }
        return 'tr';
    }, []);

    const t = translations[lang as 'tr' | 'en'];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProcedure, setSelectedProcedure] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'lastVisit' | 'totalDose' | 'visitCount'>('lastVisit');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

    const procedures = useMemo(() => {
        const procs = new Set<string>();
        history.forEach(h => {
            if (h.procedure) procs.add(h.procedure);
        });
        return Array.from(procs).sort();
    }, [history]);

    const patientRecords = useMemo(() => {
        const records: Record<string, PatientRecord> = {};

        history.forEach(h => {
            const key = h.patientName.toLowerCase().trim();
            if (!records[key]) {
                records[key] = {
                    name: h.patientName,
                    visits: [],
                    totalDose: 0,
                    lastVisit: new Date(h.timestamp),
                };
            }
            records[key].visits.push(h);
            records[key].totalDose += h.amount;
            const visitDate = new Date(h.timestamp);
            if (visitDate > records[key].lastVisit) {
                records[key].lastVisit = visitDate;
            }
        });

        return Object.values(records);
    }, [history]);

    const filteredRecords = useMemo(() => {
        let result = [...patientRecords];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.name.toLowerCase().includes(query) ||
                r.visits.some(v => v.protocolNo?.toLowerCase().includes(query))
            );
        }

        // Procedure filter
        if (selectedProcedure !== 'all') {
            result = result.filter(r =>
                r.visits.some(v => v.procedure === selectedProcedure)
            );
        }

        // Date filter
        if (dateFrom) {
            const from = new Date(dateFrom);
            result = result.filter(r => r.lastVisit >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59);
            result = result.filter(r => r.lastVisit <= to);
        }

        // Sort
        switch (sortBy) {
            case 'lastVisit':
                result.sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());
                break;
            case 'totalDose':
                result.sort((a, b) => b.totalDose - a.totalDose);
                break;
            case 'visitCount':
                result.sort((a, b) => b.visits.length - a.visits.length);
                break;
        }

        return result;
    }, [patientRecords, searchQuery, selectedProcedure, sortBy, dateFrom, dateTo]);

    const exportToCSV = () => {
        const headers = ['Patient Name', 'Total Visits', 'Total Dose', 'Last Visit'];
        const rows = filteredRecords.map(r => [
            r.name,
            r.visits.length.toString(),
            r.totalDose.toFixed(2),
            r.lastVisit.toISOString().split('T')[0],
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient_archive_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return t.completed;
            case 'pending': return t.pending;
            case 'cancelled': return t.cancelled;
            default: return status;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🗄️</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t.title}</h2>
                            <p className="text-indigo-200 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {selectedPatient ? (
                    /* Patient Detail View */
                    <div className="p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
                        <button
                            onClick={() => setSelectedPatient(null)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            {t.back}
                        </button>

                        <div className="bg-slate-700/30 rounded-xl p-6 mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2">{selectedPatient.name}</h3>
                            <div className="flex gap-6 text-sm">
                                <span className="text-slate-400">{selectedPatient.visits.length} {t.visits}</span>
                                <span className="text-slate-400">{selectedPatient.totalDose.toFixed(2)} {unit} {t.totalDose}</span>
                                <span className="text-slate-400">{t.lastVisit}: {selectedPatient.lastVisit.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}</span>
                            </div>
                        </div>

                        <h4 className="text-lg font-semibold text-white mb-4">{t.patientHistory}</h4>
                        <div className="space-y-3">
                            {selectedPatient.visits.map((v, i) => (
                                <div key={i} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-white font-medium">{v.procedure || '-'}</p>
                                            <p className="text-slate-400 text-sm">{v.protocolNo || '-'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-bold">{v.amount.toFixed(2)} {unit}</p>
                                            <p className="text-slate-400 text-sm">
                                                {new Date(v.timestamp).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        <span className={`text-xs px-2 py-1 rounded ${v.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                v.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-red-500/20 text-red-400'
                                            }`}>
                                            {getStatusLabel(v.status)}
                                        </span>
                                        {v.preparedBy && (
                                            <span className="text-xs px-2 py-1 rounded bg-slate-600 text-slate-300">
                                                {v.preparedBy.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Patient List View */
                    <div className="p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="md:col-span-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={t.searchPlaceholder}
                                    className="w-full px-4 py-2 bg-slate-700 rounded-lg text-white placeholder-slate-400 border border-slate-600 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <select
                                value={selectedProcedure}
                                onChange={e => setSelectedProcedure(e.target.value)}
                                className="px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-indigo-500 outline-none"
                            >
                                <option value="all">{t.allProcedures}</option>
                                {procedures.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                                className="px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-indigo-500 outline-none"
                            >
                                <option value="lastVisit">{t.sortLastVisit}</option>
                                <option value="totalDose">{t.sortTotalDose}</option>
                                <option value="visitCount">{t.sortVisitCount}</option>
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="flex gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-sm">{t.from}:</span>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="px-3 py-1 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-indigo-500 outline-none text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-sm">{t.to}:</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="px-3 py-1 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-indigo-500 outline-none text-sm"
                                />
                            </div>
                            <button
                                onClick={exportToCSV}
                                className="ml-auto px-4 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                📥 {t.exportCsv}
                            </button>
                        </div>

                        {/* Results */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-slate-400 text-sm">
                                {t.totalPatients}: <span className="text-white font-bold">{filteredRecords.length}</span> {t.patients}
                            </p>
                        </div>

                        {filteredRecords.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <span className="text-4xl mb-4 block">📋</span>
                                <p>{t.noPatients}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredRecords.map((record, i) => (
                                    <div
                                        key={i}
                                        className="bg-slate-700/30 rounded-xl p-4 border border-slate-600 hover:border-indigo-500/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-white font-semibold">{record.name}</h4>
                                                <p className="text-slate-400 text-sm">
                                                    {record.visits.length} {t.visits} • {record.totalDose.toFixed(2)} {unit} {t.totalDose}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-slate-400 text-xs">{t.lastVisit}</p>
                                                    <p className="text-white text-sm">
                                                        {record.lastVisit.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedPatient(record)}
                                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm transition-colors"
                                                >
                                                    {t.viewHistory}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
