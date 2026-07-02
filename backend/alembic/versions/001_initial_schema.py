"""initial schema

Revision ID: 001
Revises: 
Create Date: 2026-07-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('nickname', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('idx_email', 'users', ['email'])

    op.create_table(
        'game_saves',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('role_id', sa.Enum('lina', 'ayu', 'zhixia', 'jiangxun', 'laodeng'), nullable=False),
        sa.Column('state_json', sa.JSON(), nullable=False, comment='完整 GameState'),
        sa.Column('state_version', sa.Integer(), nullable=False, server_default='1', comment='乐观锁版本'),
        sa.Column('schema_version', sa.Integer(), nullable=False, server_default='1', comment='GameState schema 版本'),
        sa.Column('checksum', sa.String(length=64), nullable=True, comment='state_json 摘要防篡改'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('idx_save_user', 'game_saves', ['user_id'])


def downgrade() -> None:
    op.drop_table('game_saves')
    op.drop_table('users')
