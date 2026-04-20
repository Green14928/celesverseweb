// 課程報名表單 — Silk & Shadow
// 會員登入後開啟表單，填發票資訊 → 送出後自動導到綠界付款頁
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  createOrder,
  type InvoiceFormInput,
} from "@/features/orders/actions/createOrder.action";

interface PurchaseFormProps {
  courseId: string;
  courseName: string;
  price: number;
  memberLoggedIn: boolean;
  memberEmail?: string | null;
}

type InvoiceTab = "B2C" | "B2B" | "DONATION";
type B2CCarrier = "NONE" | "MEMBER" | "MOBILE_BARCODE" | "CITIZEN_CARD";

function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { question: `${a} + ${b} = ?`, answer: a + b };
}

// 自動送出表單到綠界（瀏覽器會自己 POST 過去）
function submitToEcpay(action: string, params: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.acceptCharset = "UTF-8";
  for (const [k, v] of Object.entries(params)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function PurchaseForm({
  courseId,
  courseName,
  price,
  memberLoggedIn,
  memberEmail,
}: PurchaseFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [invoiceTab, setInvoiceTab] = useState<InvoiceTab>("B2C");
  const [carrier, setCarrier] = useState<B2CCarrier>("NONE");
  const [carrierCode, setCarrierCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loveCode, setLoveCode] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState(memberEmail ?? "");

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (Number(captchaInput) !== captcha.answer) {
      setError("驗證碼錯誤，請重新計算");
      refreshCaptcha();
      return;
    }

    // 組發票輸入
    let invoice: InvoiceFormInput;
    if (invoiceTab === "B2B") {
      if (!/^\d{8}$/.test(taxId.trim())) {
        setError("統一編號必須是 8 碼數字");
        return;
      }
      if (!companyName.trim()) {
        setError("請填寫公司抬頭");
        return;
      }
      if (!invoiceEmail.trim()) {
        setError("請填寫發票寄送 Email");
        return;
      }
      invoice = {
        invoiceType: "B2B",
        taxId: taxId.trim(),
        buyerName: companyName.trim(),
        invoiceEmail: invoiceEmail.trim(),
      };
    } else if (invoiceTab === "DONATION") {
      if (!/^\d{3,7}$/.test(loveCode.trim())) {
        setError("捐贈碼必須是 3-7 碼數字");
        return;
      }
      invoice = {
        invoiceType: "DONATION",
        loveCode: loveCode.trim(),
        invoiceEmail: invoiceEmail.trim() || undefined,
      };
    } else {
      if (carrier === "MOBILE_BARCODE" && !/^\/[A-Z0-9+\-.]{7}$/.test(carrierCode.trim())) {
        setError("手機條碼格式錯誤（例：/ABC+123）");
        return;
      }
      if (carrier === "CITIZEN_CARD" && !/^[A-Z]{2}\d{14}$/.test(carrierCode.trim())) {
        setError("自然人憑證格式錯誤（2 大寫字母 + 14 碼數字）");
        return;
      }
      if (!invoiceEmail.trim()) {
        setError("請填寫發票寄送 Email");
        return;
      }
      invoice = {
        invoiceType: "B2C",
        carrierType: carrier,
        carrierCode: carrierCode.trim() || undefined,
        invoiceEmail: invoiceEmail.trim(),
      };
    }

    setIsSubmitting(true);
    const result = await createOrder({ courseId, invoice });

    if (result.success) {
      // 送出表單前提示（導到綠界頁後就回不來這頁了）
      submitToEcpay(result.payment.action, result.payment.params);
    } else {
      setError(result.error);
      refreshCaptcha();
      setIsSubmitting(false);
    }
  }

  if (!memberLoggedIn) {
    return (
      <div className="text-center space-y-3">
        <Link
          href="/login"
          className="inline-block px-12 py-4 bg-foreground text-background text-sm tracking-widest uppercase hover:bg-moss transition-all duration-500 font-sans"
        >
          登入會員報名
        </Link>
        <p className="text-xs text-muted-fg font-sans">需要先登入才能報名課程</p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          refreshCaptcha();
        }}
        className="px-12 py-4 bg-foreground text-background text-sm tracking-widest uppercase hover:bg-moss transition-all duration-500 font-sans"
      >
        立即報名
      </button>
    );
  }

  const inputCls =
    "w-full border border-border bg-pearl px-4 h-12 text-sm font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";
  const labelCls =
    "block text-xs uppercase tracking-widest text-muted-fg mb-2 font-sans";

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5 p-6 bg-mist/50">
        <h3 className="text-xl font-serif font-light">填寫報名資料</h3>
        <p className="text-xs tracking-widest uppercase text-muted-fg font-sans">
          {courseName} — NT$ {price.toLocaleString()}
        </p>

        {error && (
          <div className="bg-destructive/10 p-3 text-sm text-destructive font-sans">
            {error}
          </div>
        )}

        {/* 發票類型切換 */}
        <div>
          <label className={labelCls}>發票類型 *</label>
          <div className="grid grid-cols-3 border border-border">
            {(["B2C", "B2B", "DONATION"] as InvoiceTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setInvoiceTab(t)}
                className={`py-3 text-xs tracking-widest font-sans transition-colors ${
                  invoiceTab === t
                    ? "bg-foreground text-background"
                    : "bg-pearl text-foreground hover:bg-mist"
                }`}
              >
                {t === "B2C" ? "個人" : t === "B2B" ? "公司" : "捐贈"}
              </button>
            ))}
          </div>
        </div>

        {/* 個人 */}
        {invoiceTab === "B2C" && (
          <>
            <div>
              <label className={labelCls}>載具 *</label>
              <select
                value={carrier}
                onChange={(e) => {
                  setCarrier(e.target.value as B2CCarrier);
                  setCarrierCode("");
                }}
                className={inputCls}
              >
                <option value="NONE">紙本（寄到發票 Email）</option>
                <option value="MEMBER">會員載具（綠界平台）</option>
                <option value="MOBILE_BARCODE">手機條碼</option>
                <option value="CITIZEN_CARD">自然人憑證</option>
              </select>
            </div>
            {carrier === "MOBILE_BARCODE" && (
              <div>
                <label className={labelCls}>手機條碼（8 碼，以 / 開頭）</label>
                <input
                  value={carrierCode}
                  onChange={(e) => setCarrierCode(e.target.value.toUpperCase())}
                  placeholder="/ABC+123"
                  className={inputCls}
                />
              </div>
            )}
            {carrier === "CITIZEN_CARD" && (
              <div>
                <label className={labelCls}>自然人憑證條碼（16 碼）</label>
                <input
                  value={carrierCode}
                  onChange={(e) => setCarrierCode(e.target.value.toUpperCase())}
                  placeholder="AB12345678901234"
                  className={inputCls}
                />
              </div>
            )}
          </>
        )}

        {/* 公司 */}
        {invoiceTab === "B2B" && (
          <>
            <div>
              <label className={labelCls}>統一編號 *</label>
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ""))}
                placeholder="8 碼數字"
                maxLength={8}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>公司抬頭 *</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="神仙部落有限公司"
                className={inputCls}
              />
            </div>
          </>
        )}

        {/* 捐贈 */}
        {invoiceTab === "DONATION" && (
          <div>
            <label className={labelCls}>捐贈碼 *（3-7 碼數字）</label>
            <input
              value={loveCode}
              onChange={(e) => setLoveCode(e.target.value.replace(/\D/g, ""))}
              placeholder="例：25885（心路基金會）"
              className={inputCls}
            />
          </div>
        )}

        {/* 發票 Email */}
        <div>
          <label className={labelCls}>
            {invoiceTab === "DONATION" ? "收據 Email（選填）" : "發票 Email *"}
          </label>
          <input
            type="email"
            value={invoiceEmail}
            onChange={(e) => setInvoiceEmail(e.target.value)}
            className={inputCls}
            placeholder="your@email.com"
          />
        </div>

        {/* 驗證碼 */}
        <div>
          <label className={labelCls}>驗證碼 *</label>
          <div className="flex items-center gap-3">
            <span className="shrink-0 px-4 h-12 bg-foreground/5 border border-border flex items-center text-lg font-mono tracking-wider text-foreground select-none">
              {captcha.question}
            </span>
            <input
              type="text"
              inputMode="numeric"
              required
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              className="w-24 border border-border bg-pearl px-4 h-12 text-sm font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 text-center"
              placeholder="答案"
            />
            <button
              type="button"
              onClick={refreshCaptcha}
              className="shrink-0 text-xs text-muted-fg hover:text-foreground transition-colors font-sans"
              title="換一題"
            >
              換一題
            </button>
          </div>
        </div>

        {/* 同意條款 */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-foreground shrink-0"
          />
          <span className="text-xs text-muted-fg font-sans leading-relaxed">
            我已詳細閱讀並同意神仙部落之
            <a href="/privacy" target="_blank" className="text-gold-dust hover:underline">隱私權政策</a>、
            <a href="/terms" target="_blank" className="text-gold-dust hover:underline">使用者條款</a>及
            <a href="/purchase-agreement" target="_blank" className="text-gold-dust hover:underline">實體課程購買合約</a>。
          </span>
        </label>

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !agreed}
            className="flex-1 py-4 bg-foreground text-background text-sm tracking-widest uppercase hover:bg-moss transition-all duration-500 font-sans disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "導向綠界付款..." : "前往付款"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setError(null);
            }}
            disabled={isSubmitting}
            className="px-8 py-4 border border-border text-foreground text-sm tracking-widest uppercase hover:bg-mist transition-colors duration-500 font-sans disabled:opacity-40"
          >
            取消
          </button>
        </div>

        <p className="text-[11px] text-muted-fg font-sans leading-relaxed pt-2 border-t border-border/50">
          按「前往付款」後會導向綠界安全付款頁，支援信用卡付款。付款完成後會自動開立電子發票寄到你的 Email。
        </p>
      </form>
    </div>
  );
}
