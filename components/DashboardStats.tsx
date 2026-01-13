
import React from 'react';
import { DoseUnit } from '../types';

interface DashboardStatsProps {
    stats: {
        preparedCount: number;
        injectedCount: number;
        totalInjected: number;
    };
    unit: DoseUnit;
    setUnit: (unit: DoseUnit) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
    stats,
    unit,
    setUnit
}) => {
    return (
        <section className="grid grid-cols-3 gap-3 pt-6 border-t border-white/5">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Bekleyen</p>
                <p className="text-xl font-black text-amber-500">{stats.preparedCount}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Uygulanan</p>
                <p className="text-xl font-black text-emerald-500">{stats.injectedCount}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center flex flex-col justify-between">
                <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10 mb-1">
                    <button onClick={() => setUnit(DoseUnit.MCI)} className={`flex-1 text-[7px] font-black rounded py-0.5 ${unit === DoseUnit.MCI ? 'bg-white text-black' : 'text-slate-500'}`}>mCi</button>
                    <button onClick={() => setUnit(DoseUnit.MBQ)} className={`flex-1 text-[7px] font-black rounded py-0.5 ${unit === DoseUnit.MBQ ? 'bg-white text-black' : 'text-slate-500'}`}>MBq</button>
                </div>
                <p className="text-[10px] font-black text-blue-500 leading-none">{stats.totalInjected.toFixed(1)} <span className="text-[7px]">{unit}</span></p>
            </div>
        </section>
    );
};
