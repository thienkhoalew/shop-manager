'use client';

import dynamic from 'next/dynamic';
import type { ChartDataPoint } from './DashboardCharts';

const DashboardChartsClient = dynamic(
    () => import('./DashboardCharts').then((mod) => mod.DashboardCharts),
    {
        ssr: false,
        loading: () => (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[516px] flex items-center justify-center text-slate-400 animate-pulse">
                Đang tải biểu đồ...
            </div>
        ),
    }
);

interface ChartsWrapperProps {
    weeklyData: ChartDataPoint[];
    monthlyData: ChartDataPoint[];
}

export function SafeDashboardCharts(props: ChartsWrapperProps) {
    return <DashboardChartsClient {...props} />;
}
