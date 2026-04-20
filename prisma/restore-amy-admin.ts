// 測完綠界後，把 Amy 的 Admin 身份重新啟用
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.admin.update({
    where: { email: "amyclaw4928@gmail.com" },
    data: { isActive: true },
  });
  console.log("✅ Amy 的 Admin 身份已恢復");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
