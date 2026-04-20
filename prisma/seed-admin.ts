// Seed 第一個 SUPER_ADMIN（Amy）
// 使用方式：npm run test:seed:admin
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const AMY_EMAIL = "amyclaw4928@gmail.com";
const AMY_NAME = "Amy";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.admin.findUnique({
    where: { email: AMY_EMAIL },
  });

  if (existing) {
    console.log(`✅ Admin 已存在：${AMY_EMAIL}（${existing.role}）`);
    return;
  }

  const admin = await prisma.admin.create({
    data: {
      email: AMY_EMAIL,
      name: AMY_NAME,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`✅ 建立最高管理員：${admin.email}（${admin.role}）`);
  console.log("   現在可以用此 Google 帳號登入 /admin/login");
}

main()
  .catch((e) => {
    console.error("❌ Seed 失敗:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
