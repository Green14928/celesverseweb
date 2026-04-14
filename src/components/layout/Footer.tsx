// 網站底部 — Silk & Shadow
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-6 md:mx-12 lg:mx-16 mt-1 bg-background shadow-2xl px-6 md:px-12 py-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm font-serif font-light">神仙部落有限公司</div>

        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-fg font-sans">
          &copy; {new Date().getFullYear()} CelesVerse
        </div>

        <div className="flex items-center gap-4">
          <Link href="/privacy" className="text-xs text-muted-fg font-sans hover:text-gold-dust transition-colors">
            隱私權政策
          </Link>
          <Link href="/terms" className="text-xs text-muted-fg font-sans hover:text-gold-dust transition-colors">
            使用者條款
          </Link>
          <a href="mailto:support@celesverse.co" className="text-sm font-light text-muted-fg font-sans hover:text-gold-dust transition-colors">
            support@celesverse.co
          </a>
        </div>
      </div>
    </footer>
  );
}
