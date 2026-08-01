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
  defaultTitle: string;
  surface: "print" | "web";
};

export const templateOptions: TemplateOption[] = [
  {
    id: "resume-one-page",
    title: "1장 이력서",
    defaultTitle: "1장 이력서",
    surface: "print",
  },
  {
    id: "resume-two-page",
    title: "2장 이력서",
    defaultTitle: "2장 이력서",
    surface: "print",
  },
  {
    id: "resume-photo-sidebar",
    title: "사진형 2열 이력서",
    defaultTitle: "사진형 2열 이력서",
    surface: "print",
  },
  {
    id: "resume-web",
    title: "웹용 긴 이력서",
    defaultTitle: "웹용 긴 이력서",
    surface: "web",
  },
  {
    id: "portfolio",
    title: "기술 포트폴리오",
    defaultTitle: "기술 포트폴리오",
    surface: "print",
  },
  {
    id: "cover-letter",
    title: "자기소개서",
    defaultTitle: "자기소개서",
    surface: "print",
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
  format: {
    fontScale: 100,
    bold: false,
    italic: false,
    dividerThickness: 1,
  },
  data,
});

const linkItem = (label: string, url = "") => ({ id: id(), label, url });

const profile = (order: number) =>
  block("profile", order, {
    name: "이름",
    email: "name@example.com",
    phone: "010-0000-0000",
    location: "서울, 대한민국",
    imageDataUrl: "",
    imageFit: "cover",
    imagePositionX: 50,
    imagePositionY: 50,
    imageZoom: 100,
    imagePlacement: "left",
    contactVisibility: { email: true, phone: true, location: true },
    contactLinks: [
      linkItem("GitHub"),
      linkItem("기술 블로그"),
    ],
  });

const projectItem = (name: string) => ({
  id: id(),
  name,
  organization: "진행한 곳",
  period: "YYYY.MM - YYYY.MM",
  teamSize: "5인 팀",
  role: "담당 역할",
  stack: "핵심 기술",
  description: "어떤 문제를 왜 해결했는지 한 문장으로 요약해 주세요.",
  achievements: [
    "내가 내린 핵심 기술 의사결정과 이유",
    "수치로 확인할 수 있는 결과 또는 사용자 변화",
    "협업 범위와 내가 직접 기여한 부분",
  ].join("\n"),
  url: "",
  evidenceLinks: [
    {
      id: id(),
      label: "GitHub 저장소",
      url: "",
    },
  ],
  imageDataUrl: "",
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
    accentColor: "#024ad8",
    density,
  },
  blocks,
});

function onePageResume(): ResumeDocument {
  return baseDocument("resume-one-page", [
    profile(0),
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
    profile(0),
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

function photoSidebarResume(): ResumeDocument {
  return baseDocument(
    "resume-photo-sidebar",
    [
      block("profile", 0, {
        name: "이름",
        email: "name@example.com",
        phone: "010-0000-0000",
        location: "서울, 대한민국",
        imageDataUrl: "",
        imageFit: "cover",
        imagePositionX: 50,
        imagePositionY: 50,
        imageZoom: 100,
        imagePlacement: "right",
        contactVisibility: { email: true, phone: true, location: true },
        contactLinks: [linkItem("GitHub"), linkItem("포트폴리오")],
        layout: "right-photo",
      }),
      block("experience", 1, {
        title: "경력",
        layoutColumn: "main",
        items: [
          {
            id: id(),
            company: "회사명",
            role: "담당 직무",
            position: "직책",
            employmentType: "",
            startDate: "YYYY.MM",
            endDate: "현재",
            description:
              "담당한 역할과 해결한 문제, 결과를 간결하게 작성하세요. 주요 성과는 수치와 함께 정리하면 좋습니다.",
            imageDataUrl: "",
          },
          {
            id: id(),
            company: "이전 회사명",
            role: "담당 직무",
            position: "직책",
            employmentType: "",
            startDate: "YYYY.MM",
            endDate: "YYYY.MM",
            description: "핵심 업무와 기여한 결과를 2~3문장으로 작성하세요.",
            imageDataUrl: "",
          },
        ],
      }),
      block("education", 2, {
        title: "학력",
        layoutColumn: "sidebar",
        items: [
          {
            id: id(),
            school: "학교명",
            major: "전공",
            degree: "학위",
            period: "YYYY - YYYY",
            status: "졸업",
            description: "관련 연구, 수업 또는 활동",
            imageDataUrl: "",
          },
        ],
      }),
      block("award", 3, {
        title: "수상·자격",
        layoutColumn: "sidebar",
        items: [
          {
            id: id(),
            name: "수상 또는 자격명",
            date: "YYYY",
            description: "성과나 취득 배경을 간단히 작성하세요.",
          },
        ],
      }),
      block("skills", 4, {
        title: "스킬",
        layoutColumn: "sidebar",
        items: ["핵심 기술", "협업 도구", "업무 역량"],
      }),
      block("language", 5, {
        title: "언어",
        layoutColumn: "sidebar",
        items: [{ id: id(), language: "영어", level: "업무 회화" }],
      }),
    ],
    "normal",
  );
}

function webResume(): ResumeDocument {
  const document = twoPageResume();
  return {
    ...document,
    template: "resume-web",
    blocks: document.blocks.map((resumeBlock) => ({
      ...resumeBlock,
      print: { breakBefore: false },
    })),
  };
}

function portfolio(): ResumeDocument {
  return baseDocument(
    "portfolio",
    [
      profile(0),
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
      block("profile", 0, {
        name: "이름",
        email: "",
        phone: "",
        location: "",
        imageDataUrl: "",
        imageFit: "cover",
        imagePositionX: 50,
        imagePositionY: 50,
        imageZoom: 100,
        imagePlacement: "left",
        contactVisibility: { email: false, phone: false, location: false },
        contactLinks: [],
      }),
      block("richText", 1, {
        title: "",
        content: paragraphDocument(["지원 직무 | 핵심 역량과 전문 분야"]),
      }),
      block("divider", 2, {}),
      block("richText", 3, {
        title: "",
        content: paragraphDocument([
          "나를 가장 잘 보여 주는 태도나 경험으로 글을 시작하고, 이번 지원에서 전하고 싶은 핵심 메시지를 자연스럽게 소개하세요. 이어지는 네 섹션이 하나의 이야기처럼 읽히도록 현재의 관심과 앞으로의 방향을 함께 담아 보세요.",
        ]),
      }),
      block("richText", 4, {
        title: "지원 동기",
        content: paragraphDocument([
          "회사와 직무에 관심을 갖게 된 계기, 공감하는 방향, 나의 경험이 만나는 지점을 자연스럽게 연결하세요. 막연한 호감보다는 실제로 기여하고 싶은 문제나 역할을 중심으로 풀어내면 좋습니다.",
        ]),
      }),
      block("richText", 5, {
        title: "직무 선택과 성장 방향",
        content: paragraphDocument([
          "이 직무를 선택하게 된 계기와 지금까지 쌓아 온 역량을 소개하세요. 앞으로 더 깊게 키우고 싶은 전문성과 장기적으로 만들어 가고 싶은 변화를 현실적인 성장 방향으로 이어 주세요.",
        ]),
      }),
      block("richText", 6, {
        title: "직무를 준비해 온 과정",
        content: paragraphDocument([
          "프로젝트, 학습, 실무, 커뮤니티 활동 중 직무 역량을 잘 보여 주는 경험을 소개하세요. 맡은 역할과 구체적인 행동, 그 과정에서 달라진 점을 중심으로 꾸준함과 실행력이 드러나게 작성해 보세요.",
        ]),
      }),
      block("richText", 7, {
        title: "몰입을 통해 배운 것",
        content: paragraphDocument([
          "시간을 잊을 만큼 깊이 몰입했던 경험을 하나 골라 이야기해 보세요. 무엇이 몰입하게 했는지, 어려움을 어떻게 넘었는지, 그 경험이 이후의 태도와 선택에 어떤 영향을 주었는지를 자연스럽게 연결하세요.",
        ]),
      }),
      block("divider", 8, {}),
      block("links", 9, {
        title: "연락처",
        display: "list",
        preserveAsBlock: true,
        items: [linkItem("name@example.com · portfolio.example.com")],
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
    case "resume-photo-sidebar":
      return photoSidebarResume();
    case "resume-web":
      return webResume();
    case "portfolio":
      return portfolio();
    case "cover-letter":
      return coverLetter();
  }
}

export function getTemplateOption(template: TemplateId): TemplateOption {
  return templateOptions.find((option) => option.id === template) ?? templateOptions[0];
}
