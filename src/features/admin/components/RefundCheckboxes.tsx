"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateRefundFlags,
  resendRefundEmail,
} from "@/features/admin/actions/order.action";

interface Props {
  orderId: string;
  initial: {
    isCanceled: boolean;
    isRefunded: boolean;
    isInvoiceVoided: boolean;
  };
  refundCompletedAt: Date | null;
  refundEmailSentAt: Date | null;
}

export function RefundCheckboxes({
  orderId,
  initial,
  refundCompletedAt,
  refundEmailSentAt,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flags, setFlags] = useState(initial);
  const [savedAt, setSavedAt] = useState<Date | null>(refundCompletedAt);
  const [mailSentAt, setMailSentAt] = useState<Date | null>(refundEmailSentAt);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const allChecked =
    flags.isCanceled && flags.isRefunded && flags.isInvoiceVoided;

  function toggle(key: keyof typeof flags) {
    const next = { ...flags, [key]: !flags[key] };
    setFlags(next);
    setResendMsg(null);
    startTransition(async () => {
      await updateRefundFlags(orderId, next);
      const nextAll =
        next.isCanceled && next.isRefunded && next.isInvoiceVoided;
      if (nextAll && !savedAt) {
        setSavedAt(new Date());
        if (!mailSentAt) setMailSentAt(new Date());
      }
      if (!nextAll && savedAt) setSavedAt(null);
      router.refresh();
    });
  }

  function handleResend() {
    setResendMsg(null);
    startTransition(async () => {
      const result = await resendRefundEmail(orderId);
      if (result.success) {
        setMailSentAt(new Date());
        setResendMsg("已重寄");
        router.refresh();
      } else {
        setResendMsg(result.error ?? "重寄失敗");
      }
    });
  }

  const boxStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    cursor: "pointer",
    fontSize: 13,
    color: "var(--admin-text)",
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">退費流程</h2>
        <span className="panel-en">REFUND</span>
      </div>
      <div className="panel-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={boxStyle}>
            <input
              type="checkbox"
              checked={flags.isCanceled}
              onChange={() => toggle("isCanceled")}
              disabled={pending}
              style={{ width: 16, height: 16, accentColor: "var(--admin-accent)" }}
            />
            <span>已取消訂單</span>
          </label>
          <label style={boxStyle}>
            <input
              type="checkbox"
              checked={flags.isRefunded}
              onChange={() => toggle("isRefunded")}
              disabled={pending}
              style={{ width: 16, height: 16, accentColor: "var(--admin-accent)" }}
            />
            <span>已退費（綠界刷退完成）</span>
          </label>
          <label style={boxStyle}>
            <input
              type="checkbox"
              checked={flags.isInvoiceVoided}
              onChange={() => toggle("isInvoiceVoided")}
              disabled={pending}
              style={{ width: 16, height: 16, accentColor: "var(--admin-accent)" }}
            />
            <span>發票已作廢</span>
          </label>
        </div>

        {pending && (
          <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
            儲存中…
          </div>
        )}

        {allChecked ? (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--admin-purple-light)",
                color: "#5d4a7a",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              ✓ 三項都完成，付款狀態已標記為「已退費」
              {savedAt && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>
                  · {new Date(savedAt).toLocaleString("zh-TW")}
                </span>
              )}
            </div>

            <div
              style={{
                background: "var(--admin-bg)",
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 12 }}>
                  {mailSentAt ? (
                    <>
                      <span style={{ marginRight: 4 }}>✉️</span>
                      退費通知信已寄出
                      <span className="muted" style={{ marginLeft: 6, fontSize: 11 }}>
                        · {new Date(mailSentAt).toLocaleString("zh-TW")}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "#a67835" }}>
                      ⚠ 退費通知信尚未寄出（可能上次失敗）
                    </span>
                  )}
                </div>
                <button
                  onClick={handleResend}
                  disabled={pending}
                  className="btn btn-sm"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {pending ? "寄送中…" : mailSentAt ? "重寄通知信" : "寄通知信"}
                </button>
              </div>
              {resendMsg && (
                <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
                  {resendMsg}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 11, marginTop: 12 }}>
            三項都勾選後會自動把付款標記為「已退費」+ 寄退費通知信給客戶
          </p>
        )}
      </div>
    </div>
  );
}
