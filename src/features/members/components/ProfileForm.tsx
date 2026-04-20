"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Gender } from "@/generated/prisma/enums";
import {
  completeProfile,
  updateProfile,
  type ProfileFormData,
} from "@/features/members/actions/profile.action";

type Initial = {
  name: string;
  gender: Gender | null;
  birthday: Date | null;
  phone: string | null;
  address: string | null;
  lineId: string | null;
};

type Props = {
  mode: "complete" | "edit";
  initial: Initial;
  successRedirect: string;
};

function toDateInputValue(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ProfileForm({ mode, initial, successRedirect }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    const data: ProfileFormData = {
      name: fd.get("name") as string,
      gender: fd.get("gender") as Gender,
      birthday: fd.get("birthday") as string,
      phone: fd.get("phone") as string,
      address: fd.get("address") as string,
      lineId: (fd.get("lineId") as string) || undefined,
    };

    startTransition(async () => {
      const action = mode === "complete" ? completeProfile : updateProfile;
      const result = await action(data);
      if (result.success) {
        if (mode === "complete") {
          router.push(successRedirect);
          router.refresh();
        } else {
          setSuccess(true);
          router.refresh();
        }
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          ✅ 已更新
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          姓名 <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={initial.name}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          性別 <span className="text-red-500">*</span>
        </label>
        <select
          name="gender"
          required
          defaultValue={initial.gender ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="" disabled>
            請選擇
          </option>
          <option value="FEMALE">女性</option>
          <option value="MALE">男性</option>
          <option value="OTHER">其他 / 不透露</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          生日 <span className="text-red-500">*</span>
        </label>
        <input
          name="birthday"
          type="date"
          required
          defaultValue={toDateInputValue(initial.birthday)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          電話 <span className="text-red-500">*</span>
        </label>
        <input
          name="phone"
          type="tel"
          required
          placeholder="例：0912345678"
          defaultValue={initial.phone ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          地址 <span className="text-red-500">*</span>
        </label>
        <input
          name="address"
          type="text"
          required
          placeholder="例：台北市信義區 OO 路 OO 號"
          defaultValue={initial.address ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          LINE ID <span className="text-zinc-400">(選填)</span>
        </label>
        <input
          name="lineId"
          type="text"
          placeholder="例：@amylaw123"
          defaultValue={initial.lineId ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <p className="mt-1 text-xs text-zinc-500">
          填寫後方便我們在 LINE 上聯絡你（上課通知、客服問答）
        </p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? mode === "complete"
              ? "建立中..."
              : "儲存中..."
            : mode === "complete"
              ? "完成註冊"
              : "儲存變更"}
        </button>
      </div>
    </form>
  );
}
