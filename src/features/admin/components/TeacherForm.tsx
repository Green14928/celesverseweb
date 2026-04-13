"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { saveTeacher } from "@/features/admin/actions/teacher.action";

interface TeacherFormProps {
  teacherId?: string;
  defaultValues?: {
    name: string;
    title: string | null;
    bio: string | null;
    fullBio: string | null;
    quote: string | null;
    photo: string | null;
    sortOrder: number;
  };
}

export function TeacherForm({ teacherId, defaultValues }: TeacherFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(
    defaultValues?.photo ?? null
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setPhoto(blob.url);
    } catch {
      setError("上傳失敗，請稍後再試");
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const result = await saveTeacher(
      {
        name: fd.get("name") as string,
        title: fd.get("title") as string,
        bio: fd.get("bio") as string,
        fullBio: fd.get("fullBio") as string,
        quote: fd.get("quote") as string,
        photo: photo || undefined,
        sortOrder: Number(fd.get("sortOrder")) || 0,
      },
      teacherId
    );

    if (result.success) {
      router.push("/admin/teachers");
      router.refresh();
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          姓名 *
        </label>
        <input
          name="name"
          required
          defaultValue={defaultValues?.name}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          頭銜 / 專長
        </label>
        <input
          name="title"
          defaultValue={defaultValues?.title ?? ""}
          className={inputClass}
          placeholder="例如：瑜伽導師 · 身心靈療癒師"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          簡短介紹
        </label>
        <p className="text-xs text-zinc-400 mt-0.5 mb-1">
          顯示在卡片上的簡短描述
        </p>
        <textarea
          name="bio"
          rows={3}
          defaultValue={defaultValues?.bio ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          完整故事
        </label>
        <p className="text-xs text-zinc-400 mt-0.5 mb-1">
          用 ## 寫標題，「—」自動變金色。**文字** 粗體。&gt;&gt; 開頭置中。空行分段。
        </p>
        <textarea
          name="fullBio"
          rows={10}
          defaultValue={defaultValues?.fullBio ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          導師的話 / Memo
        </label>
        <p className="text-xs text-zinc-400 mt-0.5 mb-1">
          顯示在詳情頁底部的引言區塊
        </p>
        <textarea
          name="quote"
          rows={4}
          defaultValue={defaultValues?.quote ?? ""}
          className={inputClass}
        />
      </div>

      {/* 照片上傳 */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          照片
        </label>
        <div className="mt-1 space-y-3">
          {photo && (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border border-zinc-200">
              <img
                src={photo}
                alt="導師照片預覽"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-0 right-0 w-6 h-6 bg-zinc-900/70 text-white rounded-full text-xs flex items-center justify-center hover:bg-zinc-900"
              >
                ✕
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handlePhotoUpload}
            disabled={uploading}
            className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-50"
          />
          {uploading && <p className="text-xs text-zinc-400">上傳中...</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          排序
        </label>
        <input
          name="sortOrder"
          type="number"
          defaultValue={defaultValues?.sortOrder ?? 0}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting
            ? "儲存中..."
            : teacherId
            ? "更新導師"
            : "新增導師"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}
