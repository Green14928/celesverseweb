// 幫「已付款但還沒開發票」的訂單補開發票
// 跑法：npm run test:retry:invoice
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { issueInvoice } from "../src/lib/ecpay/invoice";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const orders = await prisma.order.findMany({
    where: { paymentStatus: "PAID", invoices: { none: {} } },
    include: {
      member: true,
      items: { include: { course: { include: { template: true } } } },
    },
  });

  console.log(`找到 ${orders.length} 筆已付款但沒發票的訂單`);

  for (const order of orders) {
    const firstItem = order.items[0];
    const itemTitle = firstItem?.course.template.title ?? "CELESVERSE 課程";
    const carrierType =
      (order.invoiceCarrierType as
        | "NONE"
        | "MEMBER"
        | "MOBILE_BARCODE"
        | "CITIZEN_CARD"
        | "DONATION") ?? "NONE";
    const isDonation = carrierType === "DONATION";
    const customerName =
      order.invoiceType === "B2B" && order.invoiceBuyerName
        ? order.invoiceBuyerName
        : order.member.name;

    const result = await issueInvoice({
      relateNumber: order.orderNumber,
      taxType: "1",
      customerName,
      customerEmail: order.invoiceEmail ?? order.member.email,
      customerIdentifier:
        order.invoiceType === "B2B" ? order.invoiceBuyerTaxId ?? undefined : undefined,
      carrierType: isDonation ? "NONE" : carrierType,
      carrierNum: order.invoiceCarrierCode ?? undefined,
      donation: isDonation,
      loveCode: isDonation ? order.invoiceDonateCode ?? undefined : undefined,
      printFlag: order.invoiceType === "B2B" ? "1" : "0",
      itemName: itemTitle,
      itemCount: 1,
      itemPrice: order.totalAmount,
      itemAmount: order.totalAmount,
      totalAmount: order.totalAmount,
      invType: "07",
    });

    if (result.success && result.invoiceNumber) {
      const untaxed = Math.round(order.totalAmount / 1.05);
      const tax = order.totalAmount - untaxed;
      await prisma.invoice.create({
        data: {
          orderId: order.id,
          invoiceNumber: result.invoiceNumber,
          invoiceDate: result.invoiceDate
            ? new Date(result.invoiceDate.replace(" ", "T") + "+08:00")
            : new Date(),
          type: order.invoiceType,
          status: "ISSUED",
          amount: untaxed,
          taxAmount: tax,
          totalAmount: order.totalAmount,
          buyerName: customerName,
          buyerTaxId: order.invoiceBuyerTaxId,
          buyerEmail: order.invoiceEmail,
          carrierType: isDonation ? null : carrierType,
          carrierCode: order.invoiceCarrierCode,
          donateCode: isDonation ? order.invoiceDonateCode : null,
          ecpayResponse: result.raw as object,
        },
      });
      console.log(`✅ ${order.orderNumber} → 發票 ${result.invoiceNumber}`);
    } else {
      console.log(`❌ ${order.orderNumber}: ${result.error}`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
