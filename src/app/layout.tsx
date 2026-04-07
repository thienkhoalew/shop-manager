import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-sans",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Rim Cưng Shop",
  description: "Quản lý đơn hàng và sản phẩm cho Rim Cưng Shop",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rim Cưng Shop",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ee7b29",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${beVietnamPro.variable} ${geistMono.variable} min-h-[100dvh] bg-background font-sans text-foreground antialiased`}
        suppressHydrationWarning
      >
        <div className="relative flex min-h-[100dvh] overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,203,118,0.2),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(255,158,96,0.12),transparent_28%)]" />
          <Sidebar />
          <main className="min-h-[100dvh] flex-1 overflow-y-auto pb-28 md:pb-0">
            <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1480px] flex-col px-4 pb-10 pt-4 sm:px-5 md:px-8 md:pt-8">
              {children}
            </div>
          </main>
          <Toaster closeButton position="top-right" richColors />
        </div>
      </body>
    </html>
  );
}
