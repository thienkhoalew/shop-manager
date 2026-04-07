import prisma from '@/lib/prisma';
import { SafeDashboardCharts } from '@/components/SafeDashboardCharts';
import { type ChartDataPoint } from '@/components/DashboardCharts';
import {
  format,
  getWeek,
  getYear,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';

export const dynamic = 'force-dynamic';

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

export default async function Home() {
  let totalOrders = 0;
  let shippingOrders = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let weeklyData: ChartDataPoint[] = [];
  let monthlyData: ChartDataPoint[] = [];

  try {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    const [ordersCount, shippingCount, totalStats, recentDoneOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'SHIPPING' } }),
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
          createdAt: { gte: sixMonthsAgo },
        },
        include: { orderItems: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    totalOrders = ordersCount;
    shippingOrders = shippingCount;

    if (totalStats?.[0]) {
      totalRevenue = Number(totalStats[0].totalrevenue || 0);
      totalProfit = Number(totalStats[0].totalprofit || 0);
    }

    const weekMap = new Map<string, { cost: number; profit: number }>();
    for (let i = 7; i >= 0; i -= 1) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const key = `${getYear(weekStart)}-W${String(getWeek(weekStart, { weekStartsOn: 1 })).padStart(2, '0')}`;
      weekMap.set(key, { cost: 0, profit: 0 });
    }

    recentDoneOrders.forEach((order) => {
      const weekStart = startOfWeek(new Date(order.createdAt), { weekStartsOn: 1 });
      const key = `${getYear(weekStart)}-W${String(getWeek(weekStart, { weekStartsOn: 1 })).padStart(2, '0')}`;

      if (!weekMap.has(key)) return;

      const entry = weekMap.get(key)!;
      order.orderItems.forEach((item) => {
        entry.cost += item.basePrice * item.quantity;
        entry.profit += (item.salePrice - item.basePrice) * item.quantity;
      });
    });

    weeklyData = Array.from(weekMap.entries()).map(([key, val]) => ({
      label: key.replace(/^\d{4}-/, ''),
      cost: Math.round(val.cost),
      profit: Math.round(val.profit),
    }));

    const monthMap = new Map<string, { cost: number; profit: number }>();
    for (let i = 5; i >= 0; i -= 1) {
      const monthStart = startOfMonth(subMonths(now, i));
      const key = format(monthStart, 'yyyy-MM');
      monthMap.set(key, { cost: 0, profit: 0 });
    }

    recentDoneOrders.forEach((order) => {
      const key = format(new Date(order.createdAt), 'yyyy-MM');

      if (!monthMap.has(key)) return;

      const entry = monthMap.get(key)!;
      order.orderItems.forEach((item) => {
        entry.cost += item.basePrice * item.quantity;
        entry.profit += (item.salePrice - item.basePrice) * item.quantity;
      });
    });

    monthlyData = Array.from(monthMap.entries()).map(([key, val]) => ({
      label: format(parseISO(`${key}-01`), 'MM/yyyy'),
      cost: Math.round(val.cost),
      profit: Math.round(val.profit),
    }));
  } catch (error) {
    console.error('Dashboard error:', error);
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="stat-tile p-5">
          <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">{totalOrders}</p>
        </div>
        <div className="stat-tile p-5">
          <p className="text-sm text-muted-foreground">Đơn đang giao</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">{shippingOrders}</p>
        </div>
        <div className="stat-tile p-5">
          <p className="text-sm text-muted-foreground">Doanh thu đã chốt</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-primary">{formatCurrency(totalRevenue)}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="surface-panel p-5 sm:p-6">
          <p className="eyebrow">Doanh thu</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-primary sm:text-3xl">
            {formatCurrency(totalRevenue)}
          </p>
        </div>

        <div className="surface-panel p-5 sm:p-6">
          <p className="eyebrow">Lợi nhuận</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl">
            {formatCurrency(totalProfit)}
          </p>
        </div>
      </section>

      <SafeDashboardCharts weeklyData={weeklyData} monthlyData={monthlyData} />
    </div>
  );
}
