"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArchiveRestore,
  Copy,
  FileText,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { api } from "../lib/api";
import type { Resume } from "../lib/types";

export function Dashboard() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      const items = await api.listResumes(true);
      setResumes(items);
    } catch {
      setError("API에 연결할 수 없습니다. Docker Compose가 실행 중인지 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .listResumes(true)
      .then((items) => {
        if (active) setResumes(items);
      })
      .catch(() => {
        if (active) setError("API에 연결할 수 없습니다. Docker Compose가 실행 중인지 확인해 주세요.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const active = resumes.filter((resume) => (showTrash ? resume.deleted_at : !resume.deleted_at));

  const create = async () => {
    try {
      setBusyId("create");
      const resume = await api.createResume();
      window.location.href = `/editor/${resume.id}`;
    } finally {
      setBusyId(null);
    }
  };

  const duplicate = async (resume: Resume) => {
    setBusyId(resume.id);
    try {
      await api.duplicateResume(resume.id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (resume: Resume) => {
    if (!window.confirm(`“${resume.title}” 이력서를 휴지통으로 이동할까요?`)) return;
    setBusyId(resume.id);
    try {
      await api.deleteResume(resume.id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const restore = async (resume: Resume) => {
    setBusyId(resume.id);
    try {
      await api.restoreResume(resume.id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Blockfolio</span>
        </Link>
        <button className="ghost-button" type="button" onClick={() => setShowTrash(!showTrash)}>
          {showTrash ? <FileText size={16} /> : <Trash2 size={16} />}
          {showTrash ? "이력서 목록" : "휴지통"}
        </button>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-title-row">
          <div>
            <p className="eyebrow">LOCAL RESUME STUDIO</p>
            <h1>{showTrash ? "휴지통" : "내 이력서"}</h1>
            <p>블록을 자유롭게 조합하고, 발행본과 PDF를 한 곳에서 관리하세요.</p>
          </div>
          {!showTrash && (
            <button className="primary-button" type="button" onClick={create} disabled={busyId === "create"}>
              <Plus size={17} /> 새 이력서
            </button>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="empty-state">이력서를 불러오는 중입니다…</div>
        ) : active.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <FileText size={26} />
            </span>
            <h2>{showTrash ? "휴지통이 비어 있습니다" : "첫 이력서를 만들어 보세요"}</h2>
            <p>{showTrash ? "삭제한 이력서가 여기에 표시됩니다." : "샘플 블록이 포함된 이력서로 바로 시작할 수 있습니다."}</p>
            {!showTrash && (
              <button className="primary-button" type="button" onClick={create}>
                <Plus size={17} /> 이력서 만들기
              </button>
            )}
          </div>
        ) : (
          <div className="resume-card-grid">
            {active.map((resume) => (
              <article className="resume-card" key={resume.id}>
                <div className="resume-card-preview">
                  <div className="mini-paper">
                    <span className="mini-name">{resume.title.slice(0, 12)}</span>
                    <span className="mini-line wide" />
                    <span className="mini-line" />
                    <span className="mini-line short" />
                    <span className="mini-heading" />
                    <span className="mini-line wide" />
                    <span className="mini-line" />
                  </div>
                  {resume.published_at && <span className="published-badge">발행됨</span>}
                </div>
                <div className="resume-card-body">
                  <div>
                    <h2>{resume.title}</h2>
                    <p>
                      {new Intl.DateTimeFormat("ko-KR", {
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(resume.updated_at))}
                    </p>
                  </div>
                  <button className="icon-button subtle" type="button" aria-label="추가 메뉴">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                <div className="resume-card-actions">
                  {showTrash ? (
                    <button type="button" onClick={() => restore(resume)} disabled={busyId === resume.id}>
                      <ArchiveRestore size={15} /> 복원
                    </button>
                  ) : (
                    <>
                      <Link href={`/editor/${resume.id}`}>편집</Link>
                      <button type="button" onClick={() => duplicate(resume)} disabled={busyId === resume.id}>
                        <Copy size={15} /> 복제
                      </button>
                      <button className="danger-text" type="button" onClick={() => remove(resume)}>
                        <Trash2 size={15} /> 삭제
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
