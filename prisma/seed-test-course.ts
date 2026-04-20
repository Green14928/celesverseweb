// 幫用戶建一筆測試課程 + 把 Amy 從 Admin 表改成 Member，方便測購買流程
// 跑法：npm run test:seed:course
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const AMY_EMAIL = "amyclaw4928@gmail.com";

  // 1. 確保有一個 Category
  let category = await prisma.category.findFirst({ where: { name: "身心療癒" } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: "身心療癒", sortOrder: 1 },
    });
  }

  // 2. 建 CourseTemplate
  const templateTitle = "【測試】水晶能量療癒工作坊";
  let template = await prisma.courseTemplate.findFirst({
    where: { title: templateTitle },
  });
  if (!template) {
    template = await prisma.courseTemplate.create({
      data: {
        title: templateTitle,
        description: "綠界金流串接測試用課程。請勿真的付費。",
        content: "這是一堂測試課程，用來驗證綠界金流是否正常。",
        categoryId: category.id,
      },
    });
  }

  // 3. 建 Course（確保有一筆 isPublished）
  const existingCourse = await prisma.course.findFirst({
    where: { templateId: template.id, isPublished: true },
  });
  if (!existingCourse) {
    await prisma.course.create({
      data: {
        templateId: template.id,
        price: 1200,
        totalSlots: 99,
        soldCount: 0,
        isPublished: true,
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-05-01"),
        location: "線上（測試用）",
      },
    });
  }

  // 4. Amy 的身份切換：先把 Admin 的 Amy 停用（不刪除），再建 Member
  const amyAdmin = await prisma.admin.findUnique({ where: { email: AMY_EMAIL } });
  if (amyAdmin?.isActive) {
    await prisma.admin.update({
      where: { email: AMY_EMAIL },
      data: { isActive: false },
    });
    console.log(`[seed] Amy (${AMY_EMAIL}) Admin 身份暫時停用`);
  }

  const amyMember = await prisma.member.findUnique({ where: { email: AMY_EMAIL } });
  if (!amyMember) {
    await prisma.member.create({
      data: {
        email: AMY_EMAIL,
        name: "Amy 測試會員",
        profileCompletedAt: new Date(), // 直接標已完成，跳過補資料頁
      },
    });
    console.log(`[seed] 建立 Amy 的 Member 帳號`);
  } else {
    console.log(`[seed] Amy Member 已存在`);
  }

  const course = await prisma.course.findFirst({
    where: { templateId: template.id, isPublished: true },
    select: { id: true },
  });

  console.log("");
  console.log("✅ 測試資料已備好");
  console.log("");
  console.log("👉 下一步：");
  console.log("   1. 先用瀏覽器開 http://localhost:3001/login");
  console.log("   2. 用 Google 登入（amyclaw4928@gmail.com）");
  console.log(`   3. 登入後到 http://localhost:3001/experiences/${course?.id}`);
  console.log("   4. 點「立即報名」→ 選發票類型 → 前往付款");
  console.log("");
  console.log("💳 綠界測試卡號：4311-9522-2222-2222");
  console.log("   有效期：任何未來日期（例如 12/30）");
  console.log("   CVV：222");
  console.log("   3D 密碼：1234");
  console.log("");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
