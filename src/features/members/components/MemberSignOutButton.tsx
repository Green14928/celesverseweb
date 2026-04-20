"use client";

import { useEffect, useState } from "react";

type Props = {
  callbackUrl?: string;
  className?: string;
  label?: string;
};

export function MemberSignOutButton({
  callbackUrl = "/",
  className,
  label = "登出",
}: Props) {
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("/api/auth/csrf", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken))
      .catch(() => {});
  }, []);

  return (
    <form method="post" action="/api/auth/signout" className="inline">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
