export type BlockType =
  | "profile"
  | "summary"
  | "experience"
  | "project"
  | "education"
  | "aiExperience"
  | "skills"
  | "award"
  | "language"
  | "links"
  | "richText"
  | "bulletList"
  | "divider";

export type TiptapDocument = {
  type: "doc";
  content?: Array<Record<string, unknown>>;
};

export type TemplateId =
  | "resume-one-page"
  | "resume-two-page"
  | "resume-web"
  | "portfolio"
  | "cover-letter";

export type BlockFormat = {
  fontScale: number;
  bold: boolean;
  italic: boolean;
  dividerThickness: number;
};

export type ResumeBlock = {
  id: string;
  type: BlockType;
  order: number;
  width: "full" | "half";
  print: { breakBefore: boolean };
  format?: BlockFormat | null;
  data: Record<string, unknown>;
};

export type ResumeDocument = {
  schemaVersion: 1;
  template: TemplateId;
  theme: {
    font: string;
    accentColor: string;
    density: "compact" | "normal";
  };
  blocks: ResumeBlock[];
};

export type Resume = {
  id: string;
  title: string;
  slug: string;
  draft_document: ResumeDocument;
  published_document: ResumeDocument | null;
  revision: number;
  published_revision: number | null;
  published_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicResume = {
  title: string;
  slug: string;
  document: ResumeDocument;
  published_at: string;
};

export type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";
