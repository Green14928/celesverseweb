import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PublicChrome } from "@/components/layout/PublicChrome";

export const metadata: Metadata = {
  title: "CELESVERSE",
  description: "探索身心靈成長課程，開啟你的內在旅程",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PublicChrome>
          <Header />
        </PublicChrome>
        <main className="flex-1">{children}</main>
        <PublicChrome>
          <Footer />
        </PublicChrome>
      </body>
    </html>
  );
}
