"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const adminId = await getSession();
  if (!adminId) redirect("/admin/login");
  return adminId;
}

export async function getTemplates() {
  return prisma.courseTemplate.findMany({
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      _count: { select: { courses: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTemplate(id: string) {
  return prisma.courseTemplate.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

interface TemplateFormData {
  title: string;
  description: string;
  content?: string;
  categoryId?: string;
  categoryName?: string;
  images?: string[];
}

export type SaveTemplateResult =
  | { success: true; templateId: string }
  | { success: false; error: string };

export async function saveTemplate(
  data: TemplateFormData,
  templateId?: string
): Promise<SaveTemplateResult> {
  await requireAdmin();

  if (!data.title.trim() || !data.description.trim()) {
    return { success: false, error: "請填寫課程名稱和描述" };
  }

  try {
    let categoryId = data.categoryId?.trim() || null;
    const newCategoryName = data.categoryName?.trim();

    if (newCategoryName) {
      const existingCategory = await prisma.category.findUnique({
        where: { name: newCategoryName },
        select: { id: true },
      });

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const maxCategory = await prisma.category.findFirst({
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        });
        const category = await prisma.category.create({
          data: {
            name: newCategoryName,
            sortOrder: (maxCategory?.sortOrder ?? -1) + 1,
          },
          select: { id: true },
        });
        categoryId = category.id;
      }
    }

    const templateData = {
      title: data.title.trim(),
      description: data.description.trim(),
      content: data.content?.trim() || null,
      categoryId,
    };

    let id: string;
    if (templateId) {
      const updated = await prisma.courseTemplate.update({
        where: { id: templateId },
        data: {
          title: templateData.title,
          description: templateData.description,
          content: templateData.content,
          category: templateData.categoryId
            ? { connect: { id: templateData.categoryId } }
            : { disconnect: true },
        },
      });
      id = updated.id;
    } else {
      const created = await prisma.courseTemplate.create({
        data: templateData,
      });
      id = created.id;
    }

    // 同步圖片
    if (data.images !== undefined) {
      await prisma.courseTemplateImage.deleteMany({
        where: { templateId: id },
      });
      if (data.images.length > 0) {
        await prisma.courseTemplateImage.createMany({
          data: data.images.map((url, i) => ({
            templateId: id,
            url,
            sortOrder: i,
          })),
        });
      }
    }

    revalidatePath("/admin/templates");
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    return { success: true, templateId: id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("saveTemplate error:", msg);
    return { success: false, error: `模板儲存失敗：${msg}` };
  }
}

export async function toggleArchiveTemplate(
  templateId: string
): Promise<{ success: boolean }> {
  await requireAdmin();

  const tmpl = await prisma.courseTemplate.findUnique({
    where: { id: templateId },
    select: { isArchived: true },
  });
  if (!tmpl) return { success: false };

  await prisma.courseTemplate.update({
    where: { id: templateId },
    data: { isArchived: !tmpl.isArchived },
  });

  revalidatePath("/admin/templates");
  return { success: true };
}

export async function deleteTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  // 檢查是否有排程引用此模板
  const courseCount = await prisma.course.count({
    where: { templateId },
  });
  if (courseCount > 0) {
    return {
      success: false,
      error: `此模板有 ${courseCount} 門排程課程正在使用，無法刪除`,
    };
  }

  await prisma.courseTemplate.delete({ where: { id: templateId } });

  revalidatePath("/admin/templates");
  return { success: true };
}
