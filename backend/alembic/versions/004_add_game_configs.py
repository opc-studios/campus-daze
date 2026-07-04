"""add game_configs table

Revision ID: 004_add_game_configs
Revises: 003_add_email_verifications
Create Date: 2026-07-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import MEDIUMTEXT


revision = "004_add_game_configs"
down_revision = "003_add_email_verifications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "game_configs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("config_name", sa.String(64), nullable=False),
        sa.Column("content", MEDIUMTEXT(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("config_name", name="uq_game_configs_config_name"),
    )
    op.create_index("ix_game_configs_config_name", "game_configs", ["config_name"])


def downgrade() -> None:
    op.drop_index("ix_game_configs_config_name", table_name="game_configs")
    op.drop_table("game_configs")
