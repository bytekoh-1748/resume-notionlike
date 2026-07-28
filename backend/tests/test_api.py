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
    experience = next(
        block for block in resume["draft_document"]["blocks"] if block["type"] == "experience"
    )
    education = next(
        block for block in resume["draft_document"]["blocks"] if block["type"] == "education"
    )
    assert experience["data"]["items"][0]["imageDataUrl"] == ""
    assert experience["data"]["items"][0]["employmentType"] == "정규직"
    assert experience["data"]["items"][0]["role"] == ""
    assert education["data"]["items"][0]["imageDataUrl"] == ""
    assert education["data"]["items"][0]["status"] == "재학 중"

    experience["data"]["items"][0]["imageDataUrl"] = (
        "data:image/webp;base64,UklGRg=="
    )

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
