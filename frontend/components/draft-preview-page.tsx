"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileQuestion } from "lucide-react";
import { api } from "../lib/api";
import type { Resume } from "../lib/types";
import { ResumeRenderer } from "./resume-renderer";

export function DraftPreviewPage({ id }: { id: string }) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .getResume(id)
      .then(setResume)
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <main className="public-error">
        <FileQuestion size={32} />
        <h1>미리볼 문서를 찾을 수 없습니다</h1>
        <Link href="/">문서 목록으로</Link>
      </main>
    );
  }

  if (!resume) return <div className="full-page-message">미리보기를 준비하는 중입니다…</div>;

  return (
    <main className="public-shell draft-preview-shell">
      <header className="public-toolbar draft-preview-toolbar">
        <Link className="secondary-button" href={`/editor/${resume.id}`}>
          <ArrowLeft size={16} /> 편집으로
        </Link>
        <strong className="draft-preview-title">{resume.title}</strong>
        <a className="secondary-button" href={api.pdfUrl(resume.id)}>
          <Download size={16} /> PDF 다운로드
        </a>
      </header>
      <ResumeRenderer document={resume.draft_document} mode="public" />
    </main>
  );
}
