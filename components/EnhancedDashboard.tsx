import React, { useState, useMemo } from 'react';
import { DoseLogEntry, Vial, Isotope, DoseUnit, PendingPatient } from '../types';

interface EnhancedDashboardProps {
    onClose: () => void;
    history: DoseLogEntry[];
    vials: Vial[];
    selectedIsotope: Isotope;
    unit: DoseUnit;
    pendingPatients: PendingPatient[];
    currentTotalActivity: number;
}

const translations = {
    tr: {
        title: 'Gelişmiş Dashboard',
        subtitle: 'Kapsamlı istatistikler ve analizler',
        today: 'Bugün',
        thisWeek: 'Bu Hafta',
        thisMonth: 'Bu Ay',
        allTime: 'Tüm Zamanlar',
        kpis: 'Ana Metrikler',
        totalPatients: 'TOPLAM HASTA',
        totalDose: 'TOPLAM DOZ',
        avgDose: 'ORT. DOZ',
        currentStock: 'MEVCUT STOK',
        weeklyTrend: 'Haftalık Trend',
        patientsPerDay: 'Günlük hasta sayısı',
        hourlyDist: 'Saatlik Dağılım',
        proceduresDist: 'Prosedür bazlı işlem dağılımı',
        procedureBreakdown: 'Prosedür Dağılımı',
        quickStats: 'Hızlı İstatistikler',
        completionRate: 'Tamamlanma Oranı',
        waitingPatients: 'Bekleyen Hasta',
        activeVials: 'Aktif Vial',
        activeIsotope: 'Aktif İzotop',
        recentActivity: 'Son Aktiviteler',
        noData: 'Bu dönemde veri yok',
        monday: 'Pzt',
        tuesday: 'Sal',
        wednesday: 'Çar',
        thursday: 'Per',
        friday: 'Cum',
        saturday: 'Cmt',
        sunday: 'Paz',
    },
    en: {
        title: 'Enhanced Dashboard',
        subtitle: 'Comprehensive statistics and analytics',
        today: 'Today',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        allTime: 'All Time',
        kpis: 'Key Metrics',
        totalPatients: 'TOTAL PATIENTS',
        totalDose: 'TOTAL DOSE',
        avgDose: 'AVG. DOSE',
        currentStock: 'CURRENT STOCK',
        weeklyTrend: 'Weekly Trend',
        patientsPerDay: 'Patients per day',
        hourlyDist: 'Hourly Distribution',
        proceduresDist: 'Procedure-based distribution',
        procedureBreakdown: 'Procedure Breakdown',
        quickStats: 'Quick Stats',
        completionRate: 'Completion Rate',
        waitingPatients: 'Waiting Patients',
        activeVials: 'Active Vials',
        activeIsotope: 'Active Isotope',
        recentActivity: 'Recent Activity',
        noData: 'No data for this period',
        monday: 'Mon',
        tuesday: 'Tue',
        wednesday: 'Wed',
        thursday: 'Thu',
        friday: 'Fri',
        saturday: 'Sat',
        sunday: 'Sun',
    },
};

export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
    onClose,
    history,
    vials,
    selectedIsotope,
    unit,
    pendingPatients,
    currentTotalActivity,
}) => {
    const lang = useMemo(() => {
        try {
            const settings = localStorage.getItem('nt_app_settings');
            if (settings) return JSON.parse(settings).language || 'tr';
        } catch { }
        return 'tr';
    }, []);

    const t = translations[lang as 'tr' | 'en'];
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

    const filteredHistory = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return history.filter(h => {
            const date = new Date(h.timestamp);
            switch (timeRange) {
                case 'today': return date >= today;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return date >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return date >= monthAgo;
                default: return true;
            }
        });
    }, [history, timeRange]);

    const stats = useMemo(() => {
        const total = filteredHistory.length;
        const totalDose = filteredHistory.reduce((sum, h) => sum + h.amount, 0);
        const avgDose = total > 0 ? totalDose / total : 0;
        const completed = filteredHistory.filter(h => h.status === 'completed').length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        return { total, totalDose, avgDose, completionRate };
    }, [filteredHistory]);

    const weeklyData = useMemo(() => {
        const days = [t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday, t.sunday];
        const counts = new Array(7).fill(0);
        filteredHistory.forEach(h => {
            const date = new Date(h.timestamp);
            counts[(date.getDay() + 6) % 7]++;
        });
        const max = Math.max(...counts, 1);
        return days.map((day, i) => ({ day, count: counts[i], height: (counts[i] / max) * 100 }));
    }, [filteredHistory, t]);

    const hourlyData = useMemo(() => {
        const hours = Array.from({ length: 10 }, (_, i) => i + 8);
        const counts = new Array(10).fill(0);
        filteredHistory.forEach(h => {
            const hour = new Date(h.timestamp).getHours();
            if (hour >= 8 && hour < 18) counts[hour - 8]++;
        });
        const max = Math.max(...counts, 1);
        return hours.map((hour, i) => ({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            count: counts[i],
            height: (counts[i] / max) * 100,
        }));
    }, [filteredHistory]);

    const procedureData = useMemo(() => {
        const procedures: Record<string, number> = {};
        filteredHistory.forEach(h => {
            const proc = h.procedure || (lang === 'en' ? 'Other' : 'Diğer');
            procedures[proc] = (procedures[proc] || 0) + 1;
        });
        const sorted = Object.entries(procedures).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const total = sorted.reduce((sum, [, count]) => sum + count, 0);
        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500'];
        return sorted.map(([name, count], i) => ({
            name,
            count,
            percent: total > 0 ? (count / total) * 100 : 0,
            color: colors[i % colors.length],
        }));
    }, [filteredHistory, lang]);

    const recentActivity = filteredHistory.slice(0, 8);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-slate-700">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📊</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t.title}</h2>
                            <p className="text-blue-200 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/10 rounded-lg p-1">
                            {[
                                { value: 'today', label: t.today },
                                { value: 'week', label: t.thisWeek },
                                { value: 'month', label: t.thisMonth },
                                { value: 'all', label: t.allTime },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTimeRange(opt.value as any)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${timeRange === opt.value ? 'bg-white text-blue-600' : 'text-white/80 hover:text-white'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
                    {/* KPIs */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{t.kpis}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{t.totalPatients}</p>
                                <p className="text-3xl font-black text-white mt-1">{stats.total}</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/20">
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{t.totalDose}</p>
                                <p className="text-3xl font-black text-white mt-1">{stats.totalDose.toFixed(1)} <span className="text-lg text-emerald-300">{unit}</span></p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/20">
                                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{t.avgDose}</p>
                                <p className="text-3xl font-black text-white mt-1">{stats.avgDose.toFixed(2)} <span className="text-lg text-amber-300">{unit}</span></p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/20">
                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">{t.currentStock}</p>
                                <p className="text-3xl font-black text-white mt-1">{currentTotalActivity.toFixed(1)} <span className="text-lg text-purple-300">{unit}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Weekly Chart */}
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <h4 className="text-sm font-semibold text-white mb-4">{t.weeklyTrend}</h4>
                            <div className="flex items-end justify-between h-32 gap-2">
                                {weeklyData.map(d => (
                                    <div key={d.day} className="flex-1 flex flex-col items-center">
                                        <div className="w-full bg-slate-700 rounded-t relative" style={{ height: '100px' }}>
                                            <div
                                                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all"
                                                style={{ height: `${d.height}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1">{d.day}</span>
                                        <span className="text-xs text-white font-medium">{d.count}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-slate-500 text-xs mt-2 text-center">{t.patientsPerDay}</p>
                        </div>

                        {/* Hourly Distribution */}
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <h4 className="text-sm font-semibold text-white mb-4">{t.hourlyDist}</h4>
                            <div className="flex items-end justify-between h-32 gap-1">
                                {hourlyData.map(d => (
                                    <div key={d.hour} className="flex-1 flex flex-col items-center">
                                        <div className="w-full bg-slate-700 rounded-t relative" style={{ height: '100px' }}>
                                            <div
                                                className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all"
                                                style={{ height: `${d.height}%` }}
                                            />
                                        </div>
                                        <span className="text-[8px] text-slate-400 mt-1">{d.hour.slice(0, 2)}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-slate-500 text-xs mt-2 text-center">{t.proceduresDist}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Procedure Breakdown */}
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <h4 className="text-sm font-semibold text-white mb-4">{t.procedureBreakdown}</h4>
                            {procedureData.length > 0 ? (
                                <div className="space-y-3">
                                    {procedureData.map(p => (
                                        <div key={p.name}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-slate-300 truncate max-w-[60%]">{p.name}</span>
                                                <span className="text-slate-400">{p.count} ({p.percent.toFixed(0)}%)</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.percent}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-8">{t.noData}</p>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <h4 className="text-sm font-semibold text-white mb-4">{t.quickStats}</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">{t.completionRate}</span>
                                    <span className="text-white font-bold">{stats.completionRate.toFixed(0)}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">{t.waitingPatients}</span>
                                    <span className="text-amber-400 font-bold">{pendingPatients.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">{t.activeVials}</span>
                                    <span className="text-emerald-400 font-bold">{vials.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">{t.activeIsotope}</span>
                                    <span className={`font-bold ${selectedIsotope.color.replace('bg-', 'text-')}`}>{selectedIsotope.symbol}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <h4 className="text-sm font-semibold text-white mb-4">{t.recentActivity}</h4>
                            {recentActivity.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {recentActivity.map((h, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            <span className="text-slate-300 truncate flex-1">{h.patientName}</span>
                                            <span className="text-slate-500">{h.amount.toFixed(1)} {unit}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-4">{t.noData}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
