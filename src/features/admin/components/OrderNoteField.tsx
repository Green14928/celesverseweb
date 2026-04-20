"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderNote } from "@/features/admin/actions/order.action";

export function OrderNoteField({
  orderId,
  initial,
}: {
  orderId: string;
  initial: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateOrderNote(orderId, value);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const dirty = (value ?? "") !== (initial ?? "");

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span className="caption">可見範圍：僅管理員</span>
        {saved && (
          <span style={{ fontSize: 11, color: "var(--admin-green)" }}>
            ✓ 已儲存
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="給自己或同事的備忘，例：客人 LINE 追過、退費原因…"
        style={{ width: "100%", resize: "vertical", fontFamily: "var(--admin-font-sans)" }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          onClick={handleSave}
          disabled={!dirty || pending}
          className="btn btn-primary btn-sm"
        >
          {pending ? "儲存中…" : "儲存備註"}
        </button>
      </div>
    </div>
  );
}
