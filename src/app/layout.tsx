import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "sonner";

const geistSans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Rim Cưng Shop",
  description: "Rim Cưng Shop",
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
  themeColor: "#e11d48", // rose-600
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-[100dvh] bg-background font-sans text-foreground antialiased`}
        suppressHydrationWarning
      >
        <div className="relative flex min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,rgba(255,236,242,0.9),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,244,247,0.95),transparent_24%),linear-gradient(180deg,#fffdfd_0%,#fff8fa_100%)]">
          <Sidebar />
          <main className="min-h-[100dvh] flex-1 overflow-y-auto pb-28 md:pb-0">
            <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1400px] flex-col px-4 pb-10 pt-4 sm:px-5 md:px-8 md:pt-8">
              {children}
            </div>
          </main>
          <Toaster closeButton position="top-right" richColors />
        </div>
      </body>
    </html>
  );
}
