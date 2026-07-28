"""create resumes table

Revision ID: 0001
Revises:
Create Date: 2026-07-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "resumes",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=32), nullable=False),
        sa.Column("draft_document", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("published_document", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("revision", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("published_revision", sa.Integer(), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_resumes_slug", "resumes", ["slug"], unique=True)
    op.create_index("ix_resumes_deleted_at", "resumes", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("ix_resumes_deleted_at", table_name="resumes")
    op.drop_index("ix_resumes_slug", table_name="resumes")
    op.drop_table("resumes")

