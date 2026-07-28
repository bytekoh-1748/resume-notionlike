from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

BlockType = Literal[
    "profile",
    "summary",
    "experience",
    "project",
    "education",
    "aiExperience",
    "skills",
    "award",
    "language",
    "links",
    "richText",
    "bulletList",
    "divider",
]

TemplateId = Literal[
    "resume-one-page",
    "resume-two-page",
    "portfolio",
    "cover-letter",
]


class Theme(BaseModel):
    font: str = "Pretendard"
    accentColor: str = "#f97316"
    density: Literal["compact", "normal"] = "normal"


class PrintOptions(BaseModel):
    breakBefore: bool = False


class ResumeBlock(BaseModel):
    id: str
    type: BlockType
    order: int = Field(ge=0)
    width: Literal["full", "half"] = "full"
    print: PrintOptions = Field(default_factory=PrintOptions)
    data: dict[str, Any] = Field(default_factory=dict)


class ResumeDocument(BaseModel):
    schemaVersion: Literal[1] = 1
    template: TemplateId = "resume-one-page"
    theme: Theme = Field(default_factory=Theme)
    blocks: list[ResumeBlock] = Field(default_factory=list)


class ResumeCreate(BaseModel):
    title: str = Field(default="새 문서", min_length=1, max_length=160)
    document: ResumeDocument | None = None


class ResumeUpdate(BaseModel):
    baseRevision: int = Field(ge=1)
    title: str | None = Field(default=None, min_length=1, max_length=160)
    document: ResumeDocument | None = None


class ResumeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    slug: str
    draft_document: ResumeDocument
    published_document: ResumeDocument | None
    revision: int
    published_revision: int | None
    published_at: datetime | None
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PublicResume(BaseModel):
    title: str
    slug: str
    document: ResumeDocument
    published_at: datetime
