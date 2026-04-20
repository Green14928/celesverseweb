// 課程上下架切換按鈕（iOS-style switch）
"use client";

import { togglePublish } from "@/features/admin/actions/course.action";
import { useTransition } from "react";

export function TogglePublishButton({
  courseId,
  isPublished,
}: {
  courseId: string;
  isPublished: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => togglePublish(courseId))}
      className={`switch ${isPublished ? "on" : ""}`}
      title={isPublished ? "點擊下架" : "點擊上架"}
    >
      <span className="track">
        <span className="knob" />
      </span>
      <span className="lbl">
        {isPending ? "…" : isPublished ? "已上架" : "未上架"}
      </span>
    </button>
  );
}
