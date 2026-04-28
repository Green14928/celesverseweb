"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSearch = searchParams.get("search") || "";
  const currentStartDate = searchParams.get("startDate") || "";
  const currentEndDate = searchParams.get("endDate") || "";
  const currentPaymentStatus = searchParams.get("paymentStatus") || "";
  const currentOrderStatus = searchParams.get("status") || "";
  const currentInvoiceStatus = searchParams.get("invoice") || "";
  const hasAdvancedFilter =
    currentStartDate !== "" ||
    currentEndDate !== "" ||
    currentPaymentStatus !== "" ||
    currentOrderStatus !== "" ||
    currentInvoiceStatus !== "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value.trim() });
    }, 300);
  }

  function clearAdvancedFilters() {
    updateParams({
      startDate: "",
      endDate: "",
      paymentStatus: "",
      status: "",
      invoice: "",
    });
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentStartDate) params.set("startDate", currentStartDate);
    if (currentEndDate) params.set("endDate", currentEndDate);
    if (currentPaymentStatus) params.set("paymentStatus", currentPaymentStatus);
    if (currentOrderStatus) params.set("status", currentOrderStatus);
    if (currentInvoiceStatus) params.set("invoice", currentInvoiceStatus);
    window.open(`/api/orders/export?${params.toString()}`, "_blank");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <input
          className="search-input"
          defaultValue={currentSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="搜尋訂單編號、會員姓名、Email、電話…"
          style={{ minWidth: 260, flex: "1 1 280px" }}
        />

        <button onClick={handleExport} className="btn btn-sm" type="button">
          匯出 CSV
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="caption">起始日期</span>
          <input
            type="date"
            value={currentStartDate}
            onChange={(e) => updateParams({ startDate: e.target.value })}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="caption">結束日期</span>
          <input
            type="date"
            value={currentEndDate}
            onChange={(e) => updateParams({ endDate: e.target.value })}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="caption">付款狀態</span>
          <select
            className="select"
            value={currentPaymentStatus}
            onChange={(e) => updateParams({ paymentStatus: e.target.value })}
          >
            <option value="">全部付款</option>
            <option value="PENDING">待付款</option>
            <option value="PAID">已付款</option>
            <option value="FAILED">付款失敗</option>
            <option value="REFUND_PENDING">退費處理中</option>
            <option value="REFUNDED">已退費</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="caption">訂單狀態</span>
          <select
            className="select"
            value={currentOrderStatus}
            onChange={(e) => updateParams({ status: e.target.value })}
          >
            <option value="">全部狀態</option>
            <option value="PREPARING">準備中</option>
            <option value="COMPLETED">已完成</option>
            <option value="CANCELED">已取消</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="caption">發票</span>
          <select
            className="select"
            value={currentInvoiceStatus}
            onChange={(e) => updateParams({ invoice: e.target.value })}
          >
            <option value="">全部發票</option>
            <option value="ISSUED">已開立</option>
            <option value="UNISSUED">未開立</option>
            <option value="VOIDED">已作廢</option>
          </select>
        </label>

        {hasAdvancedFilter && (
          <button
            onClick={clearAdvancedFilters}
            className="btn btn-ghost btn-sm"
            type="button"
          >
            清除篩選
          </button>
        )}
      </div>
    </div>
  );
}
