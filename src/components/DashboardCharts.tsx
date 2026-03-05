'use client';

import { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

export type ChartDataPoint = {
    label: string;
    cost: number;
    profit: number;
};

interface DashboardChartsProps {
    weeklyData: ChartDataPoint[];
    monthlyData: ChartDataPoint[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(value);
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        dataKey: string | number;
        value: number;
    }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const cost = payload.find((p) => p.dataKey === 'cost')?.value || 0;
        const profit = payload.find((p) => p.dataKey === 'profit')?.value || 0;
        const revenue = cost + profit;

        return (
            <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
                <p className="font-semibold text-slate-800 mb-2">{label}</p>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4 text-blue-600">
                        <span>Tiền vốn:</span>
                        <span className="font-medium">{formatCurrency(cost)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-emerald-600">
                        <span>Tiền lời:</span>
                        <span className="font-medium">{formatCurrency(profit)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-slate-800 font-bold border-t border-slate-100 pt-1 mt-1">
                        <span>Doanh thu:</span>
                        <span>{formatCurrency(revenue)}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function DashboardCharts({ weeklyData, monthlyData }: DashboardChartsProps) {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    const data = viewMode === 'week' ? weeklyData : monthlyData;

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Biểu Đồ Doanh Thu & Lợi Nhuận</h3>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'week'
                            ? 'bg-white text-rose-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        onClick={() => setViewMode('week')}
                    >
                        Theo Tuần
                    </button>
                    <button
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'month'
                            ? 'bg-white text-rose-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        onClick={() => setViewMode('month')}
                    >
                        Theo Tháng
                    </button>
                </div>
            </div>

            <div className="h-[400px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={40}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickFormatter={(value) => {
                                if (value === 0) return '0';
                                return `${(value / 1000000).toFixed(1)}M`;
                            }}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            iconType="circle"
                            formatter={(value) => {
                                return <span className="text-sm font-medium text-slate-700 ml-1">{value === 'cost' ? 'Tiền vốn' : 'Tiền lời'}</span>;
                            }}
                        />
                        <Bar dataKey="cost" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="profit" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
