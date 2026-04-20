// 複製課程按鈕
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { duplicateCourse } from "@/features/admin/actions/course.action";

interface DuplicateCourseButtonProps {
  courseId: string;
  courseName: string;
}

export function DuplicateCourseButton({
  courseId,
  courseName,
}: DuplicateCourseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    if (
      !confirm(
        `確定要複製「${courseName}」嗎？\n將建立一個未上架的副本，日期和報名人數會被清空。`,
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await duplicateCourse(courseId);

    if (result.success) {
      router.push(`/admin/courses/${result.courseId}/edit`);
      router.refresh();
    } else {
      alert(result.error);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDuplicate}
      disabled={loading}
      className="op-btn"
    >
      {loading ? "複製中…" : "複製"}
    </button>
  );
}
