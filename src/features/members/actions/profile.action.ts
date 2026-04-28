// 會員資料相關 Server Actions
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Gender } from "@/generated/prisma/enums";

async function requireMember() {
  const session = await auth();
  if (!session || session.user.userType !== "member") {
    redirect("/login");
  }
  return session.user.id;
}

export type ProfileFormData = {
  name: string;
  email?: string;
  gender: Gender;
  birthday: string; // YYYY-MM-DD
  phone: string;
  address: string;
  lineId?: string;
};

export type ProfileActionResult =
  | { success: true }
  | { success: false; error: string };

function validate(data: ProfileFormData): string | null {
  if (!data.name.trim()) return "請填姓名";
  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();
    if (!email) return "請填 Email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email 格式不對";
  }
  if (!["MALE", "FEMALE", "OTHER"].includes(data.gender)) return "性別欄位不對";
  if (!data.birthday || isNaN(Date.parse(data.birthday))) return "生日格式不對";
  if (!data.phone.trim()) return "請填電話";
  if (!/^[0-9+\-\s()]{6,20}$/.test(data.phone.trim()))
    return "電話格式不對（只接受數字與 +、-、空格）";
  if (!data.address.trim()) return "請填地址";
  return null;
}

export async function completeProfile(
  data: ProfileFormData,
): Promise<ProfileActionResult> {
  const memberId = await requireMember();

  const err = validate(data);
  if (err) return { success: false, error: err };

  await prisma.member.update({
    where: { id: memberId },
    data: {
      name: data.name.trim(),
      gender: data.gender,
      birthday: new Date(data.birthday),
      phone: data.phone.trim(),
      address: data.address.trim(),
      lineId: data.lineId?.trim() || null,
      profileCompletedAt: new Date(),
    },
  });

  revalidatePath("/account");
  return { success: true };
}

export async function updateProfile(
  data: ProfileFormData,
): Promise<ProfileActionResult> {
  const memberId = await requireMember();

  const err = validate(data);
  if (err) return { success: false, error: err };

  const email = data.email?.trim().toLowerCase();
  if (email) {
    const existing = await prisma.member.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing && existing.id !== memberId) {
      return { success: false, error: "這個 Email 已經被其他會員使用" };
    }
  }

  const current = await prisma.member.findUnique({
    where: { id: memberId },
    select: { gender: true },
  });
  if (!current) return { success: false, error: "會員資料不存在" };

  await prisma.member.update({
    where: { id: memberId },
    data: {
      name: data.name.trim(),
      ...(email ? { email } : {}),
      gender: current.gender ?? data.gender,
      birthday: new Date(data.birthday),
      phone: data.phone.trim(),
      address: data.address.trim(),
      lineId: data.lineId?.trim() || null,
    },
  });

  revalidatePath("/account");
  return { success: true };
}

export async function markLineOfficialAdded(): Promise<ProfileActionResult> {
  const memberId = await requireMember();
  await prisma.member.update({
    where: { id: memberId },
    data: { lineOfficialAddedAt: new Date() },
  });
  revalidatePath("/");
  return { success: true };
}

export async function dismissLinePromo(): Promise<ProfileActionResult> {
  const memberId = await requireMember();
  await prisma.member.update({
    where: { id: memberId },
    data: { linePromoDismissedAt: new Date() },
  });
  return { success: true };
}
