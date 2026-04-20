import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { Prisma } from "@/generated/prisma/client";

const paymentLabels: Record<string, string> = {
  PENDING: "待付款",
  PAID: "已付款",
  FAILED: "付款失敗",
};

const statusLabels: Record<string, string> = {
  PENDING: "待付款",
  PAID: "已付款",
  REFUND_PENDING: "退費處理中",
  REFUNDED: "已退費",
  CANCELED: "已取消",
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const month = searchParams.get("month") || "";
  const paymentStatus = searchParams.get("paymentStatus") || "";
  const status = searchParams.get("status") || "";

  const where: Prisma.OrderWhereInput = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { member: { name: { contains: search, mode: "insensitive" } } },
      { member: { email: { contains: search, mode: "insensitive" } } },
      { member: { phone: { contains: search } } },
    ];
  }

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    where.createdAt = { gte: start, lt: end };
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus as "PENDING" | "PAID" | "FAILED";
  }

  if (status) {
    where.status = status as
      | "PENDING"
      | "PAID"
      | "REFUND_PENDING"
      | "REFUNDED"
      | "CANCELED";
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      member: { select: { name: true, email: true, phone: true } },
      items: {
        include: {
          course: {
            select: { template: { select: { title: true } } },
          },
        },
      },
    },
  });

  // 產生 CSV（加 BOM 讓 Excel/Google Sheets 正確顯示中文）
  const BOM = "\uFEFF";
  const header = "訂單編號,姓名,Email,電話,課程,金額,付款狀態,訂單狀態,建立日期";
  const rows = orders.map((order) => {
    const courses = order.items.map((i) => i.course.template.title).join("；");
    return [
      order.orderNumber,
      escapeCsv(order.member.name),
      order.member.email,
      order.member.phone || "",
      escapeCsv(courses),
      order.totalAmount,
      paymentLabels[order.paymentStatus] || order.paymentStatus,
      statusLabels[order.status] || order.status,
      new Date(order.createdAt).toLocaleDateString("zh-TW"),
    ].join(",");
  });

  const csv = BOM + header + "\n" + rows.join("\n");

  const filename = month
    ? `orders_${month}.csv`
    : `orders_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
