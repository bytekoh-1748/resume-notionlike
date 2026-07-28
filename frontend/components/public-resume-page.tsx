"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileQuestion } from "lucide-react";
import { api } from "../lib/api";
import type { PublicResume } from "../lib/types";
import { ResumeRenderer } from "./resume-renderer";

export function PublicResumePage({ slug }: { slug: string }) {
  const [resume, setResume] = useState<PublicResume | null>(null);
  const [error, setError] = useState(false);
  const printMode =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("print") === "1";

  useEffect(() => {
    api
      .getPublicResume(slug)
      .then(setResume)
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <main className="public-error">
        <FileQuestion size={32} />
        <h1>공개된 이력서를 찾을 수 없습니다</h1>
        <p>주소가 정확한지 확인하거나 이력서를 다시 발행해 주세요.</p>
        <Link href="/">이력서 목록으로</Link>
      </main>
    );
  }
  if (!resume) return <div className="full-page-message">공개 이력서를 불러오는 중입니다…</div>;

  const isLocal =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "web"].includes(window.location.hostname);
  const pdfUrl = isLocal ? api.publicPdfUrl(slug) : `/pdf/${slug}.pdf`;

  return (
    <main className={`public-shell ${printMode ? "print-mode" : ""}`}>
      {!printMode && (
        <header className="public-toolbar">
          <span className="brand">
            <span className="brand-mark">B</span>
            <span>Blockfolio</span>
          </span>
          <a className="secondary-button" href={pdfUrl}>
            <Download size={16} /> PDF 다운로드
          </a>
        </header>
      )}
      <ResumeRenderer document={resume.document} mode={printMode ? "print" : "public"} />
    </main>
  );
}

