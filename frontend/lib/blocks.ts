import type { BlockType, ResumeBlock } from "./types";

export const blockLabels: Record<BlockType, string> = {
  profile: "기본 정보",
  summary: "간단 소개",
  experience: "경력",
  project: "프로젝트",
  education: "학력",
  aiExperience: "AI 활용 경험",
  skills: "스킬",
  award: "수상/자격증",
  language: "언어",
  links: "링크",
  richText: "자유 텍스트",
  bulletList: "목록",
  divider: "구분선",
};

const id = () => crypto.randomUUID();

export function createBlock(type: BlockType, order: number): ResumeBlock {
  const common = {
    id: id(),
    type,
    order,
    width: "full" as const,
    print: { breakBefore: false },
  };
  switch (type) {
    case "profile":
      return {
        ...common,
        data: { name: "", role: "", email: "", phone: "", location: "" },
      };
    case "summary":
    case "aiExperience":
      return { ...common, data: { title: blockLabels[type], content: "" } };
    case "experience":
      return {
        ...common,
        data: {
          title: "경력",
          items: [
            {
              id: id(),
              company: "",
              role: "",
              position: "",
              employmentType: "",
              startDate: "",
              endDate: "",
              description: "",
              imageDataUrl: "",
            },
          ],
        },
      };
    case "project":
      return {
        ...common,
        data: {
          title: "프로젝트",
          items: [{ id: id(), name: "", period: "", description: "", url: "" }],
        },
      };
    case "education":
      return {
        ...common,
        data: {
          title: "학력",
          items: [
            {
              id: id(),
              school: "",
              major: "",
              degree: "",
              period: "",
              status: "",
              description: "",
              imageDataUrl: "",
            },
          ],
        },
      };
    case "skills":
      return { ...common, data: { title: "스킬", items: [] } };
    case "award":
      return {
        ...common,
        width: "half",
        data: { title: "수상/자격증/기타", items: [{ id: id(), name: "", date: "", description: "" }] },
      };
    case "language":
      return {
        ...common,
        width: "half",
        data: { title: "언어", items: [{ id: id(), language: "", level: "" }] },
      };
    case "links":
      return {
        ...common,
        data: { title: "링크", items: [{ id: id(), label: "", url: "" }] },
      };
    case "richText":
      return {
        ...common,
        data: {
          title: "새 섹션",
          content: { type: "doc", content: [{ type: "paragraph" }] },
        },
      };
    case "bulletList":
      return { ...common, data: { title: "목록", items: [""] } };
    case "divider":
      return { ...common, data: {} };
  }
}

export function normalizeOrder(blocks: ResumeBlock[]): ResumeBlock[] {
  return blocks.map((block, order) => ({ ...block, order }));
}
