// 課程模板新增/編輯表單
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { saveTemplate } from "@/features/admin/actions/course-template.action";

interface CourseTemplateFormProps {
  templateId?: string;
  defaultValues?: {
    title: string;
    description: string;
    content: string | null;
    categoryId: string | null;
  };
  existingImages?: string[];
  categories: Array<{ id: string; name: string }>;
}

export function CourseTemplateForm({
  templateId,
  defaultValues,
  existingImages,
  categories,
}: CourseTemplateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(existingImages ?? []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        newUrls.push(blob.url);
      } catch {
        setError("上傳失敗，請稍後再試");
      }
    }

    if (newUrls.length > 0) {
      setImages((prev) => [...prev, ...newUrls]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const result = await saveTemplate(
      {
        title: fd.get("title") as string,
        description: fd.get("description") as string,
        content: fd.get("content") as string,
        categoryId: (fd.get("categoryId") as string) || undefined,
        images,
      },
      templateId
    );

    if (result.success) {
      router.push("/admin/templates");
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
          課程名稱 *
        </label>
        <input
          name="title"
          required
          defaultValue={defaultValues?.title}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          課程簡介 *
        </label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={defaultValues?.description}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          課程內容（詳細說明）
        </label>
        <textarea
          name="content"
          rows={5}
          defaultValue={defaultValues?.content ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          分類
        </label>
        <select
          name="categoryId"
          defaultValue={defaultValues?.categoryId ?? ""}
          className={inputClass}
        >
          <option value="">無分類</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* 多圖上傳 */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          課程圖片
        </label>
        <p className="text-xs text-zinc-400 mt-0.5 mb-2">
          可上傳多張，拖曳排序。第一張為封面圖。排課時自動帶入。
        </p>
        <div className="mt-1 space-y-3">
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`relative w-28 aspect-[4/5] rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${
                    dragIndex === i
                      ? "border-zinc-400 opacity-50"
                      : i === 0
                        ? "border-gold-dust"
                        : "border-zinc-200"
                  }`}
                >
                  <img
                    src={url}
                    alt={`圖片 ${i + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-gold-dust text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      封面
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-zinc-900/70 text-white rounded-full text-xs flex items-center justify-center hover:bg-zinc-900"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleImageUpload}
            disabled={uploading}
            className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-50"
          />
          {uploading && (
            <p className="text-xs text-zinc-400">上傳中...</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting
            ? "儲存中..."
            : templateId
              ? "更新模板"
              : "建立模板"}
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
