"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Columns2,
  Copy,
  Download,
  Eye,
  GripVertical,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Redo2,
  Rows3,
  Save,
  Send,
  Trash2,
  Undo2,
  Unlink,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { blockLabels, createBlock, normalizeOrder, paginateBlocks } from "../lib/blocks";
import { useEditorStore } from "../lib/editor-store";
import type { BlockType, ResumeBlock, ResumeDocument, SaveState } from "../lib/types";
import { BlockEditor } from "./block-editor";
import { ResumeRenderer } from "./resume-renderer";

function SortableBlock({
  block,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
  onWidth,
  onBreak,
}: {
  block: ResumeBlock;
  onChange: (block: ResumeBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
  onWidth: () => void;
  onBreak: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  return (
    <section
      ref={setNodeRef}
      className={`editable-block editable-block-${block.width} ${block.print.breakBefore ? "page-break-block" : ""} ${isDragging ? "dragging" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        breakBefore: block.print.breakBefore ? "page" : "auto",
      }}
      data-testid={`block-${block.id}`}
    >
      <div className="block-toolbar">
        <button
          type="button"
          className="drag-handle"
          {...attributes}
          {...listeners}
          aria-label={`${blockLabels[block.type]} 블록 이동`}
        >
          <GripVertical size={17} />
        </button>
        <span>{blockLabels[block.type]}</span>
        <div className="block-toolbar-actions">
          <button type="button" onClick={() => onMove(-1)} aria-label="위로 이동">
            <ArrowUp size={14} />
          </button>
          <button type="button" onClick={() => onMove(1)} aria-label="아래로 이동">
            <ArrowDown size={14} />
          </button>
          <button type="button" onClick={onWidth} aria-label="블록 너비 변경">
            {block.width === "full" ? <Columns2 size={14} /> : <Rows3 size={14} />}
          </button>
          <button
            type="button"
            onClick={onBreak}
            className={block.print.breakBefore ? "active" : ""}
            aria-label="새 PDF 페이지에서 시작"
          >
            <PanelLeftOpen size={14} />
          </button>
          <button type="button" onClick={onDuplicate} aria-label="블록 복제">
            <Copy size={14} />
          </button>
          <button type="button" onClick={onDelete} aria-label="블록 삭제">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <BlockEditor block={block} onChange={onChange} />
    </section>
  );
}

function saveLabel(state: SaveState) {
  switch (state) {
    case "saving":
      return "저장 중";
    case "dirty":
      return "저장 대기";
    case "error":
      return "저장 실패";
    case "conflict":
      return "다른 변경 감지";
    default:
      return "저장됨";
  }
}

export function EditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { resume, document, past, future, load, setResume, setDocument, undo, redo, reset } =
    useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [deleted, setDeleted] = useState<{ block: ResumeBlock; index: number } | null>(null);
  const revisionRef = useRef(1);
  const lastSavedRef = useRef("");
  const saveChainRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const persistRef = useRef<
    ((next: { document: ResumeDocument; title: string }) => Promise<boolean>) | null
  >(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    let cancelled = false;
    api
      .getResume(id)
      .then((value) => {
        if (cancelled) return;
        load(value);
        setTitle(value.title);
        revisionRef.current = value.revision;
        lastSavedRef.current = JSON.stringify({ title: value.title, document: value.draft_document });
      })
      .catch(() => setError("문서를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
      reset();
    };
  }, [id, load, reset]);

  const persist = (next: { document: ResumeDocument; title: string }) => {
    const run = async () => {
      const serialized = JSON.stringify({ title: next.title, document: next.document });
      if (serialized === lastSavedRef.current) {
        setSaveState("saved");
        return true;
      }
      setSaveState("saving");
      try {
        const saved = await api.saveResume(id, {
          baseRevision: revisionRef.current,
          title: next.title,
          document: next.document,
        });
        revisionRef.current = saved.revision;
        lastSavedRef.current = JSON.stringify({
          title: saved.title,
          document: saved.draft_document,
        });
        if (retryTimer.current) clearTimeout(retryTimer.current);
        setResume(saved);
        setSaveState("saved");
        return true;
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 409) {
          setSaveState("conflict");
          setError("다른 탭에서 저장된 변경이 있습니다. 새로고침해 최신 내용을 확인해 주세요.");
        } else {
          setSaveState("error");
          setError("저장하지 못했습니다. 연결을 확인하면 자동으로 다시 시도합니다.");
          if (retryTimer.current) clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(() => persistRef.current?.(next), 2_000);
        }
        return false;
      }
    };
    const scheduled = saveChainRef.current.then(run, run);
    saveChainRef.current = scheduled;
    return scheduled;
  };
  useEffect(() => {
    persistRef.current = persist;
  });

  useEffect(() => {
    if (!document || loading) return;
    const next = { title, document };
    const serialized = JSON.stringify(next);
    if (serialized === lastSavedRef.current) return;
    setSaveState("dirty");
    const timer = window.setTimeout(() => persistRef.current?.(next), 800);
    return () => window.clearTimeout(timer);
  }, [document, loading, title]);

  useEffect(
    () => () => {
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    },
    [],
  );

  const updateBlock = (nextBlock: ResumeBlock, recordHistory = false) => {
    if (!document) return;
    setDocument(
      {
        ...document,
        blocks: document.blocks.map((block) => (block.id === nextBlock.id ? nextBlock : block)),
      },
      recordHistory,
    );
  };

  const removeBlock = (block: ResumeBlock) => {
    if (!document) return;
    const index = document.blocks.findIndex((item) => item.id === block.id);
    setDocument(
      { ...document, blocks: normalizeOrder(document.blocks.filter((item) => item.id !== block.id)) },
      true,
    );
    setDeleted({ block, index });
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    deleteTimer.current = setTimeout(() => setDeleted(null), 8000);
  };

  const restoreDeleted = () => {
    if (!document || !deleted) return;
    const blocks = [...document.blocks];
    blocks.splice(deleted.index, 0, deleted.block);
    setDocument({ ...document, blocks: normalizeOrder(blocks) }, true);
    setDeleted(null);
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
  };

  const duplicateBlock = (block: ResumeBlock) => {
    if (!document) return;
    const index = document.blocks.findIndex((item) => item.id === block.id);
    const copy = structuredClone(block);
    copy.id = crypto.randomUUID();
    copy.data = {
      ...copy.data,
      items: Array.isArray(copy.data.items)
        ? (copy.data.items as Array<Record<string, unknown>>).map((item) => ({
            ...item,
            ...(item.id ? { id: crypto.randomUUID() } : {}),
          }))
        : copy.data.items,
    };
    const blocks = [...document.blocks];
    blocks.splice(index + 1, 0, copy);
    setDocument({ ...document, blocks: normalizeOrder(blocks) }, true);
  };

  const moveBlock = (block: ResumeBlock, direction: -1 | 1) => {
    if (!document) return;
    const index = document.blocks.findIndex((item) => item.id === block.id);
    const target = index + direction;
    if (target < 0 || target >= document.blocks.length) return;
    setDocument(
      { ...document, blocks: normalizeOrder(arrayMove(document.blocks, index, target)) },
      true,
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!document || !over || active.id === over.id) return;
    const from = document.blocks.findIndex((block) => block.id === active.id);
    const to = document.blocks.findIndex((block) => block.id === over.id);
    setDocument(
      { ...document, blocks: normalizeOrder(arrayMove(document.blocks, from, to)) },
      true,
    );
  };

  const addBlock = (type: BlockType) => {
    if (!document) return;
    const next = createBlock(type, document.blocks.length);
    setDocument({ ...document, blocks: [...document.blocks, next] }, true);
  };

  const publish = async () => {
    if (!resume) return;
    if (document) {
      const saved = await persist({ document, title });
      if (!saved) return;
    }
    try {
      const updated = await api.publishResume(resume.id);
      setResume(updated);
      setError("");
    } catch {
      setError("발행하지 못했습니다.");
    }
  };

  const unpublish = async () => {
    if (!resume) return;
    const updated = await api.unpublishResume(resume.id);
    setResume(updated);
  };

  const orderedBlocks = useMemo(
    () => (document ? [...document.blocks].sort((a, b) => a.order - b.order) : []),
    [document],
  );
  const editablePages = useMemo(
    () => (document?.template === "resume-two-page" ? paginateBlocks(orderedBlocks) : []),
    [document?.template, orderedBlocks],
  );

  if (loading) return <div className="full-page-message">문서를 준비하는 중입니다…</div>;
  if (!resume || !document) return <div className="full-page-message">{error || "문서를 찾을 수 없습니다."}</div>;

  return (
    <main className={`editor-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <header className="editor-header">
        <div className="editor-header-left">
          <Link href="/" className="icon-button" aria-label="목록으로 돌아가기">
            <ArrowLeft size={18} />
          </Link>
          <button className="icon-button" type="button" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="블록 패널 열기">
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <input className="resume-title-input" value={title} onChange={(event) => setTitle(event.target.value)} aria-label="문서 제목" />
        </div>
        <div className={`save-indicator save-${saveState}`}>
          {saveState === "saving" ? <LoaderCircle size={14} className="spin" /> : saveState === "saved" ? <Check size={14} /> : <Save size={14} />}
          {saveLabel(saveState)}
        </div>
        <div className="editor-header-actions">
          <button className="icon-button" type="button" onClick={undo} disabled={!past.length} aria-label="실행 취소">
            <Undo2 size={17} />
          </button>
          <button className="icon-button" type="button" onClick={redo} disabled={!future.length} aria-label="다시 실행">
            <Redo2 size={17} />
          </button>
          {resume.published_at && (
            <Link className="secondary-button" href={`/r/${resume.slug}`} target="_blank">
              <Eye size={16} /> 공개본
            </Link>
          )}
          <a className="secondary-button" href={api.pdfUrl(resume.id)}>
            <Download size={16} /> PDF
          </a>
          {resume.published_at ? (
            <button className="secondary-button" type="button" onClick={unpublish}>
              <Unlink size={16} /> 공개 중지
            </button>
          ) : null}
          <button className="primary-button" type="button" onClick={publish}>
            <Send size={16} /> {resume.published_at ? "다시 발행" : "발행"}
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <aside className="block-sidebar">
          <div className="sidebar-heading">
            <h2>블록 추가</h2>
          </div>
          <div className="block-palette">
            {(Object.keys(blockLabels) as BlockType[]).map((type) => (
              <button key={type} type="button" onClick={() => addBlock(type)}>
                <span><Plus size={14} /></span>
                {blockLabels[type]}
              </button>
            ))}
          </div>
          <div className="theme-panel">
            <h3>문서 스타일</h3>
            <label>
              강조색
              <input
                type="color"
                value={document.theme.accentColor}
                onChange={(event) =>
                  setDocument({
                    ...document,
                    theme: { ...document.theme, accentColor: event.target.value },
                  })
                }
              />
            </label>
            <label>
              간격
              <select
                value={document.theme.density}
                onChange={(event) =>
                  setDocument({
                    ...document,
                    theme: {
                      ...document.theme,
                      density: event.target.value as "normal" | "compact",
                    },
                  })
                }
              >
                <option value="normal">기본</option>
                <option value="compact">촘촘하게</option>
              </select>
            </label>
          </div>
        </aside>
      )}

      <div className="editor-workspace">
        {error && (
          <div className="editor-error">
            {error}
            <button type="button" onClick={() => setError("")}>닫기</button>
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={orderedBlocks.map((block) => block.id)} strategy={rectSortingStrategy}>
            <div
              className={`editable-canvas density-${document.theme.density} template-${document.template} ${document.template === "resume-two-page" ? "editable-canvas-paged" : ""}`}
              style={{ "--resume-accent": document.theme.accentColor } as React.CSSProperties}
            >
              {(document.template === "resume-two-page" ? editablePages : [orderedBlocks]).map(
                (pageBlocks, pageIndex) => {
                  const content = pageBlocks.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      onChange={(next) => updateBlock(next)}
                      onDelete={() => removeBlock(block)}
                      onDuplicate={() => duplicateBlock(block)}
                      onMove={(direction) => moveBlock(block, direction)}
                      onWidth={() =>
                        updateBlock(
                          { ...block, width: block.width === "full" ? "half" : "full" },
                          true,
                        )
                      }
                      onBreak={() =>
                        updateBlock(
                          { ...block, print: { breakBefore: !block.print.breakBefore } },
                          true,
                        )
                      }
                    />
                  ));

                  return document.template === "resume-two-page" ? (
                    <div
                      className="editable-page"
                      key={pageBlocks[0]?.id ?? `page-${pageIndex}`}
                    >
                      {content}
                    </div>
                  ) : (
                    content
                  );
                },
              )}
            </div>
          </SortableContext>
        </DndContext>
        <details className="preview-drawer">
          <summary>읽기 전용 미리보기</summary>
          <ResumeRenderer document={document} mode="preview" />
        </details>
      </div>

      {deleted && (
        <div className="undo-toast">
          <span>블록을 삭제했습니다.</span>
          <button type="button" onClick={restoreDeleted}>실행 취소</button>
        </div>
      )}
    </main>
  );
}
