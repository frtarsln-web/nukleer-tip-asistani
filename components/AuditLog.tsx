import React, { useState, useMemo } from 'react';
import { StaffUser } from '../types';

interface AuditLogEntry {
    id: string;
    timestamp: Date;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    category: 'patient' | 'dose' | 'stock' | 'system' | 'waste' | 'auth';
    details: string;
    metadata?: Record<string, any>;
}

interface AuditLogProps {
    entries: AuditLogEntry[];
    onClose: () => void;
    onExport?: () => void;
}

const CATEGORY_CONFIG = {
    patient: { icon: '👤', color: 'blue', label: 'Hasta' },
    dose: { icon: '💉', color: 'emerald', label: 'Doz' },
    stock: { icon: '📦', color: 'purple', label: 'Stok' },
    system: { icon: '⚙️', color: 'slate', label: 'Sistem' },
    waste: { icon: '♻️', color: 'amber', label: 'Atık' },
    auth: { icon: '🔐', color: 'rose', label: 'Yetki' }
};

export const AuditLog: React.FC<AuditLogProps> = ({
    entries,
    onClose,
    onExport
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Filter entries
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const matchesSearch = searchTerm === '' ||
                entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.details.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;

            const matchesDate = selectedDate === '' ||
                new Date(entry.timestamp).toISOString().split('T')[0] === selectedDate;

            return matchesSearch && matchesCategory && matchesDate;
        });
    }, [entries, searchTerm, selectedCategory, selectedDate]);

    // Group by date
    const groupedEntries = useMemo(() => {
        const groups: Record<string, AuditLogEntry[]> = {};

        filteredEntries.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry);
        });

        return groups;
    }, [filteredEntries]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-3xl">📋</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">İşlem Geçmişi (Audit Log)</h2>
                            <p className="text-xs text-slate-500">Tüm sistem işlemlerinin kayıt defteri</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {onExport && (
                            <button
                                onClick={onExport}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                            >
                                <span>📤</span> Dışa Aktar
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-slate-700/50 flex flex-wrap gap-4 bg-slate-800/30">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ara... (kullanıcı, işlem, detay)"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 pl-10 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Tümü
                        </button>
                        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${selectedCategory === key ? `bg-${config.color}-600 text-white` : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <span>{config.icon}</span>
                            </button>
                        ))}
                    </div>

                    {/* Date Filter */}
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
                    {Object.keys(groupedEntries).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <span className="text-6xl mb-4 opacity-50">📋</span>
                            <p className="text-lg font-bold">Kayıt Bulunamadı</p>
                            <p className="text-sm mt-1">Filtreleri değiştirmeyi deneyin</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {(Object.entries(groupedEntries) as [string, AuditLogEntry[]][]).map(([date, dateEntries]) => (
                                <div key={date}>
                                    {/* Date Header */}
                                    <div className="sticky top-0 bg-slate-900/90 backdrop-blur-sm py-2 mb-3 z-10">
                                        <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                            {date}
                                            <span className="text-xs text-slate-500">({dateEntries.length} kayıt)</span>
                                        </h3>
                                    </div>

                                    {/* Entries */}
                                    <div className="space-y-2">
                                        {dateEntries.map((entry, idx) => {
                                            const config = CATEGORY_CONFIG[entry.category];
                                            return (
                                                <div
                                                    key={entry.id}
                                                    className={`bg-slate-800/50 border border-slate-700/30 rounded-xl p-4 hover:bg-slate-800/70 transition-all animate-slide-up`}
                                                    style={{ animationDelay: `${idx * 30}ms` }}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {/* Icon */}
                                                        <div className={`w-10 h-10 rounded-xl bg-${config.color}-500/20 flex items-center justify-center text-lg flex-shrink-0`}>
                                                            {config.icon}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-bold text-white">{entry.action}</span>
                                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold bg-${config.color}-500/20 text-${config.color}-400`}>
                                                                    {config.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mb-2">{entry.details}</p>
                                                            <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                                                <span className="flex items-center gap-1">
                                                                    <span>👤</span> {entry.userName}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <span>🏷️</span> {entry.userRole}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <span>🕐</span>
                                                                    {new Date(entry.timestamp).toLocaleTimeString('tr-TR', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        second: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50 flex justify-between items-center bg-slate-800/30">
                    <p className="text-xs text-slate-500">
                        Toplam <span className="text-white font-bold">{filteredEntries.length}</span> kayıt gösteriliyor
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLog;
