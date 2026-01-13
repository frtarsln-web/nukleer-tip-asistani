import React, { useState, useMemo } from 'react';
import { DoseLogEntry, Isotope, DoseUnit } from '../types';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDebounce } from '../hooks';

interface AnalyticsProps {
    history: DoseLogEntry[];
    selectedIsotope: Isotope;
    unit: DoseUnit;
}

export const Analytics: React.FC<AnalyticsProps> = ({ history, selectedIsotope, unit }) => {
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
    const [selectedView, setSelectedView] = useState<'overview' | 'procedures' | 'trends'>('overview');

    const debouncedTimeRange = useDebounce(timeRange, 300);

    const filteredData = useMemo(() => {
        const now = new Date();
        const rangeMs = debouncedTimeRange === 'day' ? 86400000 : debouncedTimeRange === 'week' ? 604800000 : 2592000000;
        return history.filter(h => (now.getTime() - new Date(h.timestamp).getTime()) < rangeMs);
    }, [history, debouncedTimeRange]);

    const procedureStats = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredData.forEach(entry => {
            counts[entry.procedure] = (counts[entry.procedure] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData]);

    const hourlyTrend = useMemo(() => {
        const hourCounts: Record<number, number> = {};
        filteredData.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        return Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            count: hourCounts[i] || 0
        }));
    }, [filteredData]);

    const totalActivity = filteredData.reduce((sum, h) => sum + h.amount, 0);
    const avgActivity = filteredData.length > 0 ? totalActivity / filteredData.length : 0;

    const COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#eab308', '#ec4899'];

    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">📊 ANALİTİK DASHBOARD</h3>
                <div className="flex gap-2">
                    {(['day', 'week', 'month'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${timeRange === range
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                }`}
                        >
                            {range === 'day' ? 'Günlük' : range === 'week' ? 'Haftalık' : 'Aylık'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <div className="text-[8px] font-black text-blue-400 uppercase mb-1">Toplam Hasta</div>
                    <div className="text-2xl font-black text-white">{filteredData.length}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="text-[8px] font-black text-emerald-400 uppercase mb-1">Toplam Aktivite</div>
                    <div className="text-2xl font-black text-white">{totalActivity.toFixed(0)}</div>
                    <div className="text-[8px] font-black text-slate-500">{unit}</div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                    <div className="text-[8px] font-black text-orange-400 uppercase mb-1">Ortalama Doz</div>
                    <div className="text-2xl font-black text-white">{avgActivity.toFixed(1)}</div>
                    <div className="text-[8px] font-black text-slate-500">{unit}</div>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex gap-2 border-b border-white/5 pb-2">
                {(['overview', 'procedures', 'trends'] as const).map(view => (
                    <button
                        key={view}
                        onClick={() => setSelectedView(view)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${selectedView === view
                                ? 'bg-white/10 text-white'
                                : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        {view === 'overview' ? 'Genel Bakış' : view === 'procedures' ? 'Prosedürler' : 'Trendler'}
                    </button>
                ))}
            </div>

            {/* Charts */}
            {selectedView === 'procedures' && procedureStats.length > 0 && (
                <div className="bg-black/20 rounded-2xl p-4">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase mb-4">Prosedür Dağılımı</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={procedureStats}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => entry.name}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {procedureStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {selectedView === 'trends' && (
                <div className="bg-black/20 rounded-2xl p-4">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase mb-4">Saatlik Dağılım</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={hourlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: '10px' }} />
                            <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {selectedView === 'overview' && (
                <div className="space-y-3">
                    {procedureStats.slice(0, 5).map((proc, idx) => (
                        <div key={proc.name} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black" style={{ backgroundColor: COLORS[idx % COLORS.length] + '20', color: COLORS[idx % COLORS.length] }}>
                                {proc.value}
                            </div>
                            <div className="flex-1">
                                <div className="text-[9px] font-black text-white">{proc.name}</div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${(proc.value / filteredData.length) * 100}%`,
                                            backgroundColor: COLORS[idx % COLORS.length]
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="text-[9px] font-black text-slate-500">
                                %{((proc.value / filteredData.length) * 100).toFixed(0)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
