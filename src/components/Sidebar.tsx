'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Khách & Đơn Hàng', href: '/orders', icon: ShoppingCart },
  { name: 'Sản Phẩm', href: '/products', icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className="hidden md:flex h-screen w-64 flex-col bg-white text-slate-900 border-r border-rose-100/50"
        suppressHydrationWarning
      >
        <div
          className="flex h-16 flex-shrink-0 items-center px-6 text-xl font-bold tracking-tight text-rose-600"
          suppressHydrationWarning
        >
          Shop Manager
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-rose-50 text-rose-800' : 'text-slate-600 hover:bg-rose-50/50 hover:text-rose-700'
                  }`}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Shop Manager
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-rose-50 border-t border-rose-100 shadow-[0_-2px_10px_rgba(255,228,230,0.5)] pb-safe-area">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-rose-600' : 'text-rose-400 hover:text-rose-600'
                  }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'fill-rose-100' : ''}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
