// 管理員管理 Server Actions（僅 SUPER_ADMIN 可用）
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { AdminRole } from "@/generated/prisma/enums";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    redirect("/admin/login");
  }
  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("只有最高管理員可以執行此操作");
  }
  return session.user.id;
}

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createAdmin(
  email: string,
  name: string,
  role: AdminRole,
): Promise<AdminActionResult> {
  const creatorId = await requireSuperAdmin();

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (!trimmedEmail || !trimmedName) {
    return { success: false, error: "Email 跟姓名都要填" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { success: false, error: "Email 格式不對" };
  }

  const existing = await prisma.admin.findUnique({
    where: { email: trimmedEmail },
  });
  if (existing) {
    return { success: false, error: "這個 Email 已經在管理員名單內" };
  }

  await prisma.admin.create({
    data: {
      email: trimmedEmail,
      name: trimmedName,
      role,
      createdById: creatorId,
    },
  });

  revalidatePath("/admin/admins");
  return { success: true };
}

export async function toggleAdminActive(
  adminId: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  const operatorId = await requireSuperAdmin();

  if (adminId === operatorId) {
    return { success: false, error: "不能停用自己的帳號" };
  }

  await prisma.admin.update({
    where: { id: adminId },
    data: { isActive },
  });

  revalidatePath("/admin/admins");
  return { success: true };
}

export async function updateAdminRole(
  adminId: string,
  role: AdminRole,
): Promise<AdminActionResult> {
  const operatorId = await requireSuperAdmin();

  if (adminId === operatorId && role !== "SUPER_ADMIN") {
    return { success: false, error: "不能把自己降級" };
  }

  await prisma.admin.update({
    where: { id: adminId },
    data: { role },
  });

  revalidatePath("/admin/admins");
  return { success: true };
}
