import type {
  BlockType,
  ResumeBlock,
  ResumeDocument,
  TemplateId,
  TiptapDocument,
} from "./types";

export type TemplateOption = {
  id: TemplateId;
  title: string;
  badge: string;
  description: string;
  pageLabel: string;
  sections: string[];
  defaultTitle: string;
};

export const templateOptions: TemplateOption[] = [
  {
    id: "resume-one-page",
    title: "1장 이력서",
    badge: "7초 스캔",
    description: "핵심 성과와 스킬만 한 장에 압축하고, 상세 내용은 증거 링크로 확장합니다.",
    pageLabel: "1 PAGE · A4",
    sections: ["핵심 소개", "경력·프로젝트", "스킬·증거 링크"],
    defaultTitle: "1장 이력서",
  },
  {
    id: "resume-two-page",
    title: "2장 이력서",
    badge: "추천",
    description: "첫 장은 프로필과 대표 프로젝트, 둘째 장은 경력·학력·스킬을 담습니다.",
    pageLabel: "2 PAGES · A4",
    sections: ["1P 프로필·대표 프로젝트", "2P 경력·학력", "문서 생태계 링크"],
    defaultTitle: "2장 이력서",
  },
  {
    id: "portfolio",
    title: "기술 포트폴리오",
    badge: "깊이 탐색",
    description: "프로젝트의 의사결정, 기술적 도전과 결과를 깊게 설명하는 문서입니다.",
    pageLabel: "DEEP DIVE",
    sections: ["프로젝트 맥락", "기술적 선택", "코드·PR 증거"],
    defaultTitle: "기술 포트폴리오",
  },
  {
    id: "cover-letter",
    title: "자기소개서",
    badge: "사람의 맥락",
    description: "지원 동기, 문제 해결 방식과 가치관을 서사 중심으로 정리합니다.",
    pageLabel: "NARRATIVE",
    sections: ["지원 동기", "문제 해결 방식", "협업·가치관"],
    defaultTitle: "자기소개서",
  },
];

const id = () => crypto.randomUUID();

const block = (
  type: BlockType,
  order: number,
  data: Record<string, unknown>,
  options: { width?: "full" | "half"; breakBefore?: boolean } = {},
): ResumeBlock => ({
  id: id(),
  type,
  order,
  width: options.width ?? "full",
  print: { breakBefore: options.breakBefore ?? false },
  data,
});

const profile = (order: number, role: string) =>
  block("profile", order, {
    name: "이름",
    role,
    email: "name@example.com",
    phone: "010-0000-0000",
    location: "서울, 대한민국",
    imageDataUrl: "",
    contactVisibility: { email: true, phone: true, location: true },
  });

const linkItem = (label: string, url = "") => ({ id: id(), label, url });

const linkHub = (order: number, title = "", display: "inline" | "list" = "inline") =>
  block("links", order, {
    title,
    display,
    items: [
      linkItem("GitHub"),
      linkItem("포트폴리오"),
      linkItem("기술 블로그"),
    ],
  });

const projectItem = (name: string) => ({
  id: id(),
  name,
  period: "YYYY.MM - YYYY.MM",
  role: "담당 역할",
  stack: "핵심 기술",
  description: "어떤 문제를 왜 해결했는지 한 문장으로 요약해 주세요.",
  achievements: [
    "내가 내린 핵심 기술 의사결정과 이유",
    "수치로 확인할 수 있는 결과 또는 사용자 변화",
    "협업 범위와 내가 직접 기여한 부분",
  ].join("\n"),
  url: "",
  evidenceUrl: "",
});

const paragraphDocument = (paragraphs: string[]): TiptapDocument => ({
  type: "doc",
  content: paragraphs.map((content) => ({
    type: "paragraph",
    content: [{ type: "text", text: content }],
  })),
});

const baseDocument = (
  template: TemplateId,
  blocks: ResumeBlock[],
  density: "compact" | "normal" = "compact",
): ResumeDocument => ({
  schemaVersion: 1,
  template,
  theme: {
    font: "Pretendard",
    accentColor: "#f97316",
    density,
  },
  blocks,
});

function onePageResume(): ResumeDocument {
  return baseDocument("resume-one-page", [
    profile(0, "백엔드 개발자 · 한 줄 전문성"),
    linkHub(1),
    block("summary", 2, {
      title: "핵심 요약",
      content:
        "주요 경력과 강점을 2~3문장으로 정리하세요. 본문은 짧게 유지하고 자세한 근거는 링크로 연결하세요.",
    }),
    block("experience", 3, {
      title: "경력",
      items: [
        {
          id: id(),
          company: "회사명",
          role: "담당 직무",
          position: "직책",
          employmentType: "정규직",
          startDate: "YYYY.MM",
          endDate: "현재",
          description: "가장 중요한 역할과 정량 성과를 2~3줄로 작성하세요.",
          imageDataUrl: "",
        },
      ],
    }),
    block("project", 4, {
      title: "대표 프로젝트",
      items: [projectItem("프로젝트 이름")],
    }),
    block("education", 5, {
      title: "학력",
      items: [
        {
          id: id(),
          school: "학교명",
          major: "전공",
          degree: "학위",
          period: "YYYY.MM - YYYY.MM",
          status: "졸업",
          description: "",
          imageDataUrl: "",
        },
      ],
    }),
    block("skills", 6, {
      title: "핵심 스킬",
      items: ["Java", "Spring Boot", "PostgreSQL", "AWS"],
    }),
    block(
      "award",
      7,
      {
        title: "자격·수상",
        items: [{ id: id(), name: "자격 또는 수상명", date: "YYYY.MM", description: "" }],
      },
      { width: "half" },
    ),
    block(
      "links",
      8,
      {
        title: "증거 링크",
        display: "list",
        items: [linkItem("대표 코드·PR"), linkItem("프로젝트 상세")],
      },
      { width: "half" },
    ),
  ]);
}

function twoPageResume(): ResumeDocument {
  return baseDocument("resume-two-page", [
    profile(0, "백엔드 개발자 · 한 줄 전문성"),
    linkHub(1),
    block("summary", 2, {
      title: "소개",
      content:
        "해결해 온 문제, 전문 영역, 일하는 방식을 3~4문장으로 정리하세요. 면접관이 더 알고 싶은 키워드는 아래 프로젝트 링크로 확장합니다.",
    }),
    block("project", 3, {
      title: "핵심 프로젝트",
      items: [
        projectItem("대표 프로젝트 A"),
        projectItem("대표 프로젝트 B"),
        projectItem("대표 프로젝트 C"),
      ],
    }),
    block(
      "experience",
      4,
      {
        title: "경력",
        items: [
          {
            id: id(),
            company: "회사명",
            role: "담당 직무",
            position: "직책",
            employmentType: "정규직",
            startDate: "YYYY.MM",
            endDate: "현재",
            description:
              "책임 범위, 대표 성과와 사용 기술을 간결하게 작성하세요. 상세한 프로젝트 과정은 포트폴리오로 연결합니다.",
            imageDataUrl: "",
          },
        ],
      },
      { breakBefore: true },
    ),
    block("education", 5, {
      title: "학력",
      items: [
        {
          id: id(),
          school: "학교명",
          major: "전공",
          degree: "학위",
          period: "YYYY.MM - YYYY.MM",
          status: "졸업",
          description: "관련 연구, 수업 또는 활동을 작성하세요.",
          imageDataUrl: "",
        },
      ],
    }),
    block("skills", 6, {
      title: "핵심 스킬",
      items: ["Java", "Spring Boot", "PostgreSQL", "Redis", "AWS", "Docker"],
    }),
    block(
      "award",
      7,
      {
        title: "자격·수상",
        items: [{ id: id(), name: "자격 또는 수상명", date: "YYYY.MM", description: "" }],
      },
      { width: "half" },
    ),
    block(
      "language",
      8,
      {
        title: "외국어",
        items: [{ id: id(), language: "영어", level: "업무 회화" }],
      },
      { width: "half" },
    ),
    block("links", 9, {
      title: "문서 생태계",
      display: "list",
      items: [
        linkItem("포트폴리오 · 기술적 깊이"),
        linkItem("자기소개서 · 가치관과 동기"),
        linkItem("GitHub · 코드와 커밋 기록"),
        linkItem("기술 블로그 · 문제 해결 과정"),
      ],
    }),
  ]);
}

function portfolio(): ResumeDocument {
  return baseDocument(
    "portfolio",
    [
      profile(0, "기술 포트폴리오 · 전문 영역"),
      linkHub(1),
      block("summary", 2, {
        title: "포트폴리오 소개",
        content:
          "이 문서는 프로젝트의 기술적 맥락과 의사결정 과정을 설명합니다. 이력서에는 결과만, 여기에는 왜 그렇게 해결했는지를 기록하세요.",
      }),
      block("project", 3, {
        title: "프로젝트 상세",
        items: [
          projectItem("프로젝트 A · 가장 깊게 다룬 문제"),
          projectItem("프로젝트 B · 성능 또는 안정성 개선"),
          projectItem("프로젝트 C · 협업과 제품 임팩트"),
        ],
      }),
      block("richText", 4, {
        title: "기술적 의사결정",
        content: paragraphDocument([
          "문제의 제약 조건, 검토한 대안, 최종 선택과 트레이드오프를 설명하세요.",
          "선택 이후 어떤 지표로 결과를 검증했는지 기록하세요.",
        ]),
      }),
      block("skills", 5, {
        title: "기술 범위",
        items: ["언어", "프레임워크", "데이터베이스", "인프라", "관측·테스트"],
      }),
      block("links", 6, {
        title: "1차 증거",
        display: "list",
        items: [
          linkItem("GitHub 저장소"),
          linkItem("대표 Pull Request"),
          linkItem("이슈 토론"),
          linkItem("아키텍처 문서"),
        ],
      }),
    ],
    "normal",
  );
}

function coverLetter(): ResumeDocument {
  return baseDocument(
    "cover-letter",
    [
      profile(0, "지원 직무 · 자기소개서"),
      linkHub(1),
      block("richText", 2, {
        title: "지원 동기",
        content: paragraphDocument([
          "왜 이 회사와 직무를 선택했는지, 나의 경험과 회사가 풀고 있는 문제를 연결해 작성하세요.",
        ]),
      }),
      block("richText", 3, {
        title: "문제를 해결하는 방식",
        content: paragraphDocument([
          "대표 경험 하나를 골라 상황, 판단 기준, 행동, 결과의 흐름으로 작성하세요.",
        ]),
      }),
      block("richText", 4, {
        title: "협업과 가치관",
        content: paragraphDocument([
          "함께 일할 때 중요하게 생각하는 원칙과 실제 행동으로 증명한 사례를 작성하세요.",
        ]),
      }),
      block("richText", 5, {
        title: "입사 후 기여",
        content: paragraphDocument([
          "나의 강점이 지원 조직의 문제 해결에 어떻게 연결되는지 구체적으로 작성하세요.",
        ]),
      }),
      block("links", 6, {
        title: "근거 자료",
        display: "list",
        items: [
          linkItem("이력서 · 핵심 경력과 성과"),
          linkItem("포트폴리오 · 프로젝트 상세"),
          linkItem("GitHub · 실제 코드 기록"),
        ],
      }),
    ],
    "normal",
  );
}

export function createDocumentFromTemplate(template: TemplateId): ResumeDocument {
  switch (template) {
    case "resume-one-page":
      return onePageResume();
    case "resume-two-page":
      return twoPageResume();
    case "portfolio":
      return portfolio();
    case "cover-letter":
      return coverLetter();
  }
}

export function getTemplateOption(template: TemplateId): TemplateOption {
  return templateOptions.find((option) => option.id === template) ?? templateOptions[0];
}
