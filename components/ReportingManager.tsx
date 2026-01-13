import React, { useState, useMemo } from 'react';
import { DoseLogEntry, DoseUnit, DoseStatus, WasteBin, Isotope } from '../types';
import { calculateDecay } from '../utils/physics';

interface ReportingManagerProps {
    history: DoseLogEntry[];
    wasteBins: WasteBin[];
    selectedIsotope: Isotope;
    unit: DoseUnit;
    now: Date;
}

export const ReportingManager: React.FC<ReportingManagerProps> = ({
    history,
    wasteBins,
    selectedIsotope,
    unit,
    now
}) => {
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportDate, setReportDate] = useState(now.toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'staff'>('daily');

    const dailyHistory = useMemo(() => {
        return history.filter(entry => {
            const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
            return entryDate === reportDate;
        });
    }, [history, reportDate]);

    // Haftalık trend verisi (son 7 gün)
    const weeklyTrend = useMemo(() => {
        const trend: { date: string; dayName: string; count: number; dose: number }[] = [];

        for (let i = 6; i >= 0; i--) {
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

    // Prosedür dağılımı
    const procedureDistribution = useMemo(() => {
        const procs: Record<string, { count: number; dose: number }> = {};

        dailyHistory.forEach(entry => {
            if (!procs[entry.procedure]) {
                procs[entry.procedure] = { count: 0, dose: 0 };
            }
            procs[entry.procedure].count++;
            procs[entry.procedure].dose += entry.amount;
        });

        return Object.entries(procs)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count);
    }, [dailyHistory]);

    const stats = useMemo(() => {
        const injected = dailyHistory.filter(h => h.status === DoseStatus.INJECTED);
        const prepared = dailyHistory.filter(h => h.status === DoseStatus.PREPARED);
        const totalInjected = injected.reduce((sum, h) => sum + h.amount, 0);
        const totalPrepared = prepared.reduce((sum, h) => sum + h.amount, 0);

        const additionalImagingCount = dailyHistory.filter(h => h.additionalInfo?.status === 'completed' || h.additionalInfo?.region).length;

        const wasteActivity = wasteBins.reduce((total, bin) => {
            return total + bin.items.reduce((binTotal, item) => {
                if (item.isotopeId === selectedIsotope.id) {
                    const hours = (now.getTime() - new Date(item.disposedAt).getTime()) / (1000 * 60 * 60);
                    return binTotal + calculateDecay(item.activity, selectedIsotope.halfLifeHours, hours);
                }
                return binTotal;
            }, 0);
        }, 0);

        const efficiency = totalInjected > 0 ? ((totalInjected / (totalInjected + wasteActivity)) * 100) : 0;

        return {
            injectedCount: injected.length,
            preparedCount: prepared.length,
            totalInjected,
            totalPrepared,
            wasteActivity,
            efficiency,
            additionalImagingCount
        };
    }, [dailyHistory, wasteBins, selectedIsotope, now]);

    // Personel performansı
    const staffPerformance = useMemo(() => {
        const userStats: Record<string, { name: string; count: number; totalActivity: number }> = {};
        dailyHistory.forEach(entry => {
            if (entry.preparedBy) {
                const userId = entry.preparedBy.id;
                if (!userStats[userId]) {
                    userStats[userId] = { name: entry.preparedBy.name, count: 0, totalActivity: 0 };
                }
                userStats[userId].count++;
                userStats[userId].totalActivity += entry.amount;
            }
        });
        return Object.values(userStats).sort((a, b) => b.count - a.count);
    }, [dailyHistory]);

    // Excel dışa aktarma
    const handleExportExcel = () => {
        const headers = ['Saat', 'Protokol No', 'Hasta Adı', 'Prosedür', 'Hazırlayan', 'Ek Çekim', `Doz (${unit})`];
        const rows = dailyHistory.map(entry => [
            new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            entry.protocolNo || '-',
            entry.patientName,
            entry.procedure,
            entry.preparedBy?.name || '-',
            entry.additionalInfo?.region || '-',
            entry.amount.toFixed(2)
        ]);

        const csvContent = [
            `${selectedIsotope.name} - Günlük Rapor - ${reportDate}`,
            '',
            headers.join('\t'),
            ...rows.map(row => row.join('\t')),
            '',
            `Toplam Hasta: ${stats.injectedCount}`,
            `Toplam Doz: ${stats.totalInjected.toFixed(1)} ${unit}`,
            `Ek Çekim: ${stats.additionalImagingCount}`,
            `Verimlilik: ${stats.efficiency.toFixed(0)}%`
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `nuklear-tip-rapor-${reportDate}.csv`;
        link.click();
    };

    const handlePrint = () => {
        window.print();
    };

    const maxTrendCount = Math.max(...weeklyTrend.map(d => d.count), 1);
    const maxTrendDose = Math.max(...weeklyTrend.map(d => d.dose), 1);

    return (
        <section className="space-y-4 print:hidden">
            <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    RAPORLAMA
                </h3>
                <button
                    onClick={() => setIsReportOpen(!isReportOpen)}
                    className="text-[9px] font-black text-emerald-500/60 hover:text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/10 transition-colors btn-hover-lift"
                >
                    {isReportOpen ? 'KAPAT' : 'RAPOR OLUŞTUR'}
                </button>
            </div>

            {isReportOpen && (
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-6 animate-in slide-in-from-top-2">
                    {/* Header with date and actions */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <label className="text-[8px] font-black text-slate-500 uppercase">TARİH:</label>
                            <input
                                type="date"
                                value={reportDate}
                                onChange={e => setReportDate(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-colors btn-hover-lift"
                            >
                                <span>📊</span> EXCEL
                            </button>
                            <button
                                onClick={handlePrint}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-colors btn-hover-lift"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                YAZDIR / PDF
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-white/10 pb-3">
                        {[
                            { id: 'daily', label: 'Günlük Özet', icon: '📋' },
                            { id: 'weekly', label: 'Haftalık Trend', icon: '📈' },
                            { id: 'staff', label: 'Personel', icon: '👥' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'daily' | 'weekly' | 'staff')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === tab.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <span>{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Daily Summary Tab */}
                    {activeTab === 'daily' && (
                        <>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center card-hover">
                                    <p className="text-2xl font-black text-blue-400">{stats.injectedCount}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Hasta</p>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center card-hover">
                                    <p className="text-2xl font-black text-emerald-400">{stats.totalInjected.toFixed(1)}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Toplam {unit}</p>
                                </div>
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center card-hover">
                                    <p className="text-2xl font-black text-orange-400">{stats.additionalImagingCount}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Ek Çekim</p>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center card-hover">
                                    <p className="text-2xl font-black text-amber-400">{stats.efficiency.toFixed(0)}%</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Verimlilik</p>
                                </div>
                            </div>

                            {procedureDistribution.length > 0 && (
                                <div className="bg-slate-800/30 rounded-2xl p-4">
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-3">Prosedür Dağılımı</h4>
                                    <div className="space-y-2">
                                        {procedureDistribution.slice(0, 5).map((proc, idx) => {
                                            const percentage = stats.injectedCount > 0 ? (proc.count / stats.injectedCount) * 100 : 0;
                                            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                                            return (
                                                <div key={proc.name} className="flex items-center gap-3">
                                                    <span className="text-xs text-slate-400 w-28 truncate">{proc.name}</span>
                                                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${colors[idx]} rounded-full transition-all`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500 w-8 text-right">{proc.count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-2 text-[8px] font-black text-slate-500 uppercase">Saat</th>
                                            <th className="text-left py-2 text-[8px] font-black text-slate-500 uppercase">Protokol</th>
                                            <th className="text-left py-2 text-[8px] font-black text-slate-500 uppercase">Hasta</th>
                                            <th className="text-left py-2 text-[8px] font-black text-slate-500 uppercase">Prosedür</th>
                                            <th className="text-left py-2 text-[8px] font-black text-slate-500 uppercase">Hazırlayan</th>
                                            <th className="text-center py-2 text-[8px] font-black text-slate-500 uppercase">Ek Çekim</th>
                                            <th className="text-right py-2 text-[8px] font-black text-slate-500 uppercase">Doz ({unit})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-8 text-slate-600">Bu tarihte kayıt bulunamadı.</td>
                                            </tr>
                                        ) : dailyHistory.map(entry => (
                                            <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-2 text-slate-400 font-mono">{new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="py-2 text-blue-400 font-bold">{entry.protocolNo || '-'}</td>
                                                <td className="py-2 text-white font-bold">{entry.patientName}</td>
                                                <td className="py-2 text-slate-400">{entry.procedure}</td>
                                                <td className="py-2 text-purple-400 font-bold">{entry.preparedBy?.name || '-'}</td>
                                                <td className="py-2 text-center">
                                                    {entry.additionalInfo?.region ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-lg text-[9px] font-bold">
                                                            📸 {entry.additionalInfo.region}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-600">-</span>
                                                    )}
                                                </td>
                                                <td className="py-2 text-right text-orange-400 font-black">{entry.amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Weekly Trend Tab */}
                    {activeTab === 'weekly' && (
                        <div className="space-y-6">
                            <div className="bg-slate-800/30 rounded-2xl p-5">
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <span>👥</span> Haftalık Hasta Sayısı
                                </h4>
                                <div className="flex items-end justify-between gap-2 h-40">
                                    {weeklyTrend.map((day, idx) => {
                                        const height = (day.count / maxTrendCount) * 100;
                                        const isToday = idx === weeklyTrend.length - 1;
                                        return (
                                            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                                                <div className="absolute bottom-full mb-2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    {day.count} hasta • {day.dose.toFixed(1)} {unit}
                                                </div>
                                                <span className="text-xs text-slate-400 font-bold">{day.count}</span>
                                                <div
                                                    className={`w-full rounded-t transition-all ${isToday
                                                            ? 'bg-gradient-to-t from-purple-600 to-purple-400'
                                                            : 'bg-gradient-to-t from-blue-600 to-cyan-500'
                                                        }`}
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                />
                                                <span className={`text-[10px] ${isToday ? 'text-purple-400 font-bold' : 'text-slate-500'}`}>
                                                    {day.dayName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-slate-800/30 rounded-2xl p-5">
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <span>💉</span> Haftalık Doz Miktarı ({unit})
                                </h4>
                                <div className="flex items-end justify-between gap-2 h-40">
                                    {weeklyTrend.map((day, idx) => {
                                        const height = (day.dose / maxTrendDose) * 100;
                                        const isToday = idx === weeklyTrend.length - 1;
                                        return (
                                            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-xs text-slate-400 font-bold">{day.dose.toFixed(0)}</span>
                                                <div
                                                    className={`w-full rounded-t transition-all ${isToday
                                                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                                                            : 'bg-gradient-to-t from-teal-600 to-cyan-500'
                                                        }`}
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                />
                                                <span className={`text-[10px] ${isToday ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                                                    {day.dayName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-black text-blue-400">
                                        {weeklyTrend.reduce((sum, d) => sum + d.count, 0)}
                                    </p>
                                    <p className="text-[9px] text-slate-500 uppercase mt-1">Toplam Hasta</p>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-black text-emerald-400">
                                        {weeklyTrend.reduce((sum, d) => sum + d.dose, 0).toFixed(0)}
                                    </p>
                                    <p className="text-[9px] text-slate-500 uppercase mt-1">Toplam {unit}</p>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-black text-purple-400">
                                        {(weeklyTrend.reduce((sum, d) => sum + d.count, 0) / 7).toFixed(1)}
                                    </p>
                                    <p className="text-[9px] text-slate-500 uppercase mt-1">Günlük Ortalama</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Staff Performance Tab */}
                    {activeTab === 'staff' && (
                        <div className="space-y-4">
                            {staffPerformance.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <span className="text-4xl mb-2 block">👥</span>
                                    <p>Bu tarihte personel kaydı bulunamadı</p>
                                </div>
                            ) : (
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                                    <h4 className="text-[9px] font-black text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        PERSONEL PERFORMANSI ({reportDate})
                                    </h4>
                                    <div className="grid gap-2">
                                        {staffPerformance.map((user, idx) => {
                                            const maxCount = staffPerformance[0]?.count || 1;
                                            const percentage = (user.count / maxCount) * 100;
                                            return (
                                                <div key={idx} className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center text-sm font-black text-purple-300">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-bold text-white block">{user.name}</span>
                                                        <div className="h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                                            <div
                                                                className="h-full bg-purple-500 rounded-full transition-all"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <span className="text-lg font-black text-purple-400">{user.count}</span>
                                                            <span className="text-[8px] text-slate-500 ml-1">doz</span>
                                                        </div>
                                                        <div className="text-right min-w-[70px]">
                                                            <span className="text-lg font-black text-emerald-400">{user.totalActivity.toFixed(1)}</span>
                                                            <span className="text-[8px] text-slate-500 ml-1">{unit}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Print-only section */}
            <div id="printable-report" className="hidden print:block p-8 bg-white text-black">
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-2xl font-bold">NÜKLEER TIP ASİSTANI</h1>
                    <h2 className="text-lg font-semibold mt-1">Günlük Doz Raporu</h2>
                    <p className="text-sm text-gray-600 mt-2">{selectedIsotope.name} - {reportDate}</p>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                    <div className="border border-gray-300 p-3 rounded">
                        <p className="text-xl font-bold">{stats.injectedCount}</p>
                        <p className="text-xs text-gray-500">Toplam Hasta</p>
                    </div>
                    <div className="border border-gray-300 p-3 rounded">
                        <p className="text-xl font-bold">{stats.totalInjected.toFixed(1)} {unit}</p>
                        <p className="text-xs text-gray-500">Toplam Doz</p>
                    </div>
                    <div className="border border-gray-300 p-3 rounded">
                        <p className="text-xl font-bold">{stats.additionalImagingCount}</p>
                        <p className="text-xs text-gray-500">Ek Çekim</p>
                    </div>
                    <div className="border border-gray-300 p-3 rounded">
                        <p className="text-xl font-bold">{stats.efficiency.toFixed(0)}%</p>
                        <p className="text-xs text-gray-500">Verimlilik</p>
                    </div>
                </div>

                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-left">Saat</th>
                            <th className="border border-gray-300 p-2 text-left">Protokol No</th>
                            <th className="border border-gray-300 p-2 text-left">Hasta Adı</th>
                            <th className="border border-gray-300 p-2 text-left">Prosedür</th>
                            <th className="border border-gray-300 p-2 text-center">Ek Çekim</th>
                            <th className="border border-gray-300 p-2 text-right">Doz ({unit})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dailyHistory.map(entry => (
                            <tr key={entry.id}>
                                <td className="border border-gray-300 p-2">{new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="border border-gray-300 p-2">{entry.protocolNo || '-'}</td>
                                <td className="border border-gray-300 p-2">{entry.patientName}</td>
                                <td className="border border-gray-300 p-2">{entry.procedure}</td>
                                <td className="border border-gray-300 p-2 text-center">{entry.additionalInfo?.region || '-'}</td>
                                <td className="border border-gray-300 p-2 text-right">{entry.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 flex justify-between">
                    <span>Oluşturulma: {new Date().toLocaleString('tr-TR')}</span>
                    <span>Nükleer Tıp Asistanı © 2025</span>
                </div>
            </div>
        </section>
    );
};
