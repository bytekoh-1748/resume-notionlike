import type { BlockType, ResumeBlock, ResumeDocument } from "./types";

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
    format: {
      fontScale: 100,
      bold: false,
      italic: false,
      dividerThickness: 1,
    },
  };
  switch (type) {
    case "profile":
      return {
        ...common,
        data: {
          name: "",
          email: "",
          phone: "",
          location: "",
          imageDataUrl: "",
          imageFit: "cover",
          imagePositionX: 50,
          imagePositionY: 50,
          imageZoom: 100,
          imagePlacement: "left",
          contactVisibility: { email: true, phone: true, location: true },
        },
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
          items: [
            {
              id: id(),
              name: "",
              organization: "",
              period: "",
              teamSize: "",
              role: "",
              stack: "",
              description: "",
              achievements: "",
              url: "",
              evidenceLinks: [
                {
                  id: id(),
                  label: "GitHub 저장소",
                  url: "",
                },
              ],
              imageDataUrl: "",
            },
          ],
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

const contactLinkLabels = /github|gitlab|블로그|blog|portfolio|포트폴리오|linkedin|링크드인/i;

const isContactLinkBlock = (block: ResumeBlock) => {
  if (block.type !== "links") return false;
  if (block.data.preserveAsBlock === true) return false;
  const title = typeof block.data.title === "string" ? block.data.title.trim() : "";
  const display = typeof block.data.display === "string" ? block.data.display : "";
  const entries = Array.isArray(block.data.items)
    ? (block.data.items as Array<Record<string, unknown>>)
    : [];

  return (
    display === "inline" ||
    title === "" ||
    title === "링크" ||
    (entries.length > 0 &&
      entries.every((entry) =>
        contactLinkLabels.test(
          `${typeof entry.label === "string" ? entry.label : ""} ${
            typeof entry.url === "string" ? entry.url : ""
          }`,
        ),
      ))
  );
};

export function mergeContactLinksIntoProfile(document: ResumeDocument): ResumeDocument {
  const profileBlock = document.blocks.find((block) => block.type === "profile");
  const contactLinkBlocks = document.blocks.filter(isContactLinkBlock);
  if (!profileBlock || contactLinkBlocks.length === 0) return document;

  const existingLinks = Array.isArray(profileBlock.data.contactLinks)
    ? (profileBlock.data.contactLinks as Array<Record<string, unknown>>)
    : [];
  const legacyLinks = contactLinkBlocks.flatMap((block) =>
    Array.isArray(block.data.items)
      ? (block.data.items as Array<Record<string, unknown>>).map((entry, index) => ({
          ...entry,
          id:
            typeof entry.id === "string" && entry.id
              ? entry.id
              : `contact-link-${block.id}-${index}`,
        }))
      : [],
  );
  const seen = new Set<string>();
  const contactLinks = [...existingLinks, ...legacyLinks].filter((entry) => {
    const label = typeof entry.label === "string" ? entry.label.trim() : "";
    const url = typeof entry.url === "string" ? entry.url.trim() : "";
    const key = `${label}\u0000${url}`;
    if ((!label && !url) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const removedIds = new Set(contactLinkBlocks.map((block) => block.id));
  const blocks = document.blocks
    .filter((block) => !removedIds.has(block.id))
    .map((block) =>
      block.id === profileBlock.id
        ? { ...block, data: { ...block.data, contactLinks } }
        : block,
    );

  return { ...document, blocks: normalizeOrder(blocks) };
}

export function paginateBlocks(blocks: ResumeBlock[]): ResumeBlock[][] {
  return blocks.reduce<ResumeBlock[][]>((pages, resumeBlock) => {
    if (pages.length === 0 || (resumeBlock.print.breakBefore && pages.at(-1)?.length)) {
      pages.push([]);
    }
    pages.at(-1)?.push(resumeBlock);
    return pages;
  }, []);
}
