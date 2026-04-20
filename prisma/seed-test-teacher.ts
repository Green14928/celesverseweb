// 建測試老師 + 綁到現有測試課程
// 跑法：npm run test:seed:teacher
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // 1. 建老師
  const teacherName = "【測試】水晶療癒師 Luna";
  let teacher = await prisma.teacher.findFirst({ where: { name: teacherName } });
  if (!teacher) {
    teacher = await prisma.teacher.create({
      data: {
        name: teacherName,
        title: "資深水晶能量療癒師",
        bio: "十年水晶療癒經驗，擅長能量淨化與脈輪平衡。",
        sortOrder: 1,
      },
    });
    console.log(`[seed] 建立測試老師：${teacher.name} (id: ${teacher.id})`);
  } else {
    console.log(`[seed] 測試老師已存在：${teacher.name}`);
  }

  // 2. 把現有所有沒綁老師的已發布課程都綁上這位老師
  const updated = await prisma.course.updateMany({
    where: { teacherId: null, isPublished: true },
    data: { teacherId: teacher.id },
  });
  console.log(`[seed] 綁定 ${updated.count} 堂沒老師的課程到 ${teacher.name}`);

  // 3. 列出這位老師目前所有課
  const courses = await prisma.course.findMany({
    where: { teacherId: teacher.id },
    include: { template: { select: { title: true } } },
  });
  console.log("");
  console.log(`✅ ${teacher.name} 的課表：`);
  for (const c of courses) {
    console.log(
      `   - ${c.template.title} (${c.startDate?.toISOString().slice(0, 10) ?? "未排"}) price=${c.price}`,
    );
  }
  console.log("");
  console.log(`👉 課務統計頁：http://localhost:3001/admin/teachers/${teacher.id}/stats`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
