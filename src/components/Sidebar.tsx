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
        <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-sidebar-border/70 bg-[linear-gradient(180deg,rgba(39,50,76,0.98),rgba(29,40,64,0.98))] px-4 py-4 text-sidebar-foreground shadow-[0_28px_70px_-40px_rgba(15,23,42,0.7)]">
          <div className="border-b border-white/10 px-3 pb-5 pt-2">
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sidebar-primary">
              Rim Cưng Shop
            </p>
            <h1 className="mt-4 text-[1.9rem] font-semibold tracking-[-0.07em] text-white">
              Shop Manager
            </h1>
            <p className="mt-3 max-w-[19ch] text-sm leading-6 text-white/68">
              Theo dõi đơn, sản phẩm và nhịp bán hàng với giao diện sáng rõ, dễ quét thông tin.
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
                    'group flex items-center gap-3 rounded-[1.35rem] border px-4 py-3 text-sm transition-all duration-200',
                    isActive
                      ? 'border-white/10 bg-[linear-gradient(135deg,rgba(220,88,141,0.97),rgba(196,65,121,0.93))] text-primary-foreground shadow-[0_18px_32px_-18px_rgba(207,74,128,0.6)]'
                      : 'border-transparent text-white/72 hover:border-white/10 hover:bg-white/6 hover:text-white',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex size-10 items-center justify-center rounded-2xl border transition-colors',
                      isActive
                        ? 'border-white/18 bg-white/14'
                        : 'border-white/12 bg-white/8 text-sidebar-primary group-hover:bg-white/12',
                    ].join(' ')}
                  >
                    <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.85} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className={isActive ? 'text-primary-foreground/72' : 'text-xs text-white/45'}>
                      {item.href === '/'
                        ? 'Doanh thu và hiệu suất hôm nay'
                        : item.href === '/orders'
                          ? 'Theo dõi khách, cọc và vận đơn'
                          : 'Quản lý danh mục bán hàng'}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/78">
            <p className="font-medium text-white">Tối ưu mobile</p>
            <p className="mt-1 leading-6 text-white/58">
              Thanh điều hướng và vùng chạm đã được giữ rộng để thao tác một tay trên iPhone dễ hơn.
            </p>
          </div>
        </div>
      </aside>

      <div className="md:hidden">
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-28 bg-gradient-to-t from-[#fcf4f8] via-[#fcf4f8]/92 to-transparent" />
        <nav className="mobile-safe-pb fixed inset-x-0 bottom-0 z-50 px-3">
          <div className="mx-auto mb-2 flex max-w-md items-center justify-between gap-2 rounded-[1.75rem] border border-white/80 bg-[rgba(35,47,71,0.92)] px-2 py-2 shadow-[0_18px_40px_-22px_rgba(32,40,61,0.48)] backdrop-blur-md">
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
                      ? 'bg-[linear-gradient(135deg,rgba(220,88,141,0.98),rgba(196,65,121,0.96))] text-primary-foreground shadow-[0_14px_24px_-18px_rgba(207,74,128,0.7)]'
                      : 'text-white/62 hover:bg-white/8 hover:text-white',
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
