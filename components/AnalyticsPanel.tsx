import React, { useState, useMemo } from 'react';
import { DoseLogEntry, DoseStatus, DoseUnit } from '../types';
import { generatePDFReport, exportToCSV } from '../utils/reportGenerator';

interface AnalyticsPanelProps {
    history: DoseLogEntry[];
    unit: DoseUnit;
    now: Date;
    onClose: () => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
    history,
    unit,
    now,
    onClose
}) => {
    const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'efficiency' | 'compare'>('overview');

    // Calculate date ranges
    const dateRanges = useMemo(() => {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());

        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(thisWeekStart.getDate() - 7);

        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        return { today, thisWeekStart, lastWeekStart, thisMonthStart, lastMonthStart };
    }, [now]);

    // Filter entries by period
    const getEntriesForPeriod = (startDate: Date, endDate: Date) => {
        return history.filter(h => {
            const date = new Date(h.timestamp);
            return date >= startDate && date < endDate;
        });
    };

    // This week vs last week comparison
    const comparison = useMemo(() => {
        const thisWeekEnd = new Date(dateRanges.thisWeekStart);
        thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

        const thisWeek = getEntriesForPeriod(dateRanges.thisWeekStart, thisWeekEnd);
        const lastWeek = getEntriesForPeriod(dateRanges.lastWeekStart, dateRanges.thisWeekStart);

        const thisWeekDose = thisWeek.reduce((sum, h) => sum + h.amount, 0);
        const lastWeekDose = lastWeek.reduce((sum, h) => sum + h.amount, 0);

        const patientChange = lastWeek.length > 0
            ? ((thisWeek.length - lastWeek.length) / lastWeek.length) * 100
            : thisWeek.length > 0 ? 100 : 0;

        const doseChange = lastWeekDose > 0
            ? ((thisWeekDose - lastWeekDose) / lastWeekDose) * 100
            : thisWeekDose > 0 ? 100 : 0;

        return {
            thisWeek: { patients: thisWeek.length, dose: thisWeekDose },
            lastWeek: { patients: lastWeek.length, dose: lastWeekDose },
            patientChange,
            doseChange
        };
    }, [history, dateRanges]);

    // Hourly distribution for efficiency analysis
    const hourlyDistribution = useMemo(() => {
        const distribution: { hour: number; count: number; avgDose: number }[] = [];
        const hourData: Record<number, { count: number; totalDose: number }> = {};

        // Initialize hours 7-18 (working hours)
        for (let h = 7; h <= 18; h++) {
            hourData[h] = { count: 0, totalDose: 0 };
        }

        // Filter to last 7 days
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        history
            .filter(h => new Date(h.timestamp) >= weekAgo)
            .forEach(entry => {
                const hour = new Date(entry.timestamp).getHours();
                if (hourData[hour]) {
                    hourData[hour].count++;
                    hourData[hour].totalDose += entry.amount;
                }
            });

        for (let h = 7; h <= 18; h++) {
            distribution.push({
                hour: h,
                count: hourData[h].count,
                avgDose: hourData[h].count > 0 ? hourData[h].totalDose / hourData[h].count : 0
            });
        }

        return distribution;
    }, [history, now]);

    // Peak hours
    const peakHour = useMemo(() => {
        const sorted = [...hourlyDistribution].sort((a, b) => b.count - a.count);
        return sorted[0];
    }, [hourlyDistribution]);

    // Procedure efficiency
    const procedureEfficiency = useMemo(() => {
        const procs: Record<string, { count: number; completed: number; pending: number; avgDose: number; totalDose: number }> = {};

        history.forEach(entry => {
            if (!procs[entry.procedure]) {
                procs[entry.procedure] = { count: 0, completed: 0, pending: 0, avgDose: 0, totalDose: 0 };
            }
            procs[entry.procedure].count++;
            procs[entry.procedure].totalDose += entry.amount;
            if (entry.status === DoseStatus.INJECTED) {
                procs[entry.procedure].completed++;
            } else {
                procs[entry.procedure].pending++;
            }
        });

        return Object.entries(procs)
            .map(([proc, data]) => ({
                procedure: proc,
                ...data,
                avgDose: data.count > 0 ? data.totalDose / data.count : 0,
                completionRate: data.count > 0 ? (data.completed / data.count) * 100 : 0
            }))
            .sort((a, b) => b.count - a.count);
    }, [history]);

    // Daily trend for last 14 days
    const dailyTrend = useMemo(() => {
        const trend: { date: string; dayName: string; count: number; dose: number }[] = [];

        for (let i = 13; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayEntries = history.filter(h =>
                new Date(h.timestamp).toISOString().split('T')[0] === dateStr
            );

            trend.push({
                date: dateStr,
                dayName: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
                count: dayEntries.length,
                dose: dayEntries.reduce((sum, h) => sum + h.amount, 0)
            });
        }

        return trend;
    }, [history, now]);

    const maxTrendCount = Math.max(...dailyTrend.map(d => d.count), 1);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-2xl">📈</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Gelişmiş Analitik</h2>
                            <p className="text-xs text-slate-500">Detaylı performans analizi ve raporlama</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Export buttons */}
                        <button
                            onClick={() => generatePDFReport(history, unit, 'daily', now)}
                            className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                        >
                            <span>📄</span> PDF Günlük
                        </button>
                        <button
                            onClick={() => generatePDFReport(history, unit, 'weekly', now)}
                            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                        >
                            <span>📄</span> PDF Haftalık
                        </button>
                        <button
                            onClick={() => exportToCSV(history, unit, 'hasta_listesi')}
                            className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                        >
                            <span>📊</span> CSV Export
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors ml-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-5 py-3 border-b border-slate-700/50 flex gap-2">
                    {[
                        { id: 'overview', label: 'Genel Bakış', icon: '📊' },
                        { id: 'trends', label: 'Trendler', icon: '📈' },
                        { id: 'efficiency', label: 'Verimlilik', icon: '⚡' },
                        { id: 'compare', label: 'Karşılaştırma', icon: '🔄' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${selectedTab === tab.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
                    {/* Overview Tab */}
                    {selectedTab === 'overview' && (
                        <div className="grid grid-cols-12 gap-4">
                            {/* Quick Stats */}
                            <div className="col-span-12 grid grid-cols-4 gap-4">
                                <StatCard
                                    icon="👥"
                                    label="Bu Hafta Hasta"
                                    value={comparison.thisWeek.patients}
                                    change={comparison.patientChange}
                                />
                                <StatCard
                                    icon="💉"
                                    label="Bu Hafta Doz"
                                    value={`${comparison.thisWeek.dose.toFixed(0)} ${unit}`}
                                    change={comparison.doseChange}
                                />
                                <StatCard
                                    icon="⏰"
                                    label="En Yoğun Saat"
                                    value={`${peakHour?.hour || '-'}:00`}
                                    subtext={`${peakHour?.count || 0} hasta`}
                                />
                                <StatCard
                                    icon="📋"
                                    label="Prosedür Çeşidi"
                                    value={procedureEfficiency.length}
                                    subtext="farklı işlem"
                                />
                            </div>

                            {/* 14-day trend chart */}
                            <div className="col-span-8 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                <h3 className="text-base font-bold text-white mb-4">Son 14 Gün Trendi</h3>
                                <div className="flex items-end justify-between gap-1 h-40">
                                    {dailyTrend.map((day, idx) => {
                                        const height = (day.count / maxTrendCount) * 100;
                                        const isToday = idx === dailyTrend.length - 1;
                                        const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;

                                        return (
                                            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                                                <div className="absolute bottom-full mb-2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    {day.count} hasta • {day.dose.toFixed(1)} {unit}
                                                </div>
                                                <span className="text-[10px] text-slate-500">{day.count}</span>
                                                <div
                                                    className={`w-full rounded-t transition-all ${isToday
                                                            ? 'bg-gradient-to-t from-indigo-600 to-purple-500'
                                                            : isWeekend
                                                                ? 'bg-gradient-to-t from-slate-700 to-slate-600'
                                                                : 'bg-gradient-to-t from-blue-600 to-cyan-500'
                                                        }`}
                                                    style={{ height: `${Math.max(height, 3)}%` }}
                                                />
                                                <span className={`text-[9px] ${isToday ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
                                                    {day.dayName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Top Procedures */}
                            <div className="col-span-4 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                <h3 className="text-base font-bold text-white mb-4">En Sık Prosedürler</h3>
                                <div className="space-y-3">
                                    {procedureEfficiency.slice(0, 5).map((proc, idx) => {
                                        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                                        const percentage = (proc.count / (comparison.thisWeek.patients || 1)) * 100;

                                        return (
                                            <div key={proc.procedure}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-300 truncate max-w-[150px]">{proc.procedure}</span>
                                                    <span className="text-slate-500">{proc.count}</span>
                                                </div>
                                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${colors[idx]} rounded-full transition-all`}
                                                        style={{ width: `${Math.min(percentage * 3, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trends Tab */}
                    {selectedTab === 'trends' && (
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                <h3 className="text-base font-bold text-white mb-4">Saatlik Dağılım (Son 7 Gün)</h3>
                                <div className="flex items-end justify-between gap-2 h-48">
                                    {hourlyDistribution.map(item => {
                                        const maxCount = Math.max(...hourlyDistribution.map(h => h.count), 1);
                                        const height = (item.count / maxCount) * 100;
                                        const isPeak = item.hour === peakHour?.hour;

                                        return (
                                            <div key={item.hour} className="flex-1 flex flex-col items-center gap-2">
                                                <span className="text-xs text-slate-400">{item.count}</span>
                                                <div
                                                    className={`w-full rounded-t transition-all ${isPeak
                                                            ? 'bg-gradient-to-t from-amber-600 to-yellow-400'
                                                            : 'bg-gradient-to-t from-slate-600 to-slate-500'
                                                        }`}
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                />
                                                <span className={`text-xs ${isPeak ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                                                    {item.hour}:00
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded bg-amber-500"></span> En yoğun saat
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded bg-slate-500"></span> Normal saatler
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Efficiency Tab */}
                    {selectedTab === 'efficiency' && (
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                <h3 className="text-base font-bold text-white mb-4">Prosedür Verimliliği</h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-700">
                                            <th className="text-left py-3">Prosedür</th>
                                            <th className="text-center py-3">Toplam</th>
                                            <th className="text-center py-3">Tamamlanan</th>
                                            <th className="text-center py-3">Bekleyen</th>
                                            <th className="text-right py-3">Ort. Doz</th>
                                            <th className="text-right py-3">Başarı %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {procedureEfficiency.map(proc => (
                                            <tr key={proc.procedure} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                                <td className="py-3 text-white">{proc.procedure}</td>
                                                <td className="py-3 text-center text-slate-300">{proc.count}</td>
                                                <td className="py-3 text-center text-emerald-400">{proc.completed}</td>
                                                <td className="py-3 text-center text-amber-400">{proc.pending}</td>
                                                <td className="py-3 text-right text-slate-300">{proc.avgDose.toFixed(2)} {unit}</td>
                                                <td className="py-3 text-right">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${proc.completionRate >= 80
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : proc.completionRate >= 50
                                                                ? 'bg-amber-500/20 text-amber-400'
                                                                : 'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {proc.completionRate.toFixed(0)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Compare Tab */}
                    {selectedTab === 'compare' && (
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-6 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-500/20 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-blue-400 mb-4">Bu Hafta</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-4xl font-black text-white">{comparison.thisWeek.patients}</p>
                                        <p className="text-sm text-slate-400">Hasta</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black text-white">{comparison.thisWeek.dose.toFixed(0)}</p>
                                        <p className="text-sm text-slate-400">Toplam {unit}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-purple-400 mb-4">Geçen Hafta</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-4xl font-black text-white">{comparison.lastWeek.patients}</p>
                                        <p className="text-sm text-slate-400">Hasta</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black text-white">{comparison.lastWeek.dose.toFixed(0)}</p>
                                        <p className="text-sm text-slate-400">Toplam {unit}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-12 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                                <h3 className="text-base font-bold text-white mb-4">Değişim Analizi</h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black ${comparison.patientChange >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {comparison.patientChange >= 0 ? '↑' : '↓'}
                                        </div>
                                        <div>
                                            <p className={`text-2xl font-black ${comparison.patientChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {comparison.patientChange >= 0 ? '+' : ''}{comparison.patientChange.toFixed(1)}%
                                            </p>
                                            <p className="text-sm text-slate-400">Hasta sayısı değişimi</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black ${comparison.doseChange >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {comparison.doseChange >= 0 ? '↑' : '↓'}
                                        </div>
                                        <div>
                                            <p className={`text-2xl font-black ${comparison.doseChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {comparison.doseChange >= 0 ? '+' : ''}{comparison.doseChange.toFixed(1)}%
                                            </p>
                                            <p className="text-sm text-slate-400">Doz miktarı değişimi</p>
                                        </div>
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

// Stat Card Component
const StatCard: React.FC<{
    icon: string;
    label: string;
    value: string | number;
    change?: number;
    subtext?: string;
}> = ({ icon, label, value, change, subtext }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{icon}</span>
            {change !== undefined && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${change >= 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
            )}
        </div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-slate-500">{subtext || label}</p>
    </div>
);

export default AnalyticsPanel;
