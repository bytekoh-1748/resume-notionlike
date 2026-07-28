import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, FileText } from "lucide-react";
import { ResumeRenderer } from "../frontend/components/resume-renderer";
import type { PublicResume } from "../frontend/lib/types";

type ResumeIndexItem = {
  title: string;
  slug: string;
  published_at: string;
};

function slugFromPath() {
  const match = window.location.pathname.match(/^\/r\/([^/]+)/);
  return match?.[1] || "";
}

function PublicApp() {
  const slug = slugFromPath();
  const [resume, setResume] = useState<PublicResume | null>(null);
  const [index, setIndex] = useState<ResumeIndexItem[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (slug) {
      fetch(`/data/${slug}.json`)
        .then((response) => {
          if (!response.ok) throw new Error("not found");
          return response.json();
        })
        .then(setResume)
        .catch(() => setError(true));
      return;
    }
    fetch("/data/index.json")
      .then((response) => response.json())
      .then(setIndex)
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <main className="public-error">
        <FileText size={30} />
        <h1>공개된 이력서를 찾을 수 없습니다</h1>
      </main>
    );
  }

  if (!slug) {
    return (
      <main className="published-index">
        <header>
          <span className="brand">
            <span className="brand-mark">B</span>
            <span>Blockfolio</span>
          </span>
          <h1>Published resumes</h1>
          <p>로컬 스튜디오에서 발행한 읽기 전용 이력서입니다.</p>
        </header>
        <div className="published-index-list">
          {index.map((item) => (
            <a href={`/r/${item.slug}`} key={item.slug}>
              <FileText size={18} />
              <span>
                <strong>{item.title}</strong>
                <small>{new Date(item.published_at).toLocaleDateString("ko-KR")}</small>
              </span>
            </a>
          ))}
        </div>
      </main>
    );
  }

  if (!resume) return <div className="full-page-message">이력서를 불러오는 중입니다…</div>;

  return (
    <main className="public-shell">
      <header className="public-toolbar">
        <span className="brand">
          <span className="brand-mark">B</span>
          <span>Blockfolio</span>
        </span>
        <a className="secondary-button" href={`/pdf/${resume.slug}.pdf`}>
          <Download size={16} /> PDF 다운로드
        </a>
      </header>
      <ResumeRenderer document={resume.document} mode="public" />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<PublicApp />);

