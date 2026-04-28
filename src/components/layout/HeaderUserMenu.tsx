"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MemberSignOutButton } from "@/features/members/components/MemberSignOutButton";

type Props = {
  userType: "admin" | "member" | null;
  userName: string | null;
};

export function HeaderUserMenu({ userType, userName }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!userType) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-light tracking-widest uppercase text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-900"
      >
        登入 / 註冊
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-light tracking-wider text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-900"
      >
        <span className="max-w-[120px] truncate">{userName}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          {userType === "admin" ? (
            <>
              <Link
                href="/admin"
                className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                onClick={() => setOpen(false)}
              >
                進入後台
              </Link>
              <div className="my-1 border-t border-zinc-100" />
              <MemberSignOutButton
                className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                callbackUrl="/"
              />
            </>
          ) : (
            <>
              <Link
                href="/account"
                className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                onClick={() => setOpen(false)}
              >
                會員中心
              </Link>
              <div className="my-1 border-t border-zinc-100" />
              <MemberSignOutButton
                className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                callbackUrl="/"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
