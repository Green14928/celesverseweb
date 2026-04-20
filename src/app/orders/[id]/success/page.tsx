// 訂單付款結果頁（付款成功 / 失敗 / 仍在處理）
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      member: true,
      items: { include: { course: { include: { template: true } } } },
      invoices: true,
    },
  });

  if (!order) notFound();

  // 權限：只有訂單會員本人可看（admin 之後到後台看）
  if (
    !session?.user ||
    session.user.userType !== "member" ||
    session.user.id !== order.memberId
  ) {
    notFound();
  }

  const firstItem = order.items[0];
  const courseName = firstItem?.course.template.title ?? "—";
  const invoice = order.invoices[0];

  const isPaid = order.paymentStatus === "PAID";
  const isFailed = order.paymentStatus === "FAILED";
  const isPending = order.paymentStatus === "PENDING";

  return (
    <section className="pt-32 md:pt-40 pb-24 mx-6 md:mx-12 lg:mx-16">
      <div className="bg-background shadow-2xl py-12 md:py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-2xl mx-auto space-y-10">
          {/* 狀態 Banner */}
          {isPaid && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-moss/10 text-moss text-xs tracking-widest uppercase font-sans">
                付款成功
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-light">
                謝謝你的報名
              </h1>
              <p className="text-sm text-muted-fg font-sans leading-relaxed">
                我們已收到你的款項。發票已自動寄送到{" "}
                <span className="text-foreground">{order.invoiceEmail ?? order.member.email}</span>
                ，課程細節與上課地點將由導師另行通知。
              </p>
            </div>
          )}

          {isFailed && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-xs tracking-widest uppercase font-sans">
                付款失敗
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-light">付款未完成</h1>
              <p className="text-sm text-muted-fg font-sans leading-relaxed">
                綠界回報這筆交易未完成。名額已自動釋放，你可以再次到課程頁下單。
              </p>
            </div>
          )}

          {isPending && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-dust/10 text-gold-dust text-xs tracking-widest uppercase font-sans">
                付款處理中
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-light">訂單已建立</h1>
              <p className="text-sm text-muted-fg font-sans leading-relaxed">
                付款結果尚未回傳。請稍待片刻後重新整理此頁，或到「會員中心 → 我的訂單」查詢最新狀態。
              </p>
            </div>
          )}

          <div className="h-px bg-foreground/15" />

          {/* 訂單詳情 */}
          <div className="space-y-5">
            <h2 className="text-xl font-serif font-light">訂單資訊</h2>
            <dl className="grid grid-cols-[120px_1fr] gap-y-4 text-sm font-sans">
              <dt className="text-muted-fg">訂單編號</dt>
              <dd className="font-mono">{order.orderNumber}</dd>

              <dt className="text-muted-fg">課程</dt>
              <dd>{courseName}</dd>

              <dt className="text-muted-fg">金額</dt>
              <dd>NT$ {order.totalAmount.toLocaleString()}</dd>

              <dt className="text-muted-fg">會員</dt>
              <dd>{order.member.name}（{order.member.email}）</dd>

              {order.ecpayTradeNo && (
                <>
                  <dt className="text-muted-fg">綠界交易號</dt>
                  <dd className="font-mono text-xs">{order.ecpayTradeNo}</dd>
                </>
              )}

              {order.paidAt && (
                <>
                  <dt className="text-muted-fg">付款時間</dt>
                  <dd>{order.paidAt.toLocaleString("zh-TW")}</dd>
                </>
              )}
            </dl>
          </div>

          {/* 發票資訊 */}
          {invoice && (
            <>
              <div className="h-px bg-foreground/15" />
              <div className="space-y-5">
                <h2 className="text-xl font-serif font-light">電子發票</h2>
                <dl className="grid grid-cols-[120px_1fr] gap-y-4 text-sm font-sans">
                  <dt className="text-muted-fg">發票號碼</dt>
                  <dd className="font-mono">{invoice.invoiceNumber}</dd>

                  <dt className="text-muted-fg">發票類型</dt>
                  <dd>{invoice.type === "B2B" ? "三聯式（公司）" : "二聯式（個人）"}</dd>

                  <dt className="text-muted-fg">開立日期</dt>
                  <dd>{invoice.invoiceDate.toLocaleDateString("zh-TW")}</dd>

                  <dt className="text-muted-fg">買受人</dt>
                  <dd>{invoice.buyerName}</dd>

                  {invoice.buyerTaxId && (
                    <>
                      <dt className="text-muted-fg">統一編號</dt>
                      <dd className="font-mono">{invoice.buyerTaxId}</dd>
                    </>
                  )}

                  {invoice.carrierType === "MOBILE_BARCODE" && invoice.carrierCode && (
                    <>
                      <dt className="text-muted-fg">手機載具</dt>
                      <dd className="font-mono">{invoice.carrierCode}</dd>
                    </>
                  )}

                  {invoice.donateCode && (
                    <>
                      <dt className="text-muted-fg">捐贈碼</dt>
                      <dd className="font-mono">{invoice.donateCode}</dd>
                    </>
                  )}
                </dl>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-4 pt-6">
            <Link
              href="/account"
              className="px-8 py-3 bg-foreground text-background text-sm tracking-widest uppercase hover:bg-moss transition-colors font-sans"
            >
              會員中心
            </Link>
            <Link
              href="/experiences"
              className="px-8 py-3 border border-border text-foreground text-sm tracking-widest uppercase hover:bg-mist transition-colors font-sans"
            >
              繼續探索
            </Link>
            {isFailed && (
              <Link
                href={firstItem ? `/experiences/${firstItem.courseId}` : "/experiences"}
                className="px-8 py-3 bg-gold-dust text-background text-sm tracking-widest uppercase hover:opacity-80 transition-opacity font-sans"
              >
                再次下單
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
