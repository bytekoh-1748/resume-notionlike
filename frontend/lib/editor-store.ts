"use client";

import { create } from "zustand";
import type { Resume, ResumeDocument } from "./types";

type EditorStore = {
  resume: Resume | null;
  document: ResumeDocument | null;
  past: ResumeDocument[];
  future: ResumeDocument[];
  load: (resume: Resume) => void;
  setResume: (resume: Resume) => void;
  setDocument: (document: ResumeDocument, recordHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
};

const clone = (document: ResumeDocument) => structuredClone(document);

export const useEditorStore = create<EditorStore>((set, get) => ({
  resume: null,
  document: null,
  past: [],
  future: [],
  load: (resume) =>
    set({
      resume,
      document: clone(resume.draft_document),
      past: [],
      future: [],
    }),
  setResume: (resume) => set({ resume }),
  setDocument: (document, recordHistory = false) => {
    const current = get().document;
    set({
      document,
      past: recordHistory && current ? [...get().past, clone(current)].slice(-50) : get().past,
      future: recordHistory ? [] : get().future,
    });
  },
  undo: () => {
    const { past, document, future } = get();
    if (!document || past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      document: clone(previous),
      past: past.slice(0, -1),
      future: [clone(document), ...future].slice(0, 50),
    });
  },
  redo: () => {
    const { past, document, future } = get();
    if (!document || future.length === 0) return;
    const next = future[0];
    set({
      document: clone(next),
      past: [...past, clone(document)].slice(-50),
      future: future.slice(1),
    });
  },
  reset: () => set({ resume: null, document: null, past: [], future: [] }),
}));

