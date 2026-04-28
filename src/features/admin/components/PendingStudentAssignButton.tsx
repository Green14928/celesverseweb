"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveStudentToCourse } from "@/features/admin/actions/course.action";

interface TargetCourse {
  id: string;
  title: string;
  startDate: string | null;
  remaining: number;
  isPublished: boolean;
}

interface Props {
  orderItemId: string;
  fromCourseId: string;
  studentName: string;
  targetCourses: TargetCourse[];
}

function formatDate(value: string | null) {
  if (!value) return "日期待定";
  return new Date(value).toLocaleDateString("zh-TW");
}

export function PendingStudentAssignButton({
  orderItemId,
  fromCourseId,
  studentName,
  targetCourses,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAssign() {
    const target = targetCourses.find((course) => course.id === targetId);
    if (!target) return;

    if (!confirm(`確定將「${studentName}」安排到「${target.title}」？`)) {
      return;
    }

    startTransition(async () => {
      try {
        await moveStudentToCourse(orderItemId, fromCourseId, targetId);
        setOpen(false);
        setTargetId("");
        router.refresh();
      } catch {
        alert("安排失敗，請確認目標課程是否還有名額");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className="op-btn"
        onClick={() => setOpen(true)}
        disabled={targetCourses.length === 0}
        title={targetCourses.length === 0 ? "目前沒有可安排的課程" : undefined}
      >
        安排
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <select
        className="select"
        value={targetId}
        onChange={(event) => setTargetId(event.target.value)}
        disabled={pending}
        style={{ maxWidth: 240, fontSize: 12, padding: "5px 28px 5px 8px" }}
      >
        <option value="">選擇課程</option>
        {targetCourses.map((course) => (
          <option key={course.id} value={course.id} disabled={course.remaining <= 0}>
            {course.title} / {formatDate(course.startDate)} / 剩 {course.remaining}
            {course.isPublished ? "" : " / 未發布"}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="op-btn"
        onClick={handleAssign}
        disabled={pending || !targetId}
      >
        {pending ? "安排中" : "確定"}
      </button>
      <button
        type="button"
        className="op-btn"
        onClick={() => {
          setOpen(false);
          setTargetId("");
        }}
        disabled={pending}
      >
        取消
      </button>
    </div>
  );
}
