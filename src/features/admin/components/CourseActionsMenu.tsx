"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DeleteCourseButton } from "@/features/admin/components/DeleteCourseButton";
import { DuplicateCourseButton } from "@/features/admin/components/DuplicateCourseButton";
import { PostponeButton } from "@/features/admin/components/PostponeButton";

interface CourseActionsMenuProps {
  courseId: string;
  courseName: string;
  isPostponed: boolean;
  postponedTo: string | null;
}

export function CourseActionsMenu({
  courseId,
  courseName,
  isPostponed,
  postponedTo,
}: CourseActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div className="course-actions-menu" ref={ref}>
      <button
        type="button"
        className="op-btn"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        編輯
      </button>
      {open && (
        <div className="course-actions-panel">
          <Link
            href={`/admin/courses/${courseId}/edit`}
            className="op-btn"
            onClick={() => setOpen(false)}
          >
            編輯課程
          </Link>
          <DuplicateCourseButton courseId={courseId} courseName={courseName} />
          <PostponeButton
            courseId={courseId}
            courseName={courseName}
            isPostponed={isPostponed}
            postponedTo={postponedTo}
          />
          <DeleteCourseButton courseId={courseId} courseName={courseName} />
        </div>
      )}
    </div>
  );
}
