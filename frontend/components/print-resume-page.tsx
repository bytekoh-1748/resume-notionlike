"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Resume } from "../lib/types";
import { ResumeRenderer } from "./resume-renderer";

export function PrintResumePage({ id }: { id: string }) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .getResume(id)
      .then(setResume)
      .catch(() => setError(true));
  }, [id]);

  if (error) return <div className="full-page-message">문서를 불러오지 못했습니다.</div>;
  if (!resume) return <div className="full-page-message">PDF를 준비하는 중입니다…</div>;
  return (
    <main className="print-shell">
      <ResumeRenderer document={resume.draft_document} mode="print" />
    </main>
  );
}
