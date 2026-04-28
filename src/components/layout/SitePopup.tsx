"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SitePopupSettings } from "@/features/admin/actions/site-content.action";

export function SitePopup({ settings }: { settings: SitePopupSettings }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const storageKey = [
    "celesverse-site-popup",
    settings.updatedAt ?? "default",
    settings.title,
    settings.body,
    settings.qrImageUrl ?? "",
    settings.lineUrl ?? "",
  ].join(":");

  useEffect(() => {
    if (!settings.enabled || pathname?.startsWith("/admin")) return;

    if (sessionStorage.getItem(storageKey)) return;

    const timer = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, [pathname, settings.enabled, storageKey]);

  function close() {
    sessionStorage.setItem(storageKey, "closed");
    setOpen(false);
  }

  if (!open || !settings.enabled) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/35 px-5 py-8 backdrop-blur-sm">
      <div
        className={`relative grid w-full ${settings.qrImageUrl ? "max-w-3xl md:grid-cols-[1fr_280px]" : "max-w-xl"} overflow-hidden bg-background shadow-2xl`}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center border border-border bg-background/85 text-sm text-muted-fg transition-colors hover:text-foreground"
          aria-label="關閉彈跳視窗"
        >
          ✕
        </button>

        <div className="px-7 py-10 md:px-10 md:py-12">
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-fg font-sans">
            Celesverse Notice
          </p>
          {settings.title && (
            <h2 className="mt-4 text-3xl font-serif font-light leading-tight text-foreground md:text-4xl">
              {settings.title}
            </h2>
          )}
          {settings.body && (
            <div className="mt-6 whitespace-pre-wrap text-sm font-light leading-[2] text-muted-fg md:text-base">
              {settings.body}
            </div>
          )}
          {settings.lineUrl && (
            <a
              href={settings.lineUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-block border border-border px-8 py-3 text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-mist font-sans"
            >
              查看活動
            </a>
          )}
        </div>

        {settings.qrImageUrl && (
          <div className="flex flex-col items-center justify-center bg-mist/60 px-8 py-10">
            <div className="relative h-56 w-full overflow-hidden bg-white shadow-soft">
              <Image
                src={settings.qrImageUrl}
                alt="彈跳視窗圖片"
                fill
                sizes="176px"
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
