import prisma from '@/lib/prisma';
import { SafeDashboardCharts } from '@/components/SafeDashboardCharts';
import { type ChartDataPoint } from '@/components/DashboardCharts';
import {
  format,
  startOfWeek,
  getWeek,
  getYear,
  startOfMonth,
  subWeeks,
  subMonths,
  parseISO,
} from 'date-fns';

export const revalidate = 60;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

export default async function Home() {
  let totalOrders = 0;
  let shippingOrders = 0;
  let totalProducts = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let weeklyData: ChartDataPoint[] = [];
  let monthlyData: ChartDataPoint[] = [];

  try {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    const [ordersCount, shippingCount, productsCount, totalStats, recentDoneOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'SHIPPING' } }),
      prisma.product.count(),
      prisma.$queryRaw<{ totalrevenue: number | null; totalprofit: number | null }[]>`
        SELECT 
          SUM("OrderItem"."salePrice" * "OrderItem"."quantity") as totalrevenue,
          SUM(("OrderItem"."salePrice" - "OrderItem"."basePrice") * "OrderItem"."quantity") as totalprofit
        FROM "OrderItem"
        JOIN "Order" ON "OrderItem"."orderId" = "Order"."id"
        WHERE "Order"."status" = 'DONE'
      `,
      prisma.order.findMany({
        where: { 
          status: 'DONE',
          createdAt: { gte: sixMonthsAgo }
        },
        include: { orderItems: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    totalOrders = ordersCount;
    shippingOrders = shippingCount;
    totalProducts = productsCount;

    if (totalStats && totalStats[0]) {
      totalRevenue = Number(totalStats[0].totalrevenue || 0);
      totalProfit = Number(totalStats[0].totalprofit || 0);
    }

    // --- Build Weekly Data (last 8 weeks) ---
    const weekMap = new Map<string, { cost: number; profit: number }>();
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const key = `${getYear(weekStart)} -W${String(getWeek(weekStart, { weekStartsOn: 1 })).padStart(2, '0')} `;
      weekMap.set(key, { cost: 0, profit: 0 });
    }

    recentDoneOrders.forEach((order) => {
      const weekStart = startOfWeek(new Date(order.createdAt), { weekStartsOn: 1 });
      const key = `${getYear(weekStart)} -W${String(getWeek(weekStart, { weekStartsOn: 1 })).padStart(2, '0')} `;
      if (weekMap.has(key)) {
        const entry = weekMap.get(key)!;
        order.orderItems.forEach((item) => {
          entry.cost += item.basePrice * item.quantity;
          entry.profit += (item.salePrice - item.basePrice) * item.quantity;
        });
      }
    });

    weeklyData = Array.from(weekMap.entries()).map(([key, val]) => ({
      label: key.replace(/^\d{4}-/, ''),
      cost: Math.round(val.cost),
      profit: Math.round(val.profit),
    }));

    // --- Build Monthly Data (last 6 months) ---
    const monthMap = new Map<string, { cost: number; profit: number }>();
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const key = format(monthStart, 'yyyy-MM');
      monthMap.set(key, { cost: 0, profit: 0 });
    }

    recentDoneOrders.forEach((order) => {
      const key = format(new Date(order.createdAt), 'yyyy-MM');
      if (monthMap.has(key)) {
        const entry = monthMap.get(key)!;
        order.orderItems.forEach((item) => {
          entry.cost += item.basePrice * item.quantity;
          entry.profit += (item.salePrice - item.basePrice) * item.quantity;
        });
      }
    });

    monthlyData = Array.from(monthMap.entries()).map(([key, val]) => ({
      label: format(parseISO(`${key}-01`), 'MM/yyyy'),
      cost: Math.round(val.cost),
      profit: Math.round(val.profit),
    }));
  } catch (error) {
    const err = error as Error;
    console.error('Dashboard error:', err);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-800">Tổng Quan</h1>

      {/* Row 1: Order & product counts */}
      <div className="grid gap-4 grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <p className="text-sm font-medium text-slate-500">Tổng Đơn Hàng</p>
          <p className="text-3xl font-bold text-rose-600 mt-1">{totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <p className="text-sm font-medium text-slate-500">Đơn Đang Giao</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{shippingOrders}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <p className="text-sm font-medium text-slate-500">Sản Phẩm</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{totalProducts}</p>
        </div>
      </div>

      {/* Row 2: Revenue & Profit summary */}
      <div className="grid gap-4 grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <p className="text-sm font-medium text-slate-500">Tổng Doanh Thu</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-slate-400 mt-1">Chỉ tính đơn đã hoàn thành</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <p className="text-sm font-medium text-slate-500">Tổng Lợi Nhuận</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalProfit)}</p>
          <p className="text-xs text-slate-400 mt-1">Chỉ tính đơn đã hoàn thành</p>
        </div>
      </div>

      {/* Row 3: Chart */}
      <SafeDashboardCharts weeklyData={weeklyData} monthlyData={monthlyData} />
    </div>
  );
}