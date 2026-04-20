"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  voidInvoiceAction,
  reissueAsB2BAction,
} from "@/features/admin/actions/invoice.action";

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  invoiceType: "B2C" | "B2B";
}

export function InvoiceActions({ invoiceId, invoiceNumber, invoiceType }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "void" | "reissue">("idle");
  const [reason, setReason] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleVoid() {
    setError(null);
    startTransition(async () => {
      const result = await voidInvoiceAction(invoiceId, reason);
      if (!result.success) {
        setError(result.error ?? "作廢失敗");
        return;
      }
      setMode("idle");
      setReason("");
      router.refresh();
    });
  }

  function handleReissue() {
    setError(null);
    startTransition(async () => {
      const result = await reissueAsB2BAction(
        invoiceId,
        buyerName,
        taxId,
        reason || "重開三聯式發票",
      );
      if (!result.success) {
        setError(result.error ?? "重開失敗");
        return;
      }
      setMode("idle");
      setReason("");
      setBuyerName("");
      setTaxId("");
      router.refresh();
    });
  }

  if (mode === "idle") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          onClick={() => {
            setError(null);
            setMode("void");
          }}
          className="btn btn-sm"
        >
          作廢
        </button>
        {invoiceType === "B2C" && (
          <button
            onClick={() => {
              setError(null);
              setMode("reissue");
            }}
            className="btn btn-accent btn-sm"
          >
            重開三聯式
          </button>
        )}
      </div>
    );
  }

  if (mode === "void") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
        <div className="caption" style={{ textTransform: "none", letterSpacing: 0 }}>
          作廢發票{" "}
          <span className="tnum">{invoiceNumber}</span>
        </div>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="作廢原因（20 字內）"
          maxLength={20}
          style={{ fontSize: 12 }}
        />
        {error && (
          <div style={{ fontSize: 11, color: "var(--admin-red)" }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleVoid}
            disabled={pending || !reason.trim()}
            className="btn btn-danger btn-sm"
          >
            {pending ? "作廢中…" : "確認作廢"}
          </button>
          <button
            onClick={() => {
              setMode("idle");
              setReason("");
              setError(null);
            }}
            disabled={pending}
            className="btn btn-sm"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  // mode === "reissue"
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
      <div className="caption" style={{ textTransform: "none", letterSpacing: 0 }}>
        重開三聯式（先作廢 <span className="tnum">{invoiceNumber}</span>）
      </div>
      <input
        value={buyerName}
        onChange={(e) => setBuyerName(e.target.value)}
        placeholder="公司抬頭"
        style={{ fontSize: 12 }}
      />
      <input
        value={taxId}
        onChange={(e) => setTaxId(e.target.value.replace(/\D/g, "").slice(0, 8))}
        placeholder="統一編號（8 位數字）"
        style={{ fontSize: 12, fontFamily: "var(--admin-font-serif)" }}
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="原因（選填，20 字內）"
        maxLength={20}
        style={{ fontSize: 12 }}
      />
      {error && (
        <div style={{ fontSize: 11, color: "var(--admin-red)" }}>{error}</div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={handleReissue}
          disabled={pending || !buyerName.trim() || taxId.length !== 8}
          className="btn btn-primary btn-sm"
        >
          {pending ? "處理中…" : "確認重開"}
        </button>
        <button
          onClick={() => {
            setMode("idle");
            setBuyerName("");
            setTaxId("");
            setReason("");
            setError(null);
          }}
          disabled={pending}
          className="btn btn-sm"
        >
          取消
        </button>
      </div>
    </div>
  );
}
