"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTemplate } from "@/features/admin/actions/course-template.action";

export function DeleteTemplateButton({
  templateId,
  templateName,
  courseCount,
}: {
  templateId: string;
  templateName: string;
  courseCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (courseCount > 0) {
      alert(`此課程有 ${courseCount} 門排程正在使用，無法刪除。請先移除相關排程。`);
      return;
    }
    if (!confirm(`確定要刪除課程「${templateName}」嗎？`)) return;

    setLoading(true);
    const result = await deleteTemplate(templateId);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "刪除失敗");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="op-btn danger"
    >
      刪除
    </button>
  );
}
