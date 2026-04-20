"use client";

import { useTransition } from "react";
import type { AdminRole } from "@/generated/prisma/enums";
import {
  toggleAdminActive,
  updateAdminRole,
} from "@/features/admin/actions/admin.action";

type AdminRowProps = {
  admin: {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    isActive: boolean;
    lastLoginAt: string | null;
  };
  isSelf: boolean;
};

export function AdminRow({ admin, isSelf }: AdminRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const action = admin.isActive ? "停用" : "啟用";
    if (!confirm(`確定要${action}「${admin.name}」嗎？`)) return;
    startTransition(async () => {
      const result = await toggleAdminActive(admin.id, !admin.isActive);
      if (!result.success) alert(result.error);
    });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as AdminRole;
    if (newRole === admin.role) return;
    if (!confirm(`確定要把「${admin.name}」改成${roleLabel(newRole)}嗎？`)) {
      e.target.value = admin.role;
      return;
    }
    startTransition(async () => {
      const result = await updateAdminRole(admin.id, newRole);
      if (!result.success) {
        alert(result.error);
        e.target.value = admin.role;
      }
    });
  };

  return (
    <tr>
      <td>
        <span style={{ fontWeight: 600 }}>{admin.name}</span>
        {isSelf && (
          <span className="tag tag-accent" style={{ marginLeft: 8 }}>
            你
          </span>
        )}
      </td>
      <td className="muted">{admin.email}</td>
      <td>
        <select
          value={admin.role}
          onChange={handleRoleChange}
          disabled={isPending || isSelf}
          className="select"
          style={{ fontSize: 12, padding: "5px 10px" }}
        >
          <option value="ADMIN">{roleLabel("ADMIN")}</option>
          <option value="SUPER_ADMIN">{roleLabel("SUPER_ADMIN")}</option>
        </select>
      </td>
      <td>
        <span
          className={`status-tag ${admin.isActive ? "" : ""}`}
          style={{
            background: admin.isActive
              ? "var(--admin-green-light)"
              : "var(--admin-bg-warm)",
            color: admin.isActive
              ? "var(--admin-green)"
              : "var(--admin-text-muted)",
          }}
        >
          <span
            className="sd"
            style={{
              background: admin.isActive
                ? "var(--admin-green)"
                : "var(--admin-text-muted)",
            }}
          />
          {admin.isActive ? "啟用中" : "已停用"}
        </span>
      </td>
      <td className="muted" style={{ fontSize: 12 }}>
        {admin.lastLoginAt
          ? new Date(admin.lastLoginAt).toLocaleString("zh-TW")
          : "—"}
      </td>
      <td>
        <button
          onClick={handleToggle}
          disabled={isPending || isSelf}
          className="op-btn"
        >
          {admin.isActive ? "停用" : "啟用"}
        </button>
      </td>
    </tr>
  );
}

function roleLabel(role: AdminRole): string {
  return role === "SUPER_ADMIN" ? "最高管理員" : "一般管理員";
}
