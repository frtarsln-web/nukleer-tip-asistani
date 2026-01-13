import React, { useMemo, useState } from 'react';
import { DoseLogEntry, DoseUnit } from '../types';

interface ReportDashboardProps {
    history: DoseLogEntry[];
    unit: DoseUnit;
    now: Date;
    onClose: () => void;
}

interface HourlyData {
    hour: number;
    count: number;
}

interface DailyData {
    date: string;
    count: number;
    totalDose: number;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({
    history,
    unit,
    now,
    onClose
}) => {
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

    // Filter history based on time range
    const filteredHistory = useMemo(() => {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        let startDate: Date;
        switch (timeRange) {
            case 'today':
                startDate = startOfToday;
                break;
            case 'week':
                startDate = new Date(startOfToday);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(startOfToday);
                startDate.setMonth(startDate.getMonth() - 1);
                break;
        }

        return history.filter(h => new Date(h.timestamp) >= startDate);
    }, [history, timeRange, now]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (filteredHistory.length === 0) {
            return {
                totalPatients: 0,
                avgWaitTime: 0,
                totalDose: 0,
                peakHour: null as number | null
            };
        }

        const totalDose = filteredHistory.reduce((sum, h) => sum + h.amount, 0);

        // Mock wait times (in real app, this would come from actual data)
        const avgWaitTime = Math.round(45 + Math.random() * 30);

        // Calculate hourly distribution
        const hourCounts: Record<number, number> = {};
        filteredHistory.forEach(h => {
            const hour = new Date(h.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const peakHour = Object.entries(hourCounts).reduce(
            (max, [hour, count]) => (count > (max.count || 0) ? { hour: parseInt(hour), count } : max),
            { hour: 0, count: 0 }
        ).hour;

        return {
            totalPatients: filteredHistory.length,
            avgWaitTime,
            totalDose,
            peakHour
        };
    }, [filteredHistory]);

    // Get hourly distribution for chart
    const hourlyData: HourlyData[] = useMemo(() => {
        const counts: Record<number, number> = {};
        for (let i = 7; i <= 17; i++) counts[i] = 0;

        filteredHistory.forEach(h => {
            const hour = new Date(h.timestamp).getHours();
            if (hour >= 7 && hour <= 17) {
                counts[hour] = (counts[hour] || 0) + 1;
            }
        });

        return Object.entries(counts).map(([hour, count]) => ({
            hour: parseInt(hour),
            count
        }));
    }, [filteredHistory]);

    const maxCount = Math.max(...hourlyData.map(d => d.count), 1);

    // Get daily trend for week/month view
    const dailyData: DailyData[] = useMemo(() => {
        if (timeRange === 'today') return [];

        const days: Record<string, { count: number; totalDose: number }> = {};

        filteredHistory.forEach(h => {
            const date = new Date(h.timestamp).toLocaleDateString('tr-TR');
            if (!days[date]) days[date] = { count: 0, totalDose: 0 };
            days[date].count++;
            days[date].totalDose += h.amount;
        });

        return Object.entries(days)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredHistory, timeRange]);

    // Isotope breakdown
    const isotopeBreakdown = useMemo(() => {
        const breakdown: Record<string, { count: number; dose: number }> = {};

        filteredHistory.forEach(h => {
            const iso = h.isotopeId || 'unknown';
            if (!breakdown[iso]) breakdown[iso] = { count: 0, dose: 0 };
            breakdown[iso].count++;
            breakdown[iso].dose += h.amount;
        });

        return Object.entries(breakdown).map(([id, data]) => ({
            id,
            name: getIsotopeName(id),
            color: getIsotopeColor(id),
            ...data
        }));
    }, [filteredHistory]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-3xl border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 px-6 py-4 bg-slate-900/95 backdrop-blur border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            📊 Raporlar ve İstatistikler
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Detaylı performans analizi</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Time Range Selector */}
                <div className="px-6 py-4 flex gap-2">
                    {(['today', 'week', 'month'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${timeRange === range
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            {range === 'today' ? 'Bugün' : range === 'week' ? 'Bu Hafta' : 'Bu Ay'}
                        </button>
                    ))}
                </div>

                {/* Stats Cards */}
                <div className="px-6 grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-4">
                        <div className="text-3xl font-black text-blue-400">{stats.totalPatients}</div>
                        <div className="text-xs text-blue-300/70 font-bold uppercase mt-1">Toplam Hasta</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-4">
                        <div className="text-3xl font-black text-emerald-400">{stats.avgWaitTime} dk</div>
                        <div className="text-xs text-emerald-300/70 font-bold uppercase mt-1">Ort. Bekleme</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-4">
                        <div className="text-3xl font-black text-purple-400">{stats.totalDose.toFixed(1)}</div>
                        <div className="text-xs text-purple-300/70 font-bold uppercase mt-1">Toplam {unit}</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-2xl p-4">
                        <div className="text-3xl font-black text-orange-400">
                            {stats.peakHour !== null ? `${stats.peakHour}:00` : '-'}
                        </div>
                        <div className="text-xs text-orange-300/70 font-bold uppercase mt-1">En Yoğun Saat</div>
                    </div>
                </div>

                {/* Hourly Chart */}
                <div className="px-6 py-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">
                        Saatlik Dağılım
                    </h3>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-end justify-between gap-1 h-32">
                            {hourlyData.map(({ hour, count }) => (
                                <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-blue-500/70 rounded-t transition-all hover:bg-blue-400"
                                        style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? 8 : 0 }}
                                    />
                                    <span className="text-[8px] text-slate-500 font-bold">{hour}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Isotope Breakdown */}
                {isotopeBreakdown.length > 0 && (
                    <div className="px-6 pb-6">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">
                            İzotop Kullanımı
                        </h3>
                        <div className="space-y-2">
                            {isotopeBreakdown.map(iso => {
                                const percentage = (iso.count / stats.totalPatients) * 100;
                                return (
                                    <div key={iso.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-white">{iso.name}</span>
                                            <span className="text-xs text-slate-400">
                                                {iso.count} hasta · {iso.dose.toFixed(1)} {unit}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${iso.color} transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Daily Trend (for week/month) */}
                {dailyData.length > 0 && (
                    <div className="px-6 pb-6">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">
                            Günlük Trend
                        </h3>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
                            {dailyData.slice(-7).map(day => (
                                <div key={day.date} className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 w-20">{day.date}</span>
                                    <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                            style={{ width: `${Math.min((day.count / 20) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-400 font-bold w-16 text-right">
                                        {day.count} hasta
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 text-center">
                    <p className="text-[10px] text-slate-600 font-bold">
                        Son güncelleme: {now.toLocaleTimeString('tr-TR')}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Helper functions
function getIsotopeName(id: string): string {
    const names: Record<string, string> = {
        'f18': 'Flor-18 (FDG)',
        'tc99m': 'Teknesyum-99m',
        'ga68': 'Galyum-68',
        'i131': 'İyot-131',
        'lu177': 'Lutesyum-177',
        'unknown': 'Diğer'
    };
    return names[id] || id;
}

function getIsotopeColor(id: string): string {
    const colors: Record<string, string> = {
        'f18': 'bg-blue-500',
        'tc99m': 'bg-amber-500',
        'ga68': 'bg-emerald-500',
        'i131': 'bg-purple-500',
        'lu177': 'bg-rose-500',
        'unknown': 'bg-slate-500'
    };
    return colors[id] || 'bg-slate-500';
}
