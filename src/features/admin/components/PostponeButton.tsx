"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  postponeCourse,
  cancelPostpone,
} from "@/features/admin/actions/course.action";

interface PostponeButtonProps {
  courseId: string;
  courseName: string;
  isPostponed: boolean;
  postponedTo: string | null;
}

export function PostponeButton({
  courseId,
  courseName,
  isPostponed,
  postponedTo,
}: PostponeButtonProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(postponedTo || "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePostpone() {
    if (!date) return;
    setLoading(true);
    await postponeCourse(courseId, date, note);
    setShowForm(false);
    router.refresh();
    setLoading(false);
  }

  async function handleCancel() {
    if (!confirm(`確定取消「${courseName}」的延期狀態？`)) return;
    setLoading(true);
    await cancelPostpone(courseId);
    router.refresh();
    setLoading(false);
  }

  if (isPostponed) {
    return (
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading}
        className="op-btn"
      >
        {loading ? "…" : "恢復"}
      </button>
    );
  }

  if (showForm) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 4px",
          background: "var(--admin-bg)",
          borderRadius: 6,
        }}
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ fontSize: 11, padding: "3px 6px" }}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="備註"
          style={{ fontSize: 11, padding: "3px 6px", width: 70 }}
        />
        <button
          type="button"
          onClick={handlePostpone}
          disabled={loading || !date}
          className="op-btn danger"
        >
          {loading ? "…" : "確定"}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="op-btn"
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setShowForm(true)} className="op-btn">
      延期
    </button>
  );
}
