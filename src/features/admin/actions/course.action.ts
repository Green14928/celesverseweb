// 管理後台 — 課程排程相關 Server Actions
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPostponeEmail } from "@/lib/email";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    redirect("/admin/login");
  }
  return session.user.id!;
}

export async function togglePublish(courseId: string) {
  await requireAdmin();

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return;

  await prisma.course.update({
    where: { id: courseId },
    data: { isPublished: !course.isPublished },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteCourse(courseId: string) {
  await requireAdmin();

  // 先刪除關聯的訂單項目
  await prisma.orderItem.deleteMany({ where: { courseId } });
  await prisma.course.delete({ where: { id: courseId } });

  revalidatePath("/admin");
  revalidatePath("/");
}

/** 標記延期 */
export async function postponeCourse(
  courseId: string,
  postponedTo: string,
  note?: string
) {
  await requireAdmin();

  // 取得課程資訊（含原日期、模板、報名學員）
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      template: {
        include: { category: { select: { name: true } } },
      },
    },
  });

  if (!course) return;

  const originalDate = course.startDate
    ? new Date(course.startDate).toLocaleDateString("zh-TW")
    : "未設定";

  await prisma.course.update({
    where: { id: courseId },
    data: {
      isPostponed: true,
      postponedTo: postponedTo ? new Date(postponedTo) : null,
      postponedNote: note?.trim() || null,
    },
  });

  // 寄延期通知信給所有報名學員（排除已取消的訂單）
  if (postponedTo) {
    const orderItems = await prisma.orderItem.findMany({
      where: { courseId },
      include: {
        order: {
          include: { member: { select: { name: true, email: true } } },
        },
      },
    });

    const newDateStr = new Date(postponedTo).toLocaleDateString("zh-TW");

    for (const item of orderItems) {
      if (item.order.status === "CANCELED") continue;
      try {
        await sendPostponeEmail({
          buyerName: item.order.member.name,
          buyerEmail: item.order.member.email,
          courseName: course.template.title,
          categoryName: course.template.category?.name,
          location: course.location ?? undefined,
          originalDate,
          newDate: newDateStr,
          note: note?.trim(),
        });
      } catch (err) {
        console.error(`延期通知寄信失敗 (${item.order.member.email}):`, err);
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

/** 移動學生到另一門課程 */
export async function moveStudentToCourse(
  orderItemId: string,
  fromCourseId: string,
  toCourseId: string
) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    const targetCourse = await tx.course.findUnique({
      where: { id: toCourseId },
    });
    if (!targetCourse) throw new Error("目標課程不存在");

    const remaining = targetCourse.totalSlots - targetCourse.soldCount;
    if (remaining <= 0) throw new Error("目標課程已額滿");

    await tx.orderItem.update({
      where: { id: orderItemId },
      data: {
        courseId: toCourseId,
        price: targetCourse.price,
      },
    });

    const orderItem = await tx.orderItem.findUnique({
      where: { id: orderItemId },
      select: { orderId: true },
    });
    if (orderItem) {
      const items = await tx.orderItem.findMany({
        where: { orderId: orderItem.orderId },
      });
      const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      await tx.order.update({
        where: { id: orderItem.orderId },
        data: { totalAmount: total },
      });
    }

    await tx.course.update({
      where: { id: fromCourseId },
      data: { soldCount: { decrement: 1 } },
    });

    await tx.course.update({
      where: { id: toCourseId },
      data: { soldCount: { increment: 1 } },
    });
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${fromCourseId}`);
  revalidatePath(`/admin/courses/${toCourseId}`);
  revalidatePath("/");
}

/** 批量移動學生 */
export async function moveStudentsToCourse(
  orderItemIds: string[],
  fromCourseId: string,
  toCourseId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    for (const itemId of orderItemIds) {
      await moveStudentToCourse(itemId, fromCourseId, toCourseId);
    }
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "移動失敗",
    };
  }
}

/** 取消延期（恢復正常） */
export async function cancelPostpone(courseId: string) {
  await requireAdmin();

  await prisma.course.update({
    where: { id: courseId },
    data: {
      isPostponed: false,
      postponedTo: null,
      postponedNote: null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

interface CourseFormData {
  templateId: string;
  price: number;
  teacherId?: string;
  totalSlots: number;
  location?: string;
  calendarColor?: string;
  paymentLink?: string;
  startDate?: string;
  endDate?: string;
}

export type SaveCourseResult =
  | { success: true; courseId: string }
  | { success: false; error: string };

export async function saveCourse(
  data: CourseFormData,
  courseId?: string
): Promise<SaveCourseResult> {
  await requireAdmin();

  if (!data.templateId) {
    return { success: false, error: "請選擇課程模板" };
  }
  if (data.price <= 0 || data.totalSlots <= 0) {
    return { success: false, error: "價格和名額必須大於 0" };
  }

  try {
    const teacherId = data.teacherId?.trim() || null;

    const baseData = {
      price: data.price,
      totalSlots: data.totalSlots,
      location: data.location?.trim() || null,
      calendarColor: data.calendarColor?.trim() || null,
      paymentLink: data.paymentLink?.trim() || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    };

    let id: string;
    if (courseId) {
      const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
          ...baseData,
          template: { connect: { id: data.templateId } },
          teacher: teacherId
            ? { connect: { id: teacherId } }
            : { disconnect: true },
        },
      });
      id = updated.id;
    } else {
      const created = await prisma.course.create({
        data: {
          ...baseData,
          templateId: data.templateId,
          teacherId,
        },
      });
      id = created.id;
    }

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, courseId: id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("saveCourse error:", msg);
    return { success: false, error: `排程儲存失敗：${msg}` };
  }
}

/** 複製排程（同模板，清空日期和 soldCount） */
export async function duplicateCourse(
  courseId: string
): Promise<SaveCourseResult> {
  await requireAdmin();

  try {
    const source = await prisma.course.findUnique({
      where: { id: courseId },
      include: { template: { select: { title: true } } },
    });
    if (!source) return { success: false, error: "找不到課程" };

    const newCourse = await prisma.course.create({
      data: {
        templateId: source.templateId,
        price: source.price,
        teacherId: source.teacherId,
        totalSlots: source.totalSlots,
        soldCount: 0,
        location: source.location,
        calendarColor: source.calendarColor,
        paymentLink: null,
        isPublished: false,
        startDate: null,
        endDate: null,
        isPostponed: false,
        postponedTo: null,
        postponedNote: null,
      },
    });

    revalidatePath("/admin");
    return { success: true, courseId: newCourse.id };
  } catch {
    return { success: false, error: "複製失敗，請稍後再試" };
  }
}
