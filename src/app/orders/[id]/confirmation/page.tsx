// 訂單確認頁 — Silk & Shadow
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResendEmailButton } from "@/features/orders/components/ResendEmailButton";

export const dynamic = "force-dynamic";

const paymentMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待付款", color: "text-amber-500" },
  PAID: { label: "已付款", color: "text-emerald-500" },
  REFUNDED: { label: "已退款", color: "text-purple-500" },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          course: {
            include: {
              template: {
                select: {
                  title: true,
                  category: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const categoryName = order.items[0]?.course.template.category?.name;
  const payment = paymentMap[order.paymentStatus] ?? paymentMap.PENDING;
  const isPending = order.paymentStatus === "PENDING";

  return (
    <div className="pt-36 md:pt-44 pb-24 mx-6 md:mx-12 lg:mx-16">
      <div className="bg-background shadow-2xl max-w-2xl mx-auto py-16 px-6 md:px-12">
        {/* 成功圖示 */}
        <div className="text-center space-y-6 animate-float-up">
          <h1 className="text-3xl md:text-4xl font-serif font-light">
            我們已經收到您的報名！
          </h1>
          <p className="text-sm font-light text-foreground font-sans">
            {isPending
              ? <>請注意，完成付款後才算正式完成報名。<br />我們已寄送付款資訊至您的信箱，請於 3 天內完成付款。</>
              : "感謝您的報名，以下是您的訂單資訊。"}
          </p>
          <div className="h-px w-12 bg-gold-dust mx-auto" />
        </div>

        {/* 訂單資訊 */}
        <div className="mt-12 p-6 bg-mist/50 space-y-4 animate-float-up-delay">
          <div className="flex justify-between text-sm font-sans">
            <span className="text-muted-fg">訂單編號</span>
            <span className="font-mono text-xs text-foreground">{order.id}</span>
          </div>
          <div className="flex justify-between text-sm font-sans">
            <span className="text-muted-fg">付款狀態</span>
            <span className={`font-medium ${payment.color}`}>
              {payment.label}
            </span>
          </div>
          <div className="flex justify-between text-sm font-sans">
            <span className="text-muted-fg">姓名</span>
            <span className="text-foreground">{order.buyerName}</span>
          </div>
          <div className="flex justify-between text-sm font-sans">
            <span className="text-muted-fg">Email</span>
            <span className="text-foreground">{order.buyerEmail}</span>
          </div>
          {order.buyerPhone && (
            <div className="flex justify-between text-sm font-sans">
              <span className="text-muted-fg">電話</span>
              <span className="text-foreground">{order.buyerPhone}</span>
            </div>
          )}

          <div className="h-px bg-foreground/15" />

          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm font-sans bg-foreground/[0.2] -mx-2 px-2 py-2 rounded">
              <span className="text-muted-fg">報名課程</span>
              <span className="text-foreground">{item.course.template.title}</span>
            </div>
          ))}

          <div className="h-px bg-foreground/15" />

          <div className="flex justify-between text-lg">
            <span className="font-serif font-light">總計</span>
            <span className="font-sans font-light">
              NT$ {order.totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 警語 */}
        {isPending && (
          <p className="mt-6 text-xs text-center text-muted-fg font-sans leading-relaxed">
            付款前請確認訂單編號與姓名正確無誤，確認後再進行付款。<br />
            如有任何問題，請與我們聯繫。
          </p>
        )}


        {/* 重寄確認信 */}
        <div className="mt-6">
          <ResendEmailButton orderId={order.id} />
        </div>

        {/* 返回 */}
        <div className="mt-8 text-center animate-float-up-delay-2">
          <Link
            href="/experiences"
            className="inline-block px-12 py-4 border border-border text-foreground text-sm tracking-widest uppercase hover:bg-mist transition-colors duration-500 font-sans"
          >
            返回所有體驗課程
          </Link>
        </div>
      </div>
    </div>
  );
}
