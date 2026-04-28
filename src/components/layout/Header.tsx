// 網站頂部導覽列 — Silk & Shadow
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { HeaderUserMenu } from "@/components/layout/HeaderUserMenu";
import { ContactModalButton } from "@/components/layout/ContactModalButton";

export async function Header() {
  const session = await auth();
  const userType = session?.user.userType ?? null;
  const userName = session?.user.name ?? session?.user.email ?? null;

  return (
    <nav className="fixed top-0 w-full z-50 flex items-center px-6 md:px-12 lg:px-16 py-4 md:py-6 bg-background/80 backdrop-blur-sm">
      <Link href="/" className="flex items-center relative z-10">
        <Image
          src="/images/logo-horizontal.png"
          alt="神仙部落 CELESVERSE"
          width={240}
          height={194}
          className="h-12 md:h-14 w-auto"
          priority
        />
      </Link>

      <div className="hidden md:flex gap-8 lg:gap-12 text-sm tracking-widest uppercase font-light font-sans absolute left-1/2 -translate-x-1/2">
        <Link href="/" className="hover:text-gold-dust transition-colors duration-500">
          首頁
        </Link>
        <Link
          href="/about"
          className="hover:text-gold-dust transition-colors duration-500"
        >
          在部落裡
        </Link>
        <Link
          href="/experiences"
          className="hover:text-gold-dust transition-colors duration-500"
        >
          體驗課程
        </Link>
        <Link
          href="/Guides"
          className="hover:text-gold-dust transition-colors duration-500"
        >
          靈性嚮導
        </Link>
        <ContactModalButton />
      </div>

      <div className="ml-auto relative z-10">
        <HeaderUserMenu userType={userType} userName={userName} />
      </div>
    </nav>
  );
}
