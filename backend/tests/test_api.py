from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.models import Base

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
Base.metadata.create_all(engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_resume_lifecycle_and_revision_conflict():
    created = client.post("/api/resumes", json={"title": "테스트 이력서"})
    assert created.status_code == 201
    resume = created.json()
    assert resume["revision"] == 1
    assert len(resume["draft_document"]["blocks"]) >= 5
    assert resume["draft_document"]["template"] == "resume-one-page"
    assert resume["draft_document"]["theme"]["accentColor"] == "#024ad8"
    profile = next(
        block for block in resume["draft_document"]["blocks"] if block["type"] == "profile"
    )
    assert profile["data"]["contactVisibility"] == {
        "email": True,
        "phone": True,
        "location": True,
    }
    assert profile["data"]["contactLinks"][0]["label"] == "GitHub"
    assert profile["data"]["contactLinks"][0]["url"] == "https://github.com/"
    assert not any(
        block["type"] == "links"
        for block in resume["draft_document"]["blocks"]
    )
    assert profile["format"] == {
        "fontScale": 100,
        "bold": False,
        "italic": False,
        "dividerThickness": 1,
    }
    experience = next(
        block for block in resume["draft_document"]["blocks"] if block["type"] == "experience"
    )
    project = next(
        block for block in resume["draft_document"]["blocks"] if block["type"] == "project"
    )
    education = next(
        block for block in resume["draft_document"]["blocks"] if block["type"] == "education"
    )
    assert experience["data"]["items"][0]["imageDataUrl"] == ""
    assert experience["data"]["items"][0]["employmentType"] == "정규직"
    assert experience["data"]["items"][0]["role"] == ""
    assert project["data"]["items"][0]["organization"] == "진행한 곳"
    assert project["data"]["items"][0]["teamSize"] == "5인 팀"
    assert project["data"]["items"][0]["imageDataUrl"] == ""
    assert project["data"]["items"][0]["evidenceLinks"][0]["label"] == "GitHub 저장소"
    assert project["data"]["items"][0]["evidenceLinks"][0]["url"] == ""
    assert education["data"]["items"][0]["imageDataUrl"] == ""
    assert education["data"]["items"][0]["status"] == "재학 중"

    experience["data"]["items"][0]["imageDataUrl"] = (
        "data:image/webp;base64,UklGRg=="
    )
    experience["format"] = {
        "fontScale": 110,
        "bold": True,
        "italic": False,
        "dividerThickness": 1,
    }

    changed = client.patch(
        f"/api/resumes/{resume['id']}",
        json={
            "baseRevision": 1,
            "title": "수정한 이력서",
            "document": resume["draft_document"],
        },
    )
    assert changed.status_code == 200
    assert changed.json()["revision"] == 2
    saved_experience = next(
        block
        for block in changed.json()["draft_document"]["blocks"]
        if block["type"] == "experience"
    )
    assert saved_experience["data"]["items"][0]["imageDataUrl"].startswith(
        "data:image/webp;base64,"
    )
    assert saved_experience["format"]["fontScale"] == 110
    assert saved_experience["format"]["bold"] is True

    stale = client.patch(
        f"/api/resumes/{resume['id']}",
        json={
            "baseRevision": 1,
            "title": "오래된 수정",
        },
    )
    assert stale.status_code == 409
    assert stale.json()["detail"] == "revision_conflict"

    published = client.post(f"/api/resumes/{resume['id']}/publish")
    assert published.status_code == 200
    slug = published.json()["slug"]
    public = client.get(f"/api/public/resumes/{slug}")
    assert public.status_code == 200
    assert public.json()["title"] == "수정한 이력서"


def test_create_document_with_explicit_template():
    document = {
        "schemaVersion": 1,
        "template": "resume-two-page",
        "theme": {
            "font": "Pretendard",
            "accentColor": "#024ad8",
            "density": "compact",
        },
        "blocks": [
            {
                "id": "profile-template-test",
                "type": "profile",
                "order": 0,
                "width": "full",
                "print": {"breakBefore": False},
                "data": {"name": "템플릿 테스트"},
            },
            {
                "id": "page-two-template-test",
                "type": "experience",
                "order": 1,
                "width": "full",
                "print": {"breakBefore": True},
                "data": {"title": "경력", "items": []},
            },
        ],
    }
    created = client.post(
        "/api/resumes",
        json={"title": "2장 템플릿 테스트", "document": document},
    )
    assert created.status_code == 201
    payload = created.json()
    assert payload["draft_document"]["template"] == "resume-two-page"
    assert payload["draft_document"]["blocks"][1]["print"]["breakBefore"] is True


def test_create_photo_sidebar_template():
    document = {
        "schemaVersion": 1,
        "template": "resume-photo-sidebar",
        "theme": {
            "font": "Pretendard",
            "accentColor": "#024ad8",
            "density": "normal",
        },
        "blocks": [
            {
                "id": "photo-sidebar-profile",
                "type": "profile",
                "order": 0,
                "width": "full",
                "print": {"breakBefore": False},
                "data": {"name": "사진형 테스트", "layout": "right-photo"},
            },
            {
                "id": "photo-sidebar-experience",
                "type": "experience",
                "order": 1,
                "width": "full",
                "print": {"breakBefore": False},
                "data": {
                    "title": "경력",
                    "layoutColumn": "main",
                    "items": [],
                },
            },
            {
                "id": "photo-sidebar-education",
                "type": "education",
                "order": 2,
                "width": "full",
                "print": {"breakBefore": False},
                "data": {
                    "title": "학력",
                    "layoutColumn": "sidebar",
                    "items": [],
                },
            },
        ],
    }
    created = client.post(
        "/api/resumes",
        json={"title": "사진형 템플릿 테스트", "document": document},
    )
    assert created.status_code == 201
    payload = created.json()["draft_document"]
    assert payload["template"] == "resume-photo-sidebar"
    assert payload["blocks"][0]["data"]["layout"] == "right-photo"
    assert payload["blocks"][2]["data"]["layoutColumn"] == "sidebar"


def test_duplicate_rekeys_blocks_and_restore():
    created = client.post("/api/resumes", json={"title": "원본"}).json()
    duplicate = client.post(f"/api/resumes/{created['id']}/duplicate")
    assert duplicate.status_code == 201
    copied = duplicate.json()
    assert copied["id"] != created["id"]
    original_ids = {block["id"] for block in created["draft_document"]["blocks"]}
    copied_ids = {block["id"] for block in copied["draft_document"]["blocks"]}
    assert original_ids.isdisjoint(copied_ids)

    deleted = client.delete(f"/api/resumes/{created['id']}")
    assert deleted.status_code == 200
    assert client.get(f"/api/resumes/{created['id']}").status_code == 404
    restored = client.post(f"/api/resumes/{created['id']}/restore")
    assert restored.status_code == 200
    assert restored.json()["deleted_at"] is None
