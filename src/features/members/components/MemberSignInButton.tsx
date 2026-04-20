"use client";

import { useEffect, useState } from "react";

export function MemberSignInButton({ callbackUrl }: { callbackUrl: string }) {
  const [csrfToken, setCsrfToken] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/csrf", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setCsrfToken(d.csrfToken);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  return (
    <form method="post" action="/api/auth/signin/google" className="w-full">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <button
        type="submit"
        disabled={!ready}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.71H.957v2.332A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.712a5.41 5.41 0 0 1 0-3.423V4.957H.957a9 9 0 0 0 0 8.086l3.007-2.331z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.957L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
          />
        </svg>
        {ready ? "使用 Google 登入 / 註冊" : "載入中…"}
      </button>
    </form>
  );
}
