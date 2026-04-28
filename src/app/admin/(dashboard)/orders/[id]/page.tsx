// 管理後台 — 訂單詳情（含退費 3 勾勾 + 發票作廢 / 重開）
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RefundCheckboxes } from "@/features/admin/components/RefundCheckboxes";
import { OrderNoteField } from "@/features/admin/components/OrderNoteField";
import { InvoiceActions } from "@/features/admin/components/InvoiceActions";
import { OrderStatusSelect } from "@/features/admin/components/OrderStatusSelect";
import { orderStatusLabel, paymentLabel } from "@/lib/order-labels";

export const dynamic = "force-dynamic";

const invoiceTypeLabel: Record<string, string> = {
  B2C: "二聯式（個人）",
  B2B: "三聯式（公司）",
};

const carrierLabel: Record<string, string> = {
  NONE: "紙本 / 無載具",
  MEMBER: "會員載具",
  MOBILE_BARCODE: "手機條碼",
  CITIZEN_CARD: "自然人憑證",
  DONATION: "捐贈",
};

const invoiceStatusLabel: Record<string, { text: string; cls: string }> = {
  ISSUED: { text: "已開立", cls: "tag-green" },
  VOIDED: { text: "已作廢", cls: "tag-neutral" },
  ALLOWANCE: { text: "已折讓", cls: "tag-amber" },
};

function fmtDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("zh-TW");
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      member: true,
      items: {
        include: {
          course: {
            include: {
              template: { select: { title: true } },
              teacher: {
                select: {
                  id: true,
                  name: true,
                  title: true,
                  photo: true,
                },
              },
            },
          },
        },
      },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  const payment = paymentLabel[order.paymentStatus] ?? paymentLabel.PENDING;
  const status = orderStatusLabel[order.status] ?? orderStatusLabel.PREPARING;

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <Link href="/admin/orders">訂單管理</Link>
          <span className="sep">/</span>
          <span className="here">{order.orderNumber}</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">
            訂單{" "}
            <span className="tnum" style={{ letterSpacing: 0 }}>
              {order.orderNumber}
            </span>
          </h1>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <span className={`tag ${payment.cls}`}>{payment.text}</span>
            <span className={`tag ${status.cls}`}>{status.text}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11 }} className="muted">
          <div>建立：{fmtDateTime(order.createdAt)}</div>
          {order.paidAt && <div>付款：{fmtDateTime(order.paidAt)}</div>}
          <div>更新：{fmtDateTime(order.updatedAt)}</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          {/* 購買課程 */}
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">購買課程</h2>
              <span className="panel-en">COURSES</span>
            </div>
            <div className="panel-body">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    paddingTop: 12,
                    paddingBottom: 12,
                    borderBottom: "1px solid var(--admin-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        href={`/admin/courses/${item.course.id}`}
                        className="link"
                        style={{ fontWeight: 600, fontSize: 14 }}
                      >
                        {item.course.template.title}
                      </Link>
                      <div className="caption" style={{ textTransform: "none", letterSpacing: 0, marginTop: 4 }}>
                        {item.course.startDate && (
                          <>
                            開課：
                            {new Date(item.course.startDate).toLocaleDateString("zh-TW")}
                            {item.course.location && ` · ${item.course.location}`}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="tnum" style={{ fontSize: 15, whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--admin-text-muted)",
                          marginRight: 3,
                        }}
                      >
                        NT$
                      </span>
                      {item.price.toLocaleString()}
                      {item.quantity > 1 && (
                        <span className="muted" style={{ fontSize: 11, marginLeft: 4 }}>
                          × {item.quantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.course.teacher && (
                    <Link
                      href={`/admin/teachers/${item.course.teacher.id}/stats`}
                      style={{
                        marginTop: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        borderRadius: 6,
                        background: "var(--admin-bg)",
                        padding: "8px 10px",
                        transition: "background 0.2s ease",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      {item.course.teacher.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.course.teacher.photo}
                          alt={item.course.teacher.name}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span className="mini-avatar" style={{ width: 30, height: 30, fontSize: 13 }}>
                          {item.course.teacher.name.charAt(0)}
                        </span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="caption" style={{ letterSpacing: 1 }}>
                          授課老師
                        </div>
                        <div style={{ fontSize: 13 }}>
                          {item.course.teacher.name}
                          {item.course.teacher.title && (
                            <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>
                              {item.course.teacher.title}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="muted" style={{ fontSize: 11 }}>
                        課務統計 →
                      </span>
                    </Link>
                  )}
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 14,
                  marginTop: 2,
                }}
              >
                <span className="caption">總金額</span>
                <span className="tnum" style={{ fontSize: 22 }}>
                  <span style={{ fontSize: 11, color: "var(--admin-text-muted)", marginRight: 3 }}>
                    NT$
                  </span>
                  {order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          {/* 會員資訊 */}
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">會員資訊</h2>
              <span className="panel-en">MEMBER</span>
            </div>
            <div className="panel-body">
              <dl className="dl">
                <dt>姓名</dt>
                <dd>
                  <Link href={`/admin/members/${order.member.id}`} className="link">
                    {order.member.name}
                  </Link>
                </dd>
                <dt>Email</dt>
                <dd>{order.member.email}</dd>
                {order.member.phone && (
                  <>
                    <dt>電話</dt>
                    <dd>{order.member.phone}</dd>
                  </>
                )}
                {order.member.gender && (
                  <>
                    <dt>性別</dt>
                    <dd>
                      {order.member.gender === "MALE"
                        ? "男"
                        : order.member.gender === "FEMALE"
                          ? "女"
                          : "其他"}
                    </dd>
                  </>
                )}
                {order.member.birthday && (
                  <>
                    <dt>生日</dt>
                    <dd>
                      {new Date(order.member.birthday).toLocaleDateString("zh-TW")}
                    </dd>
                  </>
                )}
                {order.member.address && (
                  <>
                    <dt>地址</dt>
                    <dd>{order.member.address}</dd>
                  </>
                )}
                {order.member.lineId && (
                  <>
                    <dt>LINE ID</dt>
                    <dd>{order.member.lineId}</dd>
                  </>
                )}
              </dl>
            </div>
          </section>

          {/* 付款 + 發票資訊 */}
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">付款與發票</h2>
              <span className="panel-en">PAYMENT &amp; INVOICE</span>
            </div>
            <div className="panel-body">
              <dl className="dl">
                <dt>付款方式</dt>
                <dd>
                  {order.paymentMethod === "CREDIT_CARD"
                    ? "信用卡"
                    : order.paymentMethod === "APPLE_PAY"
                      ? "Apple Pay"
                      : "—"}
                </dd>
                {order.ecpayMerchantTradeNo && (
                  <>
                    <dt>綠界訂單號</dt>
                    <dd className="tnum" style={{ fontSize: 12 }}>
                      {order.ecpayMerchantTradeNo}
                    </dd>
                  </>
                )}
                {order.ecpayTradeNo && (
                  <>
                    <dt>綠界交易號</dt>
                    <dd className="tnum" style={{ fontSize: 12 }}>
                      {order.ecpayTradeNo}
                    </dd>
                  </>
                )}
                <dt>發票類型</dt>
                <dd>{invoiceTypeLabel[order.invoiceType]}</dd>
                {order.invoiceCarrierType && (
                  <>
                    <dt>載具</dt>
                    <dd>
                      {carrierLabel[order.invoiceCarrierType]}
                      {order.invoiceCarrierCode && (
                        <span className="muted tnum" style={{ marginLeft: 6, fontSize: 12 }}>
                          {order.invoiceCarrierCode}
                        </span>
                      )}
                    </dd>
                  </>
                )}
                {order.invoiceBuyerName && (
                  <>
                    <dt>發票抬頭</dt>
                    <dd>{order.invoiceBuyerName}</dd>
                  </>
                )}
                {order.invoiceBuyerTaxId && (
                  <>
                    <dt>統一編號</dt>
                    <dd className="tnum">{order.invoiceBuyerTaxId}</dd>
                  </>
                )}
                {order.invoiceDonateCode && (
                  <>
                    <dt>捐贈碼</dt>
                    <dd className="tnum">{order.invoiceDonateCode}</dd>
                  </>
                )}
                {order.invoiceEmail && (
                  <>
                    <dt>發票寄送</dt>
                    <dd>{order.invoiceEmail}</dd>
                  </>
                )}
              </dl>

              {/* 實際開立發票列表 */}
              {order.invoices.length > 0 && (
                <>
                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid var(--admin-border)",
                      margin: "16px 0 12px",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <div className="caption">已開立發票</div>
                    <Link href="/admin/invoices" className="muted" style={{ fontSize: 11 }}>
                      發票管理 →
                    </Link>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {order.invoices.map((inv) => {
                      const invStatus =
                        invoiceStatusLabel[inv.status] ??
                        invoiceStatusLabel.ISSUED;
                      return (
                        <div
                          key={inv.id}
                          style={{
                            background: "var(--admin-bg)",
                            borderRadius: 8,
                            padding: "10px 12px",
                            fontSize: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span className="tnum" style={{ fontSize: 13 }}>
                                {inv.invoiceNumber}
                              </span>
                              <span className={`tag ${invStatus.cls}`}>
                                {invStatus.text}
                              </span>
                              <span className="muted" style={{ fontSize: 11 }}>
                                {fmtDateTime(inv.invoiceDate)}
                              </span>
                              <span className="tnum" style={{ fontSize: 12 }}>
                                NT$ {inv.totalAmount.toLocaleString()}
                              </span>
                              <span className="muted" style={{ fontSize: 11 }}>
                                · {inv.type === "B2B" ? "三聯式" : "二聯式"}
                                {inv.buyerTaxId && (
                                  <span className="tnum" style={{ marginLeft: 4 }}>
                                    統編 {inv.buyerTaxId}
                                  </span>
                                )}
                              </span>
                            </div>
                            {inv.status === "ISSUED" && (
                              <InvoiceActions
                                invoiceId={inv.id}
                                invoiceNumber={inv.invoiceNumber}
                                invoiceType={inv.type}
                              />
                            )}
                          </div>
                          {inv.status === "VOIDED" && inv.voidReason && (
                            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                              作廢原因：{inv.voidReason}
                              {inv.voidedAt && (
                                <span style={{ marginLeft: 8 }}>
                                  · {fmtDateTime(inv.voidedAt)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* 右欄：退費 3 勾勾 + 備註 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">訂單處理</h2>
              <span className="panel-en">ORDER</span>
            </div>
            <div className="panel-body">
              <OrderStatusSelect orderId={order.id} initialStatus={order.status} />
            </div>
          </div>

          <RefundCheckboxes
            orderId={order.id}
            initial={{
              isCanceled: order.isCanceled,
              isRefunded: order.isRefunded,
              isInvoiceVoided: order.isInvoiceVoided,
            }}
            refundCompletedAt={order.refundCompletedAt}
            refundEmailSentAt={order.refundEmailSentAt}
          />

          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">管理員備註</h2>
              <span className="panel-en">NOTE</span>
            </div>
            <div className="panel-body">
              <OrderNoteField orderId={order.id} initial={order.note} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
