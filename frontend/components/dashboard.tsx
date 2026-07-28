"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArchiveRestore,
  BookOpenText,
  Check,
  Copy,
  FileText,
  Files,
  Plus,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import {
  createDocumentFromTemplate,
  getTemplateOption,
  templateOptions,
} from "../lib/templates";
import type { Resume, TemplateId } from "../lib/types";

function TemplateIcon({ template }: { template: TemplateId }) {
  if (template === "resume-two-page") return <Files size={22} />;
  if (template === "portfolio") return <BookOpenText size={22} />;
  if (template === "cover-letter") return <ScrollText size={22} />;
  return <FileText size={22} />;
}

export function Dashboard() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateId>("resume-two-page");
  const [newTitle, setNewTitle] = useState("2장 이력서");

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

  useEffect(() => {
    if (!templateOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && busyId !== "create") setTemplateOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busyId, templateOpen]);

  const active = resumes.filter((resume) => (showTrash ? resume.deleted_at : !resume.deleted_at));

  const openTemplatePicker = () => {
    setSelectedTemplate("resume-two-page");
    setNewTitle(getTemplateOption("resume-two-page").defaultTitle);
    setTemplateOpen(true);
  };

  const chooseTemplate = (template: TemplateId) => {
    setSelectedTemplate(template);
    setNewTitle(getTemplateOption(template).defaultTitle);
  };

  const create = async () => {
    try {
      setBusyId("create");
      setError("");
      const resume = await api.createResume(
        newTitle.trim() || getTemplateOption(selectedTemplate).defaultTitle,
        createDocumentFromTemplate(selectedTemplate),
      );
      window.location.href = `/editor/${resume.id}`;
    } catch {
      setError("문서를 만들지 못했습니다. API 연결을 확인해 주세요.");
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
    if (!window.confirm(`“${resume.title}” 문서를 휴지통으로 이동할까요?`)) return;
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
          {showTrash ? "문서 목록" : "휴지통"}
        </button>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-title-row">
          <div>
            <h1>{showTrash ? "휴지통" : "내 문서"}</h1>
          </div>
          {!showTrash && (
            <button className="primary-button" type="button" onClick={openTemplatePicker}>
              <Plus size={17} /> 새 문서
            </button>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="empty-state">문서를 불러오는 중입니다…</div>
        ) : active.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <FileText size={26} />
            </span>
            <h2>{showTrash ? "휴지통이 비어 있습니다" : "첫 문서를 만들어 보세요"}</h2>
            {!showTrash && (
              <button className="primary-button" type="button" onClick={openTemplatePicker}>
                <Plus size={17} /> 템플릿 고르기
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
                  <span className="document-type-badge">
                    {getTemplateOption(resume.draft_document.template ?? "resume-one-page").title}
                  </span>
                </div>
                <div className="resume-card-body">
                  <div>
                    <h2>{resume.title}</h2>
                  </div>
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

      {templateOpen && (
        <div
          className="template-modal-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && busyId !== "create") {
              setTemplateOpen(false);
            }
          }}
        >
          <section
            className="template-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-modal-title"
          >
            <header className="template-modal-header">
              <div>
                <h2 id="template-modal-title">어떤 문서를 만들까요?</h2>
              </div>
              <button
                className="icon-button subtle"
                type="button"
                onClick={() => setTemplateOpen(false)}
                disabled={busyId === "create"}
                aria-label="템플릿 선택 닫기"
              >
                <X size={19} />
              </button>
            </header>

            <div className="template-grid" role="radiogroup" aria-label="문서 템플릿">
              {templateOptions.map((option) => {
                const selected = option.id === selectedTemplate;
                return (
                  <button
                    key={option.id}
                    className={`template-card ${selected ? "selected" : ""}`}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => chooseTemplate(option.id)}
                  >
                    <div className={`template-preview template-preview-${option.id}`}>
                      <span className="template-preview-icon">
                        <TemplateIcon template={option.id} />
                      </span>
                      <div className="template-preview-paper">
                        <span className="template-preview-title" />
                        <span className="template-preview-line long" />
                        <span className="template-preview-line" />
                        <span className="template-preview-heading" />
                        <span className="template-preview-line long" />
                        <span className="template-preview-line short" />
                      </div>
                      {option.id === "resume-two-page" && (
                        <div className="template-preview-paper template-preview-paper-back" />
                      )}
                    </div>
                    <div className="template-card-copy">
                      <strong>{option.title}</strong>
                    </div>
                    <span className="template-radio">
                      {selected && <Check size={14} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <footer className="template-modal-footer">
              <label>
                문서 이름
                <input
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="문서 이름"
                  autoFocus
                />
              </label>
              <div>
                <button
                  className="primary-button"
                  type="button"
                  onClick={create}
                  disabled={busyId === "create"}
                >
                  {busyId === "create" ? "만드는 중…" : "이 템플릿으로 만들기"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
