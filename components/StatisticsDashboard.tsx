import React, { useMemo } from 'react';
import { DoseLogEntry, DoseStatus, DoseUnit } from '../types';

interface StatisticsDashboardProps {
    history: DoseLogEntry[];
    unit: DoseUnit;
    now: Date;
    onClose: () => void;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
    history,
    unit,
    now,
    onClose
}) => {
    // Today's stats
    const todayStats = useMemo(() => {
        const today = now.toISOString().split('T')[0];
        const todayEntries = history.filter(h =>
            new Date(h.timestamp).toISOString().split('T')[0] === today
        );

        return {
            totalPatients: todayEntries.length,
            totalDose: todayEntries.reduce((sum, h) => sum + h.amount, 0),
            completed: todayEntries.filter(h => h.status === DoseStatus.INJECTED).length,
            pending: todayEntries.filter(h => h.status === DoseStatus.PREPARED).length,
            procedures: [...new Set(todayEntries.map(h => h.procedure))].length
        };
    }, [history, now]);

    // Weekly stats
    const weeklyStats = useMemo(() => {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weekEntries = history.filter(h =>
            new Date(h.timestamp) >= weekAgo
        );

        // Group by day
        const dailyData: Record<string, { count: number; dose: number }> = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            dailyData[key] = { count: 0, dose: 0 };
        }

        weekEntries.forEach(entry => {
            const key = new Date(entry.timestamp).toISOString().split('T')[0];
            if (dailyData[key]) {
                dailyData[key].count++;
                dailyData[key].dose += entry.amount;
            }
        });

        return {
            totalPatients: weekEntries.length,
            totalDose: weekEntries.reduce((sum, h) => sum + h.amount, 0),
            dailyData: Object.entries(dailyData).map(([date, data]) => ({
                date,
                dayName: new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' }),
                ...data
            })),
            avgPerDay: Math.round(weekEntries.length / 7 * 10) / 10
        };
    }, [history, now]);

    // Procedure breakdown
    const procedureStats = useMemo(() => {
        const today = now.toISOString().split('T')[0];
        const todayEntries = history.filter(h =>
            new Date(h.timestamp).toISOString().split('T')[0] === today
        );

        const breakdown: Record<string, { count: number; dose: number }> = {};
        todayEntries.forEach(entry => {
            if (!breakdown[entry.procedure]) {
                breakdown[entry.procedure] = { count: 0, dose: 0 };
            }
            breakdown[entry.procedure].count++;
            breakdown[entry.procedure].dose += entry.amount;
        });

        return Object.entries(breakdown)
            .map(([procedure, data]) => ({ procedure, ...data }))
            .sort((a, b) => b.count - a.count);
    }, [history, now]);

    // Calculate max for chart scaling
    const maxDailyCount = Math.max(...weeklyStats.dailyData.map(d => d.count), 1);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">İstatistikler & Analitik</h2>
                            <p className="text-xs text-slate-500">{now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
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

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-12 gap-6">
                        {/* Today's Summary Cards */}
                        <div className="col-span-12 grid grid-cols-5 gap-4">
                            <StatCard
                                title="Bugün Hasta"
                                value={todayStats.totalPatients}
                                icon="👥"
                                color="blue"
                            />
                            <StatCard
                                title="Toplam Doz"
                                value={`${todayStats.totalDose.toFixed(1)} ${unit}`}
                                icon="💉"
                                color="emerald"
                            />
                            <StatCard
                                title="Tamamlanan"
                                value={todayStats.completed}
                                icon="✅"
                                color="purple"
                            />
                            <StatCard
                                title="Bekleyen"
                                value={todayStats.pending}
                                icon="⏳"
                                color="amber"
                            />
                            <StatCard
                                title="Prosedür Çeşidi"
                                value={todayStats.procedures}
                                icon="📋"
                                color="rose"
                            />
                        </div>

                        {/* Weekly Chart */}
                        <div className="col-span-8 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white">Haftalık Hasta Dağılımı</h3>
                                <span className="text-xs text-slate-500">Son 7 gün • Ort: {weeklyStats.avgPerDay} hasta/gün</span>
                            </div>

                            <div className="flex items-end justify-between gap-2 h-40">
                                {weeklyStats.dailyData.map((day, idx) => {
                                    const height = (day.count / maxDailyCount) * 100;
                                    const isToday = day.date === now.toISOString().split('T')[0];

                                    return (
                                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                                            <span className="text-xs text-slate-400">{day.count}</span>
                                            <div
                                                className={`w-full rounded-t-lg transition-all hover:opacity-80 ${isToday
                                                        ? 'bg-gradient-to-t from-violet-600 to-purple-500'
                                                        : 'bg-gradient-to-t from-slate-600 to-slate-500'
                                                    }`}
                                                style={{ height: `${Math.max(height, 5)}%` }}
                                            />
                                            <span className={`text-xs ${isToday ? 'text-violet-400 font-bold' : 'text-slate-500'}`}>
                                                {day.dayName}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Procedure Breakdown */}
                        <div className="col-span-4 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h3 className="text-base font-bold text-white mb-4">Prosedür Dağılımı</h3>

                            {procedureStats.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <span className="text-4xl">📭</span>
                                    <p className="text-sm mt-2">Bugün veri yok</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {procedureStats.slice(0, 6).map((proc, idx) => {
                                        const percentage = (proc.count / todayStats.totalPatients) * 100;
                                        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

                                        return (
                                            <div key={proc.procedure}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-300 truncate max-w-[180px]">{proc.procedure}</span>
                                                    <span className="text-slate-500">{proc.count} ({percentage.toFixed(0)}%)</span>
                                                </div>
                                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${colors[idx % colors.length]} rounded-full transition-all`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Weekly Summary */}
                        <div className="col-span-12 bg-gradient-to-r from-violet-900/30 to-purple-900/30 border border-violet-500/20 rounded-xl p-5">
                            <h3 className="text-base font-bold text-white mb-4">📈 Haftalık Özet</h3>
                            <div className="grid grid-cols-4 gap-6">
                                <div className="text-center">
                                    <p className="text-3xl font-black text-violet-400">{weeklyStats.totalPatients}</p>
                                    <p className="text-xs text-slate-400 mt-1">Toplam Hasta</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-black text-purple-400">{weeklyStats.totalDose.toFixed(0)}</p>
                                    <p className="text-xs text-slate-400 mt-1">Toplam {unit}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-black text-pink-400">{weeklyStats.avgPerDay}</p>
                                    <p className="text-xs text-slate-400 mt-1">Günlük Ortalama</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-black text-fuchsia-400">
                                        {procedureStats.length > 0 ? procedureStats[0].procedure.split(' ')[0] : '-'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">En Sık Prosedür</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: string;
    color: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';
}> = ({ title, value, icon, color }) => {
    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
        emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
        amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400',
        rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/20 text-rose-400',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}>
            <div className="flex items-center justify-between">
                <span className="text-2xl">{icon}</span>
                <span className={`text-xl font-black ${colorClasses[color].split(' ').pop()}`}>{value}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">{title}</p>
        </div>
    );
};

export default StatisticsDashboard;
