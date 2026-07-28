from uuid import uuid4


def block(block_type: str, order: int, data: dict, width: str = "full") -> dict:
    return {
        "id": str(uuid4()),
        "type": block_type,
        "order": order,
        "width": width,
        "print": {"breakBefore": False},
        "data": data,
    }


def default_document() -> dict:
    return {
        "schemaVersion": 1,
        "template": "resume-one-page",
        "theme": {
            "font": "Pretendard",
            "accentColor": "#f97316",
            "density": "normal",
        },
        "blocks": [
            block(
                "profile",
                0,
                {
                    "name": "고유진",
                    "role": "",
                    "email": "hello@example.com",
                    "phone": "010-0000-0000",
                    "location": "서울, 대한민국",
                    "imageDataUrl": "",
                    "contactVisibility": {
                        "email": True,
                        "phone": True,
                        "location": True,
                    },
                },
            ),
            block(
                "summary",
                1,
                {
                    "title": "간단 소개",
                    "content": "사용자 문제를 구조화하고, 유지보수하기 좋은 제품으로 해결하는 엔지니어입니다.",
                },
            ),
            block(
                "experience",
                2,
                {
                    "title": "경력",
                    "items": [
                        {
                            "id": str(uuid4()),
                            "company": "회사명",
                            "role": "",
                            "position": "팀원",
                            "employmentType": "정규직",
                            "startDate": "2025.01",
                            "endDate": "현재",
                            "description": "주요 프로젝트와 문제 해결 경험을 작성해 주세요.",
                            "imageDataUrl": "",
                        }
                    ],
                },
            ),
            block(
                "project",
                3,
                {
                    "title": "프로젝트",
                    "items": [
                        {
                            "id": str(uuid4()),
                            "name": "프로젝트 이름",
                            "period": "2025.01 - 2025.06",
                            "role": "백엔드 개발",
                            "stack": "FastAPI, PostgreSQL, Docker",
                            "description": "내 역할과 성과를 구체적으로 작성해 주세요.",
                            "achievements": "핵심 기여와 정량 성과를 한 줄씩 작성해 주세요.",
                            "url": "",
                            "evidenceUrl": "",
                        }
                    ],
                },
            ),
            block(
                "education",
                4,
                {
                    "title": "학력",
                    "items": [
                        {
                            "id": str(uuid4()),
                            "school": "홍익대학교",
                            "major": "시각디자인학과",
                            "degree": "학사",
                            "period": "2023.03 - 재학 중",
                            "status": "재학 중",
                            "description": "",
                            "imageDataUrl": "",
                        }
                    ],
                },
            ),
            block(
                "aiExperience",
                5,
                {
                    "title": "AI 활용 경험",
                    "content": "AI를 업무에 활용한 방법과 결과를 작성해 주세요.",
                },
            ),
            block("skills", 6, {"title": "스킬", "items": ["React", "TypeScript", "Python", "PostgreSQL"]}),
            block(
                "award",
                7,
                {
                    "title": "수상/자격증/기타",
                    "items": [{"id": str(uuid4()), "name": "활동명", "date": "2025.01", "description": ""}],
                },
                "half",
            ),
            block(
                "language",
                8,
                {
                    "title": "언어",
                    "items": [{"id": str(uuid4()), "language": "영어", "level": "업무 회화"}],
                },
                "half",
            ),
            block(
                "links",
                9,
                {
                    "title": "링크",
                    "items": [{"id": str(uuid4()), "label": "GitHub", "url": "https://github.com/"}],
                },
            ),
        ],
    }
