import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { Prisma } from "@/generated/prisma/client";
import { orderStatusText, paymentText } from "@/lib/order-labels";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const paymentStatus = searchParams.get("paymentStatus") || "";
  const status = searchParams.get("status") || "";
  const invoice = searchParams.get("invoice") || "";

  const where: Prisma.OrderWhereInput = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { member: { name: { contains: search, mode: "insensitive" } } },
      { member: { email: { contains: search, mode: "insensitive" } } },
      { member: { phone: { contains: search } } },
    ];
  }

  if (startDate || endDate) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (startDate) createdAt.gte = new Date(`${startDate}T00:00:00`);
    if (endDate) createdAt.lte = new Date(`${endDate}T23:59:59.999`);
    where.createdAt = createdAt;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus as
      | "PENDING"
      | "PAID"
      | "FAILED"
      | "REFUND_PENDING"
      | "REFUNDED";
  }

  if (status) {
    where.status = status as
      | "PREPARING"
      | "COMPLETED"
      | "CANCELED";
  }

  if (invoice === "ISSUED") {
    where.invoices = { some: { status: "ISSUED" } };
  } else if (invoice === "UNISSUED") {
    where.invoices = { none: { status: "ISSUED" } };
  } else if (invoice === "VOIDED") {
    where.invoices = { some: { status: "VOIDED" } };
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
      paymentText[order.paymentStatus] || order.paymentStatus,
      orderStatusText[order.status] || order.status,
      new Date(order.createdAt).toLocaleDateString("zh-TW"),
    ].join(",");
  });

  const csv = BOM + header + "\n" + rows.join("\n");

  const filename = startDate || endDate
    ? `orders_${startDate || "start"}_${endDate || "today"}.csv`
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
