"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

const CONTACT = {
  phone: "0989287886",
  email: "support@celesverse.co",
  website: "https://celesverse.co/",
  address: "台北市信義區松德路 28 號 8 樓",
  instagram: "https://www.instagram.com/celesverse/",
  youtube: "https://www.youtube.com/@%E7%BE%8E%E6%95%B8%E7%A4%BE",
  lineId: "@celesverse",
};

export function ContactModalButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyLineId() {
    await navigator.clipboard.writeText(CONTACT.lineId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover:text-gold-dust transition-colors duration-500"
      >
        聯絡我們
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/35 px-5 py-8 font-sans normal-case tracking-normal text-foreground backdrop-blur-sm">
          <div className="relative grid w-full max-w-3xl overflow-hidden bg-background shadow-2xl md:grid-cols-[1fr_280px]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center border border-border bg-background/85 text-sm text-muted-fg transition-colors hover:text-foreground"
              aria-label="關閉聯絡資訊"
            >
              ✕
            </button>

            <div className="px-7 py-10 md:px-10 md:py-12">
              <p className="text-[10px] uppercase tracking-[0.35em] text-muted-fg font-sans">
                Contact
              </p>
              <h2 className="mt-4 text-3xl font-serif font-light leading-tight text-foreground md:text-4xl">
                聯絡我們
              </h2>

              <div className="mt-6 space-y-3 whitespace-pre-wrap text-sm font-light leading-[2] text-muted-fg md:text-base">
                <p>電話：{CONTACT.phone}</p>
                <p>信箱：{CONTACT.email}</p>
                <p>網站：{CONTACT.website}</p>
                <p>地址：{CONTACT.address}</p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="inline-block border border-border px-5 py-2 text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-mist font-sans"
                >
                  撥打電話
                </a>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="inline-block border border-border px-5 py-2 text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-mist font-sans"
                >
                  寄信
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-mist/60 px-8 py-10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-fg font-sans">
                Official LINE
              </p>
              <div className="mt-5 grid h-56 w-full place-items-center bg-white text-sm text-muted-fg shadow-soft">
                LINE QR Code
              </div>
              <div className="mt-5">
                <p className="text-xs text-muted-fg">LINE ID</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm text-foreground">
                    {CONTACT.lineId}
                  </code>
                  <button
                    type="button"
                    onClick={copyLineId}
                    className="border border-border px-3 py-2 text-xs text-foreground transition-colors hover:bg-background"
                  >
                    {copied ? "已複製" : "複製"}
                  </button>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <SocialLink href={CONTACT.instagram} label="IG" />
                <SocialLink href={CONTACT.youtube} label="YT" />
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="grid h-12 w-12 place-items-center rounded-full bg-foreground text-xs font-semibold tracking-widest text-background transition-opacity hover:opacity-85"
    >
      {label}
    </a>
  );
}
