import React, { useState, useMemo } from 'react';
import { DoseLogEntry, DoseUnit, StaffUser } from '../types';

interface RadiationSafetyPanelProps {
    history: DoseLogEntry[];
    unit: DoseUnit;
    now: Date;
    staffUsers: StaffUser[];
    onClose: () => void;
}

// Türkiye'deki yıllık doz limitleri (mSv)
const DOSE_LIMITS = {
    ANNUAL_LIMIT: 20, // mSv/yıl - kategori A çalışanlar
    QUARTERLY_LIMIT: 5, // mSv/3 ay
    MONTHLY_LIMIT: 1.67, // mSv/ay (yaklaşık)
    WEEKLY_LIMIT: 0.4, // mSv/hafta (yaklaşık)
    DAILY_LIMIT: 0.08, // mSv/gün (yaklaşık)
};

// mCi -> mSv dönüşüm faktörü (yaklaşık, işlem tipine göre değişir)
const EXPOSURE_FACTOR = 0.001; // Basitleştirilmiş faktör

export const RadiationSafetyPanel: React.FC<RadiationSafetyPanelProps> = ({
    history,
    unit,
    now,
    staffUsers,
    onClose
}) => {
    const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

    // Personel bazlı maruz kalım hesapla
    const staffExposure = useMemo(() => {
        const exposureData: Record<string, {
            user: StaffUser;
            totalDoses: number;
            estimatedExposure: number;
            procedures: number;
        }> = {};

        // Tarih aralığını belirle
        const periodStart = new Date(now);
        if (selectedPeriod === 'daily') {
            periodStart.setHours(0, 0, 0, 0);
        } else if (selectedPeriod === 'weekly') {
            periodStart.setDate(now.getDate() - 7);
        } else {
            periodStart.setMonth(now.getMonth() - 1);
        }

        // Geçmişteki dozları filtrele ve hesapla
        history
            .filter(h => new Date(h.timestamp) >= periodStart)
            .forEach(entry => {
                if (entry.preparedBy) {
                    const id = entry.preparedBy.id;
                    if (!exposureData[id]) {
                        exposureData[id] = {
                            user: entry.preparedBy,
                            totalDoses: 0,
                            estimatedExposure: 0,
                            procedures: 0
                        };
                    }
                    exposureData[id].totalDoses += entry.amount;
                    exposureData[id].estimatedExposure += entry.amount * EXPOSURE_FACTOR;
                    exposureData[id].procedures++;
                }
            });

        return Object.values(exposureData).sort((a, b) => b.estimatedExposure - a.estimatedExposure);
    }, [history, now, selectedPeriod]);

    // Limit kontrolü
    const getLimit = () => {
        switch (selectedPeriod) {
            case 'daily': return DOSE_LIMITS.DAILY_LIMIT;
            case 'weekly': return DOSE_LIMITS.WEEKLY_LIMIT;
            case 'monthly': return DOSE_LIMITS.MONTHLY_LIMIT;
            default: return DOSE_LIMITS.WEEKLY_LIMIT;
        }
    };

    // Genel istatistikler
    const stats = useMemo(() => {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);

        const todayEntries = history.filter(h => new Date(h.timestamp) >= todayStart);
        const weekEntries = history.filter(h => new Date(h.timestamp) >= weekAgo);

        return {
            todayDoses: todayEntries.length,
            todayActivity: todayEntries.reduce((sum, h) => sum + h.amount, 0),
            weekDoses: weekEntries.length,
            weekActivity: weekEntries.reduce((sum, h) => sum + h.amount, 0)
        };
    }, [history, now]);

    const limit = getLimit();
    const periodLabel = selectedPeriod === 'daily' ? 'Günlük' : selectedPeriod === 'weekly' ? 'Haftalık' : 'Aylık';

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center animate-glow-orange">
                            <span className="text-3xl">☢️</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Radyasyon Güvenliği</h2>
                            <p className="text-xs text-slate-500">Personel Maruz Kalım Takibi ve Doz Limitleri</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Period selector */}
                        <div className="flex bg-slate-800/50 rounded-xl p-1">
                            {(['daily', 'weekly', 'monthly'] as const).map(period => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedPeriod === period
                                            ? 'bg-yellow-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {period === 'daily' ? 'Günlük' : period === 'weekly' ? 'Haftalık' : 'Aylık'}
                                </button>
                            ))}
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
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5 space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center card-hover">
                            <p className="text-3xl font-black text-blue-400">{stats.todayDoses}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Bugün Doz</p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center card-hover">
                            <p className="text-3xl font-black text-emerald-400">{stats.todayActivity.toFixed(1)}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Bugün {unit}</p>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center card-hover">
                            <p className="text-3xl font-black text-purple-400">{stats.weekDoses}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Hafta Doz</p>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center card-hover">
                            <p className="text-3xl font-black text-amber-400">{stats.weekActivity.toFixed(1)}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Hafta {unit}</p>
                        </div>
                    </div>

                    {/* Dose Limits Info */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h4 className="text-sm font-black text-yellow-400">Doz Limitleri (TAEK Yönetmeliği)</h4>
                                <p className="text-xs text-slate-400 mt-1">
                                    Yıllık: <span className="text-yellow-300 font-bold">{DOSE_LIMITS.ANNUAL_LIMIT} mSv</span> |
                                    Haftalık: <span className="text-yellow-300 font-bold">{DOSE_LIMITS.WEEKLY_LIMIT.toFixed(2)} mSv</span> |
                                    Günlük: <span className="text-yellow-300 font-bold">{DOSE_LIMITS.DAILY_LIMIT.toFixed(3)} mSv</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Staff Exposure Table */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-700/50">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <span>👥</span> Personel Maruz Kalım Tablosu
                                <span className="text-xs text-slate-500">({periodLabel})</span>
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-800/50">
                                        <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase">Personel</th>
                                        <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase">Rol</th>
                                        <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 uppercase">İşlem Sayısı</th>
                                        <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 uppercase">Toplam {unit}</th>
                                        <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 uppercase">Tahmini Maruz Kalım</th>
                                        <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 uppercase">Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffExposure.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-slate-500">
                                                Bu dönemde kayıt bulunamadı
                                            </td>
                                        </tr>
                                    ) : (
                                        staffExposure.map((staff, idx) => {
                                            const percentage = (staff.estimatedExposure / limit) * 100;
                                            const isWarning = percentage >= 70;
                                            const isCritical = percentage >= 90;

                                            return (
                                                <tr key={staff.user.id} className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-8 h-8 rounded-lg ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                                                                } flex items-center justify-center text-white text-sm font-bold`}>
                                                                {staff.user.name.charAt(0)}
                                                            </div>
                                                            <span className="text-white font-bold">{staff.user.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-400 capitalize">{staff.user.role}</td>
                                                    <td className="py-3 px-4 text-center text-purple-400 font-bold">{staff.procedures}</td>
                                                    <td className="py-3 px-4 text-center text-blue-400 font-bold">{staff.totalDoses.toFixed(1)}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                                                                }`}>
                                                                {staff.estimatedExposure.toFixed(4)} mSv
                                                            </span>
                                                            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                                                                        }`}
                                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[9px] text-slate-500">{percentage.toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${isCritical
                                                                ? 'bg-red-500/20 text-red-400 animate-pulse'
                                                                : isWarning
                                                                    ? 'bg-amber-500/20 text-amber-400'
                                                                    : 'bg-emerald-500/20 text-emerald-400'
                                                            }`}>
                                                            {isCritical ? '⚠️ KRİTİK' : isWarning ? '⚡ DİKKAT' : '✓ NORMAL'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Safety Tips */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                                <span>🛡️</span> Korunma Önlemleri
                            </h4>
                            <ul className="text-xs text-slate-400 space-y-1">
                                <li>• Kurşun önlük ve eldiven kullanın</li>
                                <li>• Kaynaktan uzak mesafede çalışın</li>
                                <li>• İşlem süresini minimize edin</li>
                                <li>• TLD/Dozimetre taşıyın</li>
                            </ul>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                                <span>📋</span> Düzenli Kontroller
                            </h4>
                            <ul className="text-xs text-slate-400 space-y-1">
                                <li>• Aylık dozimetre okuması</li>
                                <li>• Yıllık sağlık muayenesi</li>
                                <li>• Radyasyon güvenliği eğitimi</li>
                                <li>• Ekipman kalibrasyon kontrolü</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50 flex justify-between items-center bg-slate-800/30">
                    <p className="text-xs text-slate-500">
                        💡 Bu veriler tahmini hesaplamalara dayanmaktadır. Kesin değerler için dozimetre ölçümleri kullanılmalıdır.
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

export default RadiationSafetyPanel;
