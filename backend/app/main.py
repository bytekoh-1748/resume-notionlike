import copy
import os
import secrets
from datetime import datetime, timezone
from urllib.parse import quote
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from playwright.async_api import async_playwright
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from .database import get_db
from .defaults import default_document
from .models import Resume
from .schemas import PublicResume, ResumeCreate, ResumeDocument, ResumeRead, ResumeUpdate

app = FastAPI(title="Blockfolio Resume API", version="1.0.0")

origins = {
    os.getenv("WEB_ORIGIN", "http://localhost:5173"),
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(origins),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def resume_read(resume: Resume) -> ResumeRead:
    return ResumeRead.model_validate(resume)


def get_resume_or_404(db: Session, resume_id: str, include_deleted: bool = False) -> Resume:
    resume = db.get(Resume, resume_id)
    if resume is None or (resume.deleted_at is not None and not include_deleted):
        raise HTTPException(status_code=404, detail="resume_not_found")
    return resume


def public_resume_or_404(db: Session, slug: str) -> Resume:
    resume = db.scalar(
        select(Resume).where(
            Resume.slug == slug,
            Resume.deleted_at.is_(None),
            Resume.published_document.is_not(None),
        )
    )
    if resume is None:
        raise HTTPException(status_code=404, detail="published_resume_not_found")
    return resume


@app.get("/healthz")
def healthz(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/api/resumes", response_model=list[ResumeRead])
def list_resumes(
    include_deleted: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    stmt = select(Resume).order_by(Resume.updated_at.desc())
    if not include_deleted:
        stmt = stmt.where(Resume.deleted_at.is_(None))
    return [resume_read(item) for item in db.scalars(stmt).all()]


@app.post("/api/resumes", response_model=ResumeRead, status_code=201)
def create_resume(payload: ResumeCreate, db: Session = Depends(get_db)):
    document = payload.document.model_dump() if payload.document else default_document()
    resume = Resume(
        id=str(uuid4()),
        title=payload.title.strip(),
        slug=secrets.token_hex(6),
        draft_document=document,
        revision=1,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume_read(resume)


@app.get("/api/resumes/{resume_id}", response_model=ResumeRead)
def get_resume(resume_id: str, db: Session = Depends(get_db)):
    return resume_read(get_resume_or_404(db, resume_id))


@app.patch("/api/resumes/{resume_id}", response_model=ResumeRead)
def update_resume(resume_id: str, payload: ResumeUpdate, db: Session = Depends(get_db)):
    resume = get_resume_or_404(db, resume_id)
    if resume.revision != payload.baseRevision:
        return JSONResponse(
            status_code=409,
            content={
                "detail": "revision_conflict",
                "latest": resume_read(resume).model_dump(mode="json"),
            },
        )
    changed = False
    if payload.title is not None and payload.title.strip() != resume.title:
        resume.title = payload.title.strip()
        changed = True
    if payload.document is not None:
        document = payload.document.model_dump()
        if document != resume.draft_document:
            resume.draft_document = document
            changed = True
    if changed:
        resume.revision += 1
        resume.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(resume)
    return resume_read(resume)


@app.delete("/api/resumes/{resume_id}", response_model=ResumeRead)
def delete_resume(resume_id: str, db: Session = Depends(get_db)):
    resume = get_resume_or_404(db, resume_id)
    resume.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(resume)
    return resume_read(resume)


@app.post("/api/resumes/{resume_id}/restore", response_model=ResumeRead)
def restore_resume(resume_id: str, db: Session = Depends(get_db)):
    resume = get_resume_or_404(db, resume_id, include_deleted=True)
    resume.deleted_at = None
    db.commit()
    db.refresh(resume)
    return resume_read(resume)


@app.post("/api/resumes/{resume_id}/duplicate", response_model=ResumeRead, status_code=201)
def duplicate_resume(resume_id: str, db: Session = Depends(get_db)):
    source = get_resume_or_404(db, resume_id)
    document = copy.deepcopy(source.draft_document)
    for block in document.get("blocks", []):
        block["id"] = str(uuid4())
        for item in block.get("data", {}).get("items", []):
            if isinstance(item, dict) and "id" in item:
                item["id"] = str(uuid4())
    duplicate = Resume(
        id=str(uuid4()),
        title=f"{source.title} 복사본",
        slug=secrets.token_hex(6),
        draft_document=document,
        revision=1,
    )
    db.add(duplicate)
    db.commit()
    db.refresh(duplicate)
    return resume_read(duplicate)


@app.post("/api/resumes/{resume_id}/publish", response_model=ResumeRead)
def publish_resume(resume_id: str, db: Session = Depends(get_db)):
    resume = get_resume_or_404(db, resume_id)
    resume.published_document = copy.deepcopy(resume.draft_document)
    resume.published_revision = resume.revision
    resume.published_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(resume)
    return resume_read(resume)


@app.post("/api/resumes/{resume_id}/unpublish", response_model=ResumeRead)
def unpublish_resume(resume_id: str, db: Session = Depends(get_db)):
    resume = get_resume_or_404(db, resume_id)
    resume.published_document = None
    resume.published_revision = None
    resume.published_at = None
    db.commit()
    db.refresh(resume)
    return resume_read(resume)


@app.get("/api/public/resumes", response_model=list[PublicResume])
def list_public_resumes(db: Session = Depends(get_db)):
    items = db.scalars(
        select(Resume)
        .where(Resume.deleted_at.is_(None), Resume.published_document.is_not(None))
        .order_by(Resume.published_at.desc())
    ).all()
    return [
        PublicResume(
            title=item.title,
            slug=item.slug,
            document=ResumeDocument.model_validate(item.published_document),
            published_at=item.published_at,
        )
        for item in items
    ]


@app.get("/api/public/resumes/{slug}", response_model=PublicResume)
def get_public_resume(slug: str, db: Session = Depends(get_db)):
    resume = public_resume_or_404(db, slug)
    return PublicResume(
        title=resume.title,
        slug=resume.slug,
        document=ResumeDocument.model_validate(resume.published_document),
        published_at=resume.published_at,
    )


async def render_pdf(url: str) -> bytes:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.emulate_media(media="screen")
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_selector("[data-render-ready='true']", timeout=20_000)
        await page.evaluate("document.fonts.ready")
        pdf = await page.pdf(
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
            tagged=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        await browser.close()
        return pdf


@app.get("/api/resumes/{resume_id}/pdf")
async def get_draft_pdf(
    resume_id: str,
    inline: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    resume = get_resume_or_404(db, resume_id)
    web_url = os.getenv("WEB_INTERNAL_URL", "http://web:3000")
    api_url = os.getenv("API_INTERNAL_URL", "http://api:8000")
    pdf = await render_pdf(f"{web_url}/print/{resume.id}?api={quote(api_url, safe='')}")
    filename = quote(f"{resume.title}.pdf")
    return Response(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f"{'inline' if inline else 'attachment'}; filename*=UTF-8''{filename}"
        },
    )


@app.get("/api/public/resumes/{slug}/pdf")
async def get_public_pdf(slug: str, db: Session = Depends(get_db)):
    resume = public_resume_or_404(db, slug)
    web_url = os.getenv("WEB_INTERNAL_URL", "http://web:3000")
    api_url = os.getenv("API_INTERNAL_URL", "http://api:8000")
    pdf = await render_pdf(f"{web_url}/r/{resume.slug}?print=1&api={quote(api_url, safe='')}")
    filename = quote(f"{resume.title}.pdf")
    return Response(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )
