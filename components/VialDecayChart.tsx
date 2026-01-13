
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Vial, Isotope } from '../types';
import { calculateDecay } from '../utils/physics';

interface VialDecayChartProps {
    vial: Vial;
    isotope: Isotope;
}

export const VialDecayChart: React.FC<VialDecayChartProps> = ({ vial, isotope }) => {
    const data = useMemo(() => {
        const points = [];
        const totalDuration = isotope.halfLifeHours * 4; // Show 4 half-lives
        const steps = 20;

        for (let i = 0; i <= steps; i++) {
            const hours = (totalDuration / steps) * i;
            const activity = calculateDecay(vial.initialAmount, isotope.halfLifeHours, hours);
            points.push({
                time: `${Math.round(hours)}sa`,
                activity: parseFloat(activity.toFixed(2))
            });
        }
        return points;
    }, [vial, isotope]);

    return (
        <div className="h-40 w-full bg-black/20 rounded-2xl p-2 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#64748b"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', fontSize: '10px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="activity"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
