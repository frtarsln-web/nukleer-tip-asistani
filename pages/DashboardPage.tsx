import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore, usePatientStore, useInventoryStore } from '../stores';
import { DashboardStats } from '../components/DashboardStats';
import { ISOTOPES } from '../constants';
import { getVialCurrentActivity } from '../utils/physics';
import { DoseStatus } from '../types';

const DashboardPage: React.FC = () => {
    const { currentUser } = useAuthStore();
    const { history, patientsInRooms, patientsInImaging, pendingPatients } = usePatientStore();
    const { vials, selectedIsotope, unit } = useInventoryStore();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Calculate current stock
    const currentTotalActivity = useMemo(() => {
        return vials.reduce((sum, vial) => {
            const activity = getVialCurrentActivity(vial, selectedIsotope.halfLifeHours, now);
            return activity >= 0.1 ? sum + activity : sum;
        }, 0);
    }, [vials, selectedIsotope.halfLifeHours, now]);

    // Today's stats
    const todayStats = useMemo(() => {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const todayHistory = history.filter(h => new Date(h.timestamp) >= todayStart);
        const completed = todayHistory.filter(h => h.status === DoseStatus.INJECTED);

        return {
            total: todayHistory.length,
            completed: completed.length,
            pending: Object.keys(patientsInRooms).length,
            imaging: Object.keys(patientsInImaging).length,
        };
    }, [history, patientsInRooms, patientsInImaging, now]);

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-purple-900/40 to-slate-900/40 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white">
                            Hoş Geldiniz, {currentUser?.name || 'Kullanıcı'}!
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            {now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-white tabular-nums">
                            {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                            {selectedIsotope.symbol} Aktif
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-4 md:p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">👥</div>
                        <div>
                            <p className="text-3xl font-black text-blue-400 tabular-nums">{todayStats.total}</p>
                            <p className="text-[10px] text-blue-300/70 font-bold uppercase">Bugünkü Hasta</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-4 md:p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">✅</div>
                        <div>
                            <p className="text-3xl font-black text-emerald-400 tabular-nums">{todayStats.completed}</p>
                            <p className="text-[10px] text-emerald-300/70 font-bold uppercase">Tamamlanan</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-4 md:p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">⏳</div>
                        <div>
                            <p className="text-3xl font-black text-amber-400 tabular-nums">{todayStats.pending}</p>
                            <p className="text-[10px] text-amber-300/70 font-bold uppercase">Odada Bekleyen</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-4 md:p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">📸</div>
                        <div>
                            <p className="text-3xl font-black text-purple-400 tabular-nums">{todayStats.imaging}</p>
                            <p className="text-[10px] text-purple-300/70 font-bold uppercase">Çekimde</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Overview */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                    <span>💉</span> Stok Durumu
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ISOTOPES.slice(0, 3).map((isotope) => {
                        const isActive = isotope.id === selectedIsotope.id;
                        return (
                            <div
                                key={isotope.id}
                                className={`rounded-xl p-4 border transition-all ${isActive
                                    ? 'bg-purple-500/20 border-purple-500/40'
                                    : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl">{isotope.symbol}</span>
                                    {isActive && (
                                        <span className="px-2 py-0.5 bg-purple-500 rounded-full text-[9px] font-bold uppercase">
                                            Aktif
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-white">{isotope.name}</p>
                                <p className="text-xs text-slate-500">T½: {isotope.halfLifeHours}h</p>
                                {isActive && (
                                    <p className="text-lg font-black text-purple-400 mt-2 tabular-nums">
                                        {currentTotalActivity.toFixed(2)} {unit}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                    <span>📋</span> Son İşlemler
                </h2>

                {history.length > 0 ? (
                    <div className="space-y-2">
                        {history.slice(0, 5).map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between bg-slate-800/30 rounded-xl p-3 border border-slate-700/30"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${entry.status === DoseStatus.INJECTED ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                        }`}>
                                        {entry.status === DoseStatus.INJECTED ? '✓' : '⏳'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{entry.patientName}</p>
                                        <p className="text-[10px] text-slate-500">{entry.procedure}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-300 tabular-nums">{entry.amount.toFixed(2)} {entry.unit}</p>
                                    <p className="text-[10px] text-slate-500">
                                        {new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <p className="text-4xl mb-2">📭</p>
                        <p className="text-sm font-bold">Henüz işlem yok</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
