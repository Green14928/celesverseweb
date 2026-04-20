"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/upload";
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
  marginBottom: 6,
  lineHeight: 1.6,
};

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
      const url = await uploadImage(file);
      setPhoto(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗，請稍後再試");
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
        <label style={labelStyle}>姓名 *</label>
        <input
          name="name"
          required
          defaultValue={defaultValues?.name}
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label style={labelStyle}>頭銜 / 專長</label>
        <input
          name="title"
          defaultValue={defaultValues?.title ?? ""}
          placeholder="例如：瑜伽導師 · 身心靈療癒師"
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label style={labelStyle}>簡短介紹</label>
        <p style={hintStyle}>顯示在卡片上的簡短描述</p>
        <textarea
          name="bio"
          rows={3}
          defaultValue={defaultValues?.bio ?? ""}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>

      <div>
        <label style={labelStyle}>完整故事</label>
        <p style={hintStyle}>
          用 ## 寫標題，「—」自動變金色。**文字** 粗體。&gt;&gt; 開頭置中。空行分段。
        </p>
        <textarea
          name="fullBio"
          rows={10}
          defaultValue={defaultValues?.fullBio ?? ""}
          style={{ width: "100%", resize: "vertical", fontFamily: "ui-monospace, monospace", fontSize: 12 }}
        />
      </div>

      <div>
        <label style={labelStyle}>導師的話 / Memo</label>
        <p style={hintStyle}>顯示在詳情頁底部的引言區塊</p>
        <textarea
          name="quote"
          rows={4}
          defaultValue={defaultValues?.quote ?? ""}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>

      <div>
        <label style={labelStyle}>照片</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {photo && (
            <div
              style={{
                position: "relative",
                width: 96,
                height: 96,
                borderRadius: "50%",
                overflow: "hidden",
                border: "1px solid var(--admin-border)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt="導師照片預覽"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
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
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handlePhotoUpload}
            disabled={uploading}
            style={{
              fontSize: 12,
              color: "var(--admin-text-muted)",
            }}
          />
          {uploading && (
            <p style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
              上傳中...
            </p>
          )}
        </div>
      </div>

      <div>
        <label style={labelStyle}>排序</label>
        <input
          name="sortOrder"
          type="number"
          defaultValue={defaultValues?.sortOrder ?? 0}
          style={{ width: 120 }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="btn btn-primary"
        >
          {isSubmitting
            ? "儲存中..."
            : teacherId
              ? "更新導師"
              : "新增導師"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn">
          取消
        </button>
      </div>
    </form>
  );
}
