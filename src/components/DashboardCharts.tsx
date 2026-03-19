'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
    maximumFractionDigits: 0,
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
      <div className="rounded-[1.35rem] border border-white/70 bg-white/96 p-4 shadow-[0_22px_55px_-34px_rgba(112,61,76,0.42)]">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-5 text-slate-600">
            <span>Tiền vốn</span>
            <span className="font-medium text-slate-800">{formatCurrency(cost)}</span>
          </div>
          <div className="flex justify-between gap-5 text-primary">
            <span>Tiền lời</span>
            <span className="font-medium">{formatCurrency(profit)}</span>
          </div>
          <div className="mt-3 flex justify-between gap-5 border-t border-border/70 pt-3 font-semibold text-foreground">
            <span>Doanh thu</span>
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
    <section className="surface-panel overflow-hidden p-5 sm:p-6 md:p-7">
      <div className="flex flex-col gap-5 border-b border-border/70 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Biểu đồ lợi nhuận</p>

        </div>

        <div className="inline-flex w-fit rounded-full border border-border/70 bg-secondary/80 p-1">
          <button
            className={[
              'rounded-full px-4 py-2 text-sm font-medium transition-all',
              viewMode === 'week'
                ? 'bg-white text-primary shadow-[0_10px_24px_-18px_rgba(156,80,100,0.55)]'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
            onClick={() => setViewMode('week')}
          >
            Theo tuần
          </button>
          <button
            className={[
              'rounded-full px-4 py-2 text-sm font-medium transition-all',
              viewMode === 'month'
                ? 'bg-white text-primary shadow-[0_10px_24px_-18px_rgba(156,80,100,0.55)]'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
            onClick={() => setViewMode('month')}
          >
            Theo tháng
          </button>
        </div>
      </div>

      <div className="mt-6 h-[380px] w-full min-w-0 sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 4 }} barSize={30}>
            <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="#ead8de" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#7c6870', fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#7c6870', fontSize: 11 }}
              tickFormatter={(value) => {
                if (value === 0) return '0';
                return `${(value / 1000000).toFixed(1)}M`;
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fff1f5' }} />
            <Legend
              verticalAlign="top"
              align="left"
              iconType="circle"
              height={28}
              formatter={(value) => (
                <span className="ml-1 text-sm font-medium text-slate-700">
                  {value === 'cost' ? 'Tiền vốn' : 'Tiền lời'}
                </span>
              )}
            />
            <Bar dataKey="cost" stackId="a" fill="#d5b1ba" radius={[0, 0, 10, 10]} />
            <Bar dataKey="profit" stackId="a" fill="#be5c72" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
