"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import type { TiptapDocument } from "../lib/types";

const emptyDocument: TiptapDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function RichTextEditor({
  value,
  onChange,
}: {
  value: TiptapDocument | undefined;
  onChange: (value: TiptapDocument) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || emptyDocument,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text-input",
        "aria-label": "본문",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON() as TiptapDocument);
    },
  });

  useEffect(() => {
    if (!editor || !value) return;
    const current = JSON.stringify(editor.getJSON());
    if (current !== JSON.stringify(value)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return <div className="rich-text-loading">편집기 불러오는 중…</div>;

  return (
    <div className="rich-text-shell">
      <div className="rich-text-toolbar" aria-label="텍스트 서식">
        <button
          type="button"
          className={editor.isActive("bold") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="굵게"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="기울임"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          className={editor.isActive("bulletList") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="글머리 목록"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          className={editor.isActive("orderedList") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="번호 목록"
        >
          <ListOrdered size={14} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

