// 排課表單 — 選擇模板 + 填寫排程資訊
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { saveCourse } from "@/features/admin/actions/course.action";

const CALENDAR_COLORS = [
  { name: "深綠", value: "#1B5B4A" },
  { name: "翡翠", value: "#2D8B78" },
  { name: "金橘", value: "#D4943A" },
  { name: "赤土", value: "#8B5E3C" },
  { name: "靛藍", value: "#3B5998" },
  { name: "紫羅蘭", value: "#7C3AED" },
  { name: "玫紅", value: "#BE185D" },
  { name: "石墨", value: "#4B5563" },
  { name: "珊瑚", value: "#F97316" },
  { name: "湖水藍", value: "#0891B2" },
  { name: "翠綠", value: "#10B981" },
  { name: "紅色", value: "#DC2626" },
];

interface Template {
  id: string;
  title: string;
  description: string;
  category?: { name: string } | null;
  images?: Array<{ url: string }>;
}

interface CourseFormProps {
  courseId?: string;
  defaultValues?: {
    templateId: string;
    price: number;
    teacherId: string | null;
    totalSlots: number;
    location: string | null;
    calendarColor: string | null;
    paymentLink: string | null;
    startDate: Date | null;
    endDate: Date | null;
  };
  templates: Template[];
  teachers: Array<{ id: string; name: string }>;
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
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

export function CourseForm({
  courseId,
  defaultValues,
  templates,
  teachers,
}: CourseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    defaultValues?.templateId ?? ""
  );
  const [calendarColor, setCalendarColor] = useState<string | null>(
    defaultValues?.calendarColor ?? null
  );

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!selectedTemplateId) {
      setError("請選擇課程模板");
      setIsSubmitting(false);
      return;
    }

    const fd = new FormData(e.currentTarget);

    const result = await saveCourse(
      {
        templateId: selectedTemplateId,
        price: Number(fd.get("price")),
        teacherId: (fd.get("teacherId") as string) || undefined,
        totalSlots: Number(fd.get("totalSlots")),
        location: (fd.get("location") as string) || undefined,
        calendarColor: calendarColor || undefined,
        paymentLink: (fd.get("paymentLink") as string) || undefined,
        startDate: fd.get("startDate") as string,
        endDate: fd.get("endDate") as string,
      },
      courseId
    );

    if (result.success) {
      router.push("/admin");
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
        <label style={labelStyle}>課程模板 *</label>
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="select"
          style={{ width: "100%" }}
        >
          <option value="">請選擇課程</option>
          {templates.map((tmpl) => (
            <option key={tmpl.id} value={tmpl.id}>
              {tmpl.title}
              {tmpl.category ? ` (${tmpl.category.name})` : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedTemplate && (
        <div
          style={{
            background: "var(--admin-bg)",
            border: "1px solid var(--admin-border)",
            borderRadius: 8,
            padding: 14,
          }}
        >
          <div style={{ display: "flex", gap: 14 }}>
            {selectedTemplate.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedTemplate.images[0].url}
                alt={selectedTemplate.title}
                style={{
                  width: 72,
                  height: 72,
                  objectFit: "cover",
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>
                {selectedTemplate.title}
              </p>
              {selectedTemplate.category && (
                <p
                  className="muted"
                  style={{ fontSize: 11, marginTop: 2, marginBottom: 0 }}
                >
                  {selectedTemplate.category.name}
                </p>
              )}
              <p
                className="muted"
                style={{
                  fontSize: 12,
                  marginTop: 6,
                  marginBottom: 0,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {selectedTemplate.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <hr className="hair" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <div>
          <label style={labelStyle}>價格（NT$）*</label>
          <input
            name="price"
            type="number"
            min={1}
            required
            defaultValue={defaultValues?.price}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <label style={labelStyle}>總名額 *</label>
          <input
            name="totalSlots"
            type="number"
            min={1}
            required
            defaultValue={defaultValues?.totalSlots}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>授課導師</label>
        <select
          name="teacherId"
          defaultValue={defaultValues?.teacherId ?? ""}
          className="select"
          style={{ width: "100%" }}
        >
          <option value="">未指定</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>上課地點</label>
        <input
          name="location"
          defaultValue={defaultValues?.location ?? ""}
          placeholder="例如：台北市大安區..."
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>開課日期</label>
          <input
            name="startDate"
            type="date"
            defaultValue={formatDate(defaultValues?.startDate ?? null)}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <label style={labelStyle}>結束日期</label>
          <input
            name="endDate"
            type="date"
            defaultValue={formatDate(defaultValues?.endDate ?? null)}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>付款連結</label>
        <p style={hintStyle}>
          輸入第三方付款頁面的網址（如綠界、藍新）
        </p>
        <input
          name="paymentLink"
          type="url"
          defaultValue={defaultValues?.paymentLink ?? ""}
          placeholder="https://..."
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label style={labelStyle}>行事曆顏色</label>
        <p style={hintStyle}>不選則使用分類預設</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setCalendarColor(null)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: !calendarColor
                ? "2px solid var(--admin-ink)"
                : "2px solid var(--admin-border)",
              background: !calendarColor
                ? "var(--admin-ink-tint)"
                : "var(--admin-bg-card)",
              fontSize: 11,
              cursor: "pointer",
              color: "var(--admin-text-secondary)",
              fontFamily: "inherit",
            }}
            title="使用分類預設"
          >
            自動
          </button>
          {CALENDAR_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => setCalendarColor(c.value)}
              style={{
                position: "relative",
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: c.value,
                border:
                  calendarColor === c.value
                    ? "2px solid #fff"
                    : `2px solid ${c.value}`,
                boxShadow:
                  calendarColor === c.value ? `0 0 0 2px ${c.value}` : undefined,
                cursor: "pointer",
                transition: "transform 0.15s ease",
              }}
            >
              {calendarColor === c.value && (
                <Check
                  style={{
                    position: "absolute",
                    inset: 0,
                    margin: "auto",
                    width: 14,
                    height: 14,
                    color: "#fff",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? "儲存中..." : courseId ? "更新排程" : "建立排程"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn">
          取消
        </button>
      </div>
    </form>
  );
}
