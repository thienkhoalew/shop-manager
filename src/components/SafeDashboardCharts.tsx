'use client';

import dynamic from 'next/dynamic';
import type { ChartDataPoint } from './DashboardCharts';

const DashboardChartsClient = dynamic(
  () => import('./DashboardCharts').then((mod) => mod.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="surface-panel flex h-[520px] items-center justify-center p-6 text-sm text-muted-foreground animate-pulse">
        Đang tải biểu đồ...
      </div>
    ),
  },
);

interface ChartsWrapperProps {
  weeklyData: ChartDataPoint[];
  monthlyData: ChartDataPoint[];
}

export function SafeDashboardCharts(props: ChartsWrapperProps) {
  return <DashboardChartsClient {...props} />;
}
