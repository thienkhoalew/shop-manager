import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Shop Manager",
  description: "Shop Management Application",
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
