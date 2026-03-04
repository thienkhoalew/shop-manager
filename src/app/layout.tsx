import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

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
    <html lang="en">
      <body
        className={`${inter.className} flex h-screen bg-[#fdfbfb] antialiased`}
      >
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">
          <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            {children}
          </div>
        </main>
        <Toaster closeButton position="top-right" richColors />
      </body>
    </html>
  );
}
