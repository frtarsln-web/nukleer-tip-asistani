
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DoseLogEntry } from '../types';

interface ProceduresChartProps {
    history: DoseLogEntry[];
}

export const ProceduresChart: React.FC<ProceduresChartProps> = ({ history }) => {
    const data = useMemo(() => {
        const counts: Record<string, number> = {};
        history.forEach(entry => {
            counts[entry.procedure] = (counts[entry.procedure] || 0) + 1;
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [history]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    return (
        <div className="h-48 w-full bg-slate-900/40 rounded-3xl p-4 border border-white/5">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">PROSEDÜR DAĞILIMI</h4>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#64748b"
                            fontSize={8}
                            width={80}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: '#ffffff05' }}
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', fontSize: '10px' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-[9px] text-slate-700 italic">Henüz veri yok</div>
            )}
        </div>
    );
};
