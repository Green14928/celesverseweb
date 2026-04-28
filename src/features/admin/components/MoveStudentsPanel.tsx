"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moveStudentsToCourse } from "@/features/admin/actions/course.action";
import { paymentText } from "@/lib/order-labels";

interface Student {
  orderItemId: string;
  name: string;
  email: string;
  paymentStatus: string;
}

interface TargetCourse {
  id: string;
  title: string;
  remaining: number;
  startDate: string | null;
}

interface MoveStudentsPanelProps {
  courseId: string;
  courseName: string;
  students: Student[];
  otherCourses: TargetCourse[];
}

const paymentColors: Record<string, string> = {
  PENDING: "text-amber-600",
  PAID: "text-emerald-600",
  FAILED: "text-red-600",
  REFUND_PENDING: "text-amber-600",
  REFUNDED: "text-purple-600",
};

export function MoveStudentsPanel({
  courseId,
  courseName,
  students,
  otherCourses,
}: MoveStudentsPanelProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetCourseId, setTargetCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleStudent(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => s.orderItemId)));
    }
  }

  async function handleMove() {
    if (selected.size === 0 || !targetCourseId) return;

    const target = otherCourses.find((c) => c.id === targetCourseId);
    if (!target) return;

    if (selected.size > target.remaining) {
      setError(`目標課程只剩 ${target.remaining} 個名額，無法移動 ${selected.size} 位學生`);
      return;
    }

    const names = students
      .filter((s) => selected.has(s.orderItemId))
      .map((s) => s.name)
      .join("、");

    if (
      !confirm(
        `確定將 ${names} 從「${courseName}」移動到「${target.title}」？`
      )
    )
      return;

    setLoading(true);
    setError("");

    const result = await moveStudentsToCourse(
      Array.from(selected),
      courseId,
      targetCourseId
    );

    if (result.success) {
      setSelected(new Set());
      setTargetCourseId("");
      router.refresh();
    } else {
      setError(result.error || "移動失敗");
    }

    setLoading(false);
  }

  if (students.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-200 p-6">
      <h2 className="text-lg font-semibold text-zinc-800 mb-1">
        學生轉移
      </h2>
      <p className="text-xs text-zinc-400 mb-4">
        選擇學生後移動到其他課程（適用於延期、換課等情況）
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* 學生勾選列表 */}
      <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 mb-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50">
          <input
            type="checkbox"
            checked={selected.size === students.length}
            onChange={selectAll}
            className="rounded"
          />
          <span className="text-xs text-zinc-500 font-medium">
            全選（{selected.size}/{students.length}）
          </span>
        </div>
        {students.map((s) => (
          <label
            key={s.orderItemId}
            className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.has(s.orderItemId)}
              onChange={() => toggleStudent(s.orderItemId)}
              className="rounded"
            />
            <span className="text-sm text-zinc-900 flex-1">{s.name}</span>
            <span className="text-xs text-zinc-400">{s.email}</span>
            <span
              className={`text-xs font-medium ${paymentColors[s.paymentStatus] || "text-zinc-400"}`}
            >
              {paymentText[s.paymentStatus] ?? "待付款"}
            </span>
          </label>
        ))}
      </div>

      {/* 目標課程選擇 + 移動按鈕 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500 shrink-0">移動到</span>
        <select
          value={targetCourseId}
          onChange={(e) => setTargetCourseId(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="">選擇目標課程</option>
          {otherCourses.map((c) => (
            <option
              key={c.id}
              value={c.id}
              disabled={c.remaining <= 0}
            >
              {c.title}
              {c.startDate && ` (${c.startDate})`}
              {` — 剩 ${c.remaining} 位`}
              {c.remaining <= 0 && " [額滿]"}
            </option>
          ))}
        </select>
        <button
          onClick={handleMove}
          disabled={loading || selected.size === 0 || !targetCourseId}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? "移動中..."
            : `移動 ${selected.size} 位學生`}
        </button>
      </div>
    </div>
  );
}
