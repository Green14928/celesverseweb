"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole } from "@/generated/prisma/enums";
import { createAdmin } from "@/features/admin/actions/admin.action";

export function NewAdminForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as AdminRole;

    startTransition(async () => {
      const result = await createAdmin(email, name, role);
      if (result.success) {
        router.push("/admin/admins");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            background: "var(--admin-red-light)",
            color: "var(--admin-red)",
            fontSize: 13,
            border: "1px solid rgba(192, 86, 75, 0.25)",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 6,
            letterSpacing: 0.5,
          }}
        >
          Email（對方的 Google 帳號）
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="example@gmail.com"
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 6,
            letterSpacing: 0.5,
          }}
        >
          姓名
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder="例：王小明"
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 6,
            letterSpacing: 0.5,
          }}
        >
          角色
        </label>
        <select name="role" required defaultValue="ADMIN" className="select" style={{ width: "100%" }}>
          <option value="ADMIN">一般管理員（日常作業）</option>
          <option value="SUPER_ADMIN">最高管理員（可管理其他管理員）</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary"
        >
          {isPending ? "新增中..." : "新增管理員"}
        </button>
        <button
          type="button"
          onClick={() => history.back()}
          className="btn"
        >
          取消
        </button>
      </div>
    </form>
  );
}
