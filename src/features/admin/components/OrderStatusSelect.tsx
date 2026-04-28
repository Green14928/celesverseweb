"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/features/admin/actions/order.action";

const options = [
  { value: "PREPARING", label: "準備中" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELED", label: "已取消" },
];

export function OrderStatusSelect({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(
    initialStatus === "COMPLETED" || initialStatus === "CANCELED"
      ? initialStatus
      : "PREPARING",
  );

  function handleChange(nextValue: string) {
    setValue(nextValue);
    startTransition(async () => {
      await updateOrderStatus(orderId, nextValue);
      router.refresh();
    });
  }

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="caption">訂單狀態</span>
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        disabled={pending}
        style={{
          width: "100%",
          border: "1px solid var(--admin-border)",
          borderRadius: 8,
          background: "var(--admin-panel)",
          color: "var(--admin-text)",
          padding: "9px 10px",
          fontSize: 13,
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {pending && (
        <span className="muted" style={{ fontSize: 11 }}>
          儲存中…
        </span>
      )}
    </label>
  );
}
