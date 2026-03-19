'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart } from 'lucide-react';

const navItems = [
  { name: 'Tổng quan', shortName: 'Tổng quan', href: '/', icon: LayoutDashboard },
  { name: 'Đơn hàng', shortName: 'Đơn hàng', href: '/orders', icon: ShoppingCart },
  { name: 'Sản phẩm', shortName: 'Sản phẩm', href: '/products', icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sticky top-0 hidden h-[100dvh] w-[280px] shrink-0 px-5 py-6 md:block">
        <div className="surface-soft flex h-full flex-col px-4 py-4">
          <div className="border-b border-border/70 px-3 pb-5 pt-2">
            <p className="eyebrow">Rim Cung Shop</p>
            <h1 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.06em] text-foreground">
              Shop Manager
            </h1>
            <p className="mt-2 max-w-[18ch] text-sm leading-6 text-muted-foreground">
              Quản lý đơn và sản phẩm với nhịp hiển thị sáng, gọn, dễ nhìn mỗi ngày.
            </p>
          </div>

          <nav className="flex-1 space-y-2 px-2 py-6">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'group flex items-center gap-3 rounded-[1.35rem] px-4 py-3 text-sm transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-[0_16px_30px_-18px_rgba(190,95,118,0.6)]'
                      : 'text-slate-600 hover:bg-white/80 hover:text-foreground',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex size-10 items-center justify-center rounded-2xl border transition-colors',
                      isActive
                        ? 'border-white/25 bg-white/14'
                        : 'border-border/70 bg-white/72 text-primary/70 group-hover:bg-primary/8',
                    ].join(' ')}
                  >
                    <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.85} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className={isActive ? 'text-primary-foreground/70' : 'text-xs text-muted-foreground'}>
                      {item.href === '/' ? 'Nhịp kinh doanh hôm nay' : item.href === '/orders' ? 'Theo dõi khách và vận đơn' : 'Quản lý danh mục bán hàng'}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[1.5rem] border border-border/70 bg-white/70 px-4 py-4 text-sm text-slate-600">
            <p className="font-medium text-foreground">Ưu tiên iPhone</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              Điều hướng và khoảng chạm đã được tối ưu cho thao tác một tay.
            </p>
          </div>
        </div>
      </aside>

      <div className="md:hidden">
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-28 bg-gradient-to-t from-[#fff7fa] via-[#fff7fa]/92 to-transparent" />
        <nav className="mobile-safe-pb fixed inset-x-0 bottom-0 z-50 px-3">
          <div className="mx-auto mb-2 flex max-w-md items-center justify-between gap-2 rounded-[1.75rem] border border-white/70 bg-white/88 px-2 py-2 shadow-[0_18px_40px_-22px_rgba(160,85,105,0.34)] backdrop-blur-md">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex min-w-0 flex-1 flex-col items-center justify-center rounded-[1.15rem] px-2 py-2.5 text-center transition-all duration-200 active:scale-[0.98]',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-[0_14px_24px_-18px_rgba(185,91,115,0.7)]'
                      : 'text-slate-500 hover:bg-primary/6 hover:text-foreground',
                  ].join(' ')}
                >
                  <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
                  <span className="mt-1 truncate text-[0.68rem] font-medium tracking-[0.01em]">
                    {item.shortName}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
