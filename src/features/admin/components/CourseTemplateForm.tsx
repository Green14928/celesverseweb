// 課程模板新增/編輯表單
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/upload";
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 6,
  letterSpacing: 0.5,
};

const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--admin-text-muted)",
  marginTop: -4,
  marginBottom: 8,
  lineHeight: 1.6,
};

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
        const url = await uploadImage(file);
        newUrls.push(url);
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

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            background: "var(--admin-red-light)",
            color: "var(--admin-red)",
            fontSize: 13,
            border: "1px solid rgba(192, 86, 75, 0.25)",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle}>課程名稱 *</label>
        <input
          name="title"
          required
          defaultValue={defaultValues?.title}
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label style={labelStyle}>課程簡介 *</label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={defaultValues?.description}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>

      <div>
        <label style={labelStyle}>課程內容（詳細說明）</label>
        <textarea
          name="content"
          rows={5}
          defaultValue={defaultValues?.content ?? ""}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>

      <div>
        <label style={labelStyle}>分類</label>
        <select
          name="categoryId"
          defaultValue={defaultValues?.categoryId ?? ""}
          className="select"
          style={{ width: "100%" }}
        >
          <option value="">無分類</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>課程圖片</label>
        <p style={hintStyle}>
          可上傳多張，拖曳排序。第一張為封面圖。排課時自動帶入。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {images.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {images.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  style={{
                    position: "relative",
                    width: 112,
                    aspectRatio: "4/5",
                    borderRadius: 8,
                    overflow: "hidden",
                    border:
                      dragIndex === i
                        ? "2px solid var(--admin-text-muted)"
                        : i === 0
                          ? "2px solid var(--admin-accent)"
                          : "2px solid var(--admin-border)",
                    opacity: dragIndex === i ? 0.5 : 1,
                    cursor: "grab",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`圖片 ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      pointerEvents: "none",
                    }}
                  />
                  {i === 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 4,
                        background: "var(--admin-accent)",
                        color: "var(--admin-bg-card)",
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 3,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                      }}
                    >
                      封面
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "rgba(26, 24, 22, 0.75)",
                      color: "#fff",
                      border: "none",
                      fontSize: 11,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
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
            style={{ fontSize: 12, color: "var(--admin-text-muted)" }}
          />
          {uploading && (
            <p style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
              上傳中...
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="btn btn-primary"
        >
          {isSubmitting
            ? "儲存中..."
            : templateId
              ? "更新模板"
              : "建立模板"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn">
          取消
        </button>
      </div>
    </form>
  );
}
