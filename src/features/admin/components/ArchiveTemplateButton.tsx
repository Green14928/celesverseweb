"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleArchiveTemplate } from "@/features/admin/actions/course-template.action";

export function ArchiveTemplateButton({
  templateId,
  isArchived,
}: {
  templateId: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await toggleArchiveTemplate(templateId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="op-btn"
    >
      {isArchived ? "取消封存" : "封存"}
    </button>
  );
}
