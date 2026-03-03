import prisma from '@/lib/prisma';

export default async function Home() {
  const [totalOrders, shippingOrders, totalProducts] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'SHIPPING' } }),
    prisma.product.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-800">Tổng Quan</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500">Tổng Đơn Hàng</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold text-rose-600">{totalOrders}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500">Đơn Đang Giao</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold text-amber-500">{shippingOrders}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500">Sản Phẩm</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold text-emerald-600">{totalProducts}</div>
          </div>
        </div>
      </div>
    </div>
  );
}