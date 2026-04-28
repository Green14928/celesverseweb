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
  const [coverUploading, setCoverUploading] = useState(false);
  const [contentUploading, setContentUploading] = useState(false);
  const initialCategoryName =
    categories.find((cat) => cat.id === defaultValues?.categoryId)?.name ?? "";
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // images[0] = 封面；images[1..] = 內容圖
  const coverImage = images[0] ?? null;
  const contentImages = images.slice(1);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    setError(null);

    try {
      const url = await uploadImage(file);
      setImages((prev) => {
        if (prev.length === 0) return [url];
        const next = [...prev];
        next[0] = url;
        return next;
      });
    } catch {
      setError("封面上傳失敗，請稍後再試");
    }

    setCoverUploading(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function removeCover() {
    setImages((prev) => prev.slice(1));
  }

  async function handleContentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setContentUploading(true);
    setError(null);

    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const url = await uploadImage(file);
        newUrls.push(url);
      } catch {
        setError("內容圖片上傳失敗，請稍後再試");
      }
    }

    if (newUrls.length > 0) {
      setImages((prev) => {
        // 還沒有封面時，第一張新圖當封面
        if (prev.length === 0) return newUrls;
        return [...prev, ...newUrls];
      });
    }
    setContentUploading(false);
    if (contentInputRef.current) contentInputRef.current.value = "";
  }

  function removeContentImage(contentIndex: number) {
    // contentIndex 是 contentImages 的 index，對應到 images 的 index = contentIndex + 1
    const realIndex = contentIndex + 1;
    setImages((prev) => prev.filter((_, i) => i !== realIndex));
  }

  function handleDragStart(contentIndex: number) {
    setDragIndex(contentIndex);
  }

  function handleDragOver(e: React.DragEvent, contentIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === contentIndex) return;
    setImages((prev) => {
      // 只在 contentImages（prev[1..]）之間搬移，不動封面 prev[0]
      const content = prev.slice(1);
      const next = [...content];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(contentIndex, 0, moved);
      return [prev[0], ...next];
    });
    setDragIndex(contentIndex);
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
        categoryName,
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
        <input
          type="text"
          className="input"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          list="course-category-options"
          placeholder="輸入或搜尋分類名稱"
          style={{ width: "12em", maxWidth: "100%" }}
        />
        <datalist id="course-category-options">
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name} />
          ))}
        </datalist>
        <p style={{ ...hintStyle, marginTop: 6, marginBottom: 0 }}>
          可直接輸入搜尋；如果儲存時找不到同名分類，會自動建立新分類。
        </p>
      </div>

      {/* 課程封面 — 單張大圖，顯示在課程頁最上方 */}
      <div>
        <label style={labelStyle}>課程封面</label>
        <p style={hintStyle}>
          單張封面圖，會放在課程頁最上方的大 banner。建議用橫向構圖。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {coverImage ? (
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 480,
                aspectRatio: "16/9",
                borderRadius: 8,
                overflow: "hidden",
                border: "2px solid var(--admin-accent)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt="封面"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  background: "var(--admin-accent)",
                  color: "var(--admin-bg-card)",
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 3,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}
              >
                封面
              </span>
              <button
                type="button"
                onClick={removeCover}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "rgba(26, 24, 22, 0.75)",
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                maxWidth: 480,
                aspectRatio: "16/9",
                borderRadius: 8,
                border: "2px dashed var(--admin-border)",
                display: "grid",
                placeItems: "center",
                color: "var(--admin-text-muted)",
                fontSize: 13,
              }}
            >
              尚未上傳封面
            </div>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleCoverUpload}
            disabled={coverUploading}
            style={{ fontSize: 12, color: "var(--admin-text-muted)" }}
          />
          {coverUploading && (
            <p style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
              封面上傳中...
            </p>
          )}
        </div>
      </div>

      {/* 課程內容圖片 — 多張，會接在說明欄下方一張張往下滾 */}
      <div>
        <label style={labelStyle}>課程內容圖片</label>
        <p style={hintStyle}>
          可上傳多張，拖曳排序。會接在「關於這門課」說明下方，一張接一張往下顯示（電商長頁）。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contentImages.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {contentImages.map((url, i) => (
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
                        : "2px solid var(--admin-border)",
                    opacity: dragIndex === i ? 0.5 : 1,
                    cursor: "grab",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`內容圖 ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      pointerEvents: "none",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: 4,
                      left: 4,
                      background: "rgba(26, 24, 22, 0.75)",
                      color: "#fff",
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 3,
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeContentImage(i)}
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
            ref={contentInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleContentUpload}
            disabled={contentUploading}
            style={{ fontSize: 12, color: "var(--admin-text-muted)" }}
          />
          {contentUploading && (
            <p style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
              上傳中...
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
        <button
          type="submit"
          disabled={isSubmitting || coverUploading || contentUploading}
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
