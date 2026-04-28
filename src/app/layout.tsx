import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PublicChrome } from "@/components/layout/PublicChrome";
import { SitePopup } from "@/components/layout/SitePopup";
import { getSitePopupSettings } from "@/features/admin/actions/site-content.action";

export const metadata: Metadata = {
  title: "CELESVERSE",
  description: "探索身心靈成長課程，開啟你的內在旅程",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const popupSettings = await getSitePopupSettings();

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
        <PublicChrome>
          <SitePopup settings={popupSettings} />
        </PublicChrome>
      </body>
    </html>
  );
}
