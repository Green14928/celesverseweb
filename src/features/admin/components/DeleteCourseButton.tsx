// 課程刪除按鈕（含確認）
"use client";

import { deleteCourse } from "@/features/admin/actions/course.action";
import { useTransition } from "react";

export function DeleteCourseButton({
  courseId,
  courseName,
}: {
  courseId: string;
  courseName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`確定要刪除「${courseName}」嗎？此操作無法復原。`)) return;
    startTransition(async () => {
      try {
        await deleteCourse(courseId);
      } catch (error) {
        alert(error instanceof Error ? error.message : "刪除失敗");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className="op-btn danger"
    >
      {isPending ? "…" : "刪除"}
    </button>
  );
}
