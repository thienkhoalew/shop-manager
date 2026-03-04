import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let totalOrders = 0;
  let shippingOrders = 0;
  let totalProducts = 0;
  let errorMsg: string | null = null;

  try {
    const results = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'SHIPPING' } }),
      prisma.product.count(),
    ]);
    totalOrders = results[0];
    shippingOrders = results[1];
    totalProducts = results[2];
  } catch (error) {
    const err = error as Error;
    errorMsg = err?.message || String(error);
  }

  if (errorMsg) {
    return (
      <div className="p-10 space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Database Connection Error</h1>
        <p className="text-slate-700 whitespace-pre-wrap">{errorMsg}</p>
        <p className="text-slate-500 text-sm mt-4">
          Gợi ý: Nếu bạn vừa đổi DATABASE_URL sang cổng 6543, hãy kiểm tra lại cấu hình. Hoặc
          thử dùng chuỗi dạng sslmode=require thay vì pgbouncer=true.
        </p>
      </div>
    );
  }

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