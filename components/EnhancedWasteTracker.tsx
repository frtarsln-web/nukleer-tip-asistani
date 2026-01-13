import React, { useState, useMemo } from 'react';
import { WasteBin, WasteItem, DoseUnit } from '../types';
import { calculateDecay } from '../utils/physics';

interface EnhancedWasteTrackerProps {
    wasteBins: WasteBin[];
    unit: DoseUnit;
    now: Date;
    onClose: () => void;
}

// Waste categories with decay thresholds
const WASTE_CATEGORIES = {
    'hot': {
        label: 'Sıcak Atık',
        maxActivity: 100, // mCi above this is hot
        color: 'from-red-600 to-orange-600',
        icon: '🔴',
        description: 'Yüksek aktiviteli, özel bertaraf gerektirir'
    },
    'warm': {
        label: 'Ilık Atık',
        maxActivity: 10,
        color: 'from-amber-600 to-yellow-600',
        icon: '🟠',
        description: 'Orta aktiviteli, bekleme süresi gerektirir'
    },
    'cold': {
        label: 'Soğuk Atık',
        maxActivity: 0.1,
        color: 'from-emerald-600 to-green-600',
        icon: '🟢',
        description: 'Düşük aktiviteli, normal bertaraf edilebilir'
    },
    'cleared': {
        label: 'Bertaraf Edilebilir',
        maxActivity: 0,
        color: 'from-slate-600 to-gray-600',
        icon: '✅',
        description: 'Aktivite sınır altında, normal çöpe atılabilir'
    }
};

// Calculate disposal date (when activity drops below threshold)
const calculateDisposalDate = (
    item: WasteItem,
    halfLifeMinutes: number, // minutes
    threshold: number = 0.001 // mCi
): Date => {
    const msElapsed = new Date().getTime() - new Date(item.disposedAt).getTime();
    const hoursElapsed = msElapsed / (1000 * 60 * 60);
    const halfLifeHours = halfLifeMinutes / 60;
    const currentActivity = calculateDecay(item.activity, halfLifeHours, hoursElapsed);
    if (currentActivity <= threshold) return new Date();

    // Calculate time needed: A = A0 * e^(-λt) => t = -ln(A/A0) / λ
    const lambda = Math.log(2) / halfLifeMinutes;
    const timeMinutes = -Math.log(threshold / item.activity) / lambda;

    const disposalDate = new Date(item.disposedAt);
    disposalDate.setMinutes(disposalDate.getMinutes() + timeMinutes);

    return disposalDate;
};

// Get waste category based on current activity
const getWasteCategory = (activity: number): keyof typeof WASTE_CATEGORIES => {
    if (activity >= 100) return 'hot';
    if (activity >= 10) return 'warm';
    if (activity >= 0.1) return 'cold';
    return 'cleared';
};

export const EnhancedWasteTracker: React.FC<EnhancedWasteTrackerProps> = ({
    wasteBins,
    unit,
    now,
    onClose
}) => {
    const [selectedBin, setSelectedBin] = useState<string | null>(null);
    const [view, setView] = useState<'bins' | 'timeline' | 'report'>('bins');

    // Calculate current activities and categories for all items
    const processedBins = useMemo(() => {
        return wasteBins.map(bin => {
            const processedItems = bin.items.map(item => {
                const msElapsed = now.getTime() - new Date(item.disposedAt).getTime();
                const hoursElapsed = msElapsed / (1000 * 60 * 60);
                const halfLifeMinutes = 110; // default F-18 half-life in minutes
                const halfLifeHours = halfLifeMinutes / 60;
                const currentActivity = calculateDecay(
                    item.activity,
                    halfLifeHours,
                    hoursElapsed
                );
                const category = getWasteCategory(currentActivity);
                const disposalDate = calculateDisposalDate(item, halfLifeMinutes);

                return {
                    ...item,
                    currentActivity,
                    category,
                    disposalDate,
                    isReady: currentActivity < 0.001
                };
            });

            const totalActivity = processedItems.reduce((sum, i) => sum + i.currentActivity, 0);
            const binCategory = getWasteCategory(totalActivity);
            const readyCount = processedItems.filter(i => i.isReady).length;

            return {
                ...bin,
                items: processedItems,
                totalActivity,
                category: binCategory,
                readyCount
            };
        });
    }, [wasteBins, now]);

    // Statistics
    const stats = useMemo(() => {
        const allItems = processedBins.flatMap(b => b.items);
        return {
            totalItems: allItems.length,
            totalActivity: allItems.reduce((sum, i) => sum + i.currentActivity, 0),
            readyForDisposal: allItems.filter(i => i.isReady).length,
            hotItems: allItems.filter(i => i.category === 'hot').length,
            warmItems: allItems.filter(i => i.category === 'warm').length,
            coldItems: allItems.filter(i => i.category === 'cold').length
        };
    }, [processedBins]);

    // Items ready for disposal soon (within 24 hours)
    const upcomingDisposals = useMemo(() => {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return processedBins
            .flatMap(bin => bin.items.map(item => ({ ...item, binName: bin.name })))
            .filter(item => !item.isReady && item.disposalDate <= tomorrow)
            .sort((a, b) => a.disposalDate.getTime() - b.disposalDate.getTime());
    }, [processedBins, now]);

    const formatTime = (date: Date) => {
        const diff = date.getTime() - now.getTime();
        if (diff <= 0) return 'Şimdi';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} gün`;
        }
        if (hours > 0) return `${hours}s ${minutes}dk`;
        return `${minutes}dk`;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <span className="text-2xl">☢️</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Atık Takip Sistemi</h2>
                            <p className="text-xs text-slate-500">Radyoaktif atık yönetimi ve bertaraf takibi</p>
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

                {/* Tabs & Stats */}
                <div className="p-4 bg-slate-800/50 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                        {/* Tabs */}
                        <div className="flex gap-2">
                            {[
                                { id: 'bins', label: 'Konteynerler', icon: '🗑️' },
                                { id: 'timeline', label: 'Bertaraf Zamanı', icon: '⏰' },
                                { id: 'report', label: 'Özet', icon: '📊' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setView(tab.id as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === tab.id
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    <span>{tab.icon}</span> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-xl font-black text-white">{stats.totalItems}</p>
                                <p className="text-[9px] text-slate-500 uppercase">Toplam</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-red-400">{stats.hotItems}</p>
                                <p className="text-[9px] text-slate-500 uppercase">Sıcak</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-amber-400">{stats.warmItems}</p>
                                <p className="text-[9px] text-slate-500 uppercase">Ilık</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-emerald-400">{stats.readyForDisposal}</p>
                                <p className="text-[9px] text-slate-500 uppercase">Hazır</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {/* Bins View */}
                    {view === 'bins' && (
                        <div className="grid grid-cols-3 gap-4">
                            {processedBins.map(bin => {
                                const catInfo = WASTE_CATEGORIES[bin.category];
                                return (
                                    <div
                                        key={bin.id}
                                        onClick={() => setSelectedBin(bin.id === selectedBin ? null : bin.id)}
                                        className={`bg-gradient-to-br ${catInfo.color} bg-opacity-20 border border-slate-700/50 rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all ${selectedBin === bin.id ? 'ring-2 ring-orange-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-base font-bold text-white">{bin.name}</h3>
                                            <span className="text-2xl">{catInfo.icon}</span>
                                        </div>
                                        <p className="text-2xl font-black text-white">
                                            {bin.totalActivity.toFixed(2)} <span className="text-sm">{unit}</span>
                                        </p>
                                        <p className="text-xs text-white/60 mt-1">
                                            {bin.items.length} öğe • {bin.readyCount} bertaraf edilebilir
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Timeline View */}
                    {view === 'timeline' && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-400 mb-3">Yaklaşan Bertaraf Zamanları (24 saat)</h3>
                            {upcomingDisposals.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <span className="text-4xl">✅</span>
                                    <p className="mt-2">24 saat içinde bertaraf edilecek öğe yok</p>
                                </div>
                            ) : (
                                upcomingDisposals.map(item => (
                                    <div key={item.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{WASTE_CATEGORIES[item.category].icon}</span>
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.label}</p>
                                                <p className="text-xs text-slate-500">{item.binName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-orange-400">{formatTime(item.disposalDate)}</p>
                                            <p className="text-xs text-slate-500">{item.currentActivity.toFixed(3)} {unit}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Report View */}
                    {view === 'report' && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Category Breakdown */}
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                <h3 className="text-base font-bold text-white mb-4">Kategori Dağılımı</h3>
                                <div className="space-y-3">
                                    {Object.entries(WASTE_CATEGORIES).map(([key, cat]) => {
                                        const count = processedBins.flatMap(b => b.items).filter(i => i.category === key).length;
                                        const percentage = stats.totalItems > 0 ? (count / stats.totalItems) * 100 : 0;

                                        return (
                                            <div key={key}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-300">{cat.icon} {cat.label}</span>
                                                    <span className="text-slate-500">{count} ({percentage.toFixed(0)}%)</span>
                                                </div>
                                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${cat.color} rounded-full`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-500/20 rounded-xl p-5">
                                <h3 className="text-base font-bold text-white mb-4">📋 Özet Rapor</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Toplam Aktivite:</span>
                                        <span className="text-white font-bold">{stats.totalActivity.toFixed(2)} {unit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Toplam Öğe:</span>
                                        <span className="text-white font-bold">{stats.totalItems}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Bertaraf Edilebilir:</span>
                                        <span className="text-emerald-400 font-bold">{stats.readyForDisposal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Konteyner Sayısı:</span>
                                        <span className="text-white font-bold">{processedBins.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnhancedWasteTracker;
