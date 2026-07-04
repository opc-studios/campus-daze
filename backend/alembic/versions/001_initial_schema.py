"""initial schema with users + game_saves + game_images

Revision ID: 001
Revises:
Create Date: 2026-07-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) users 表
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('nickname', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('idx_users_username', 'users', ['username'], unique=True)
    op.create_index('idx_users_email', 'users', ['email'])

    # 2) game_saves 表
    op.create_table(
        'game_saves',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
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
    op.create_index('idx_save_user', 'game_saves', ['user_id'], unique=True)

    # 3) game_images 表（MEDIUMBLOB 立绘存储）
    op.create_table(
        'game_images',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('entity_type', sa.String(length=32), nullable=False, comment='protagonist/monster/boss/item/archive/sprite'),
        sa.Column('entity_key', sa.String(length=64), nullable=False, comment='如 lina / m_delay / boss_ai_prof'),
        sa.Column('image_type', sa.String(length=32), nullable=False, server_default='portrait', comment='portrait/icon/cat_form 等'),
        sa.Column('mime_type', sa.String(length=32), nullable=False, server_default='image/png'),
        sa.Column('image_data', mysql.MEDIUMBLOB(), nullable=False, comment='图片二进制（最大 16MB）'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    # 联合索引便于查重
    op.create_index(
        'idx_game_images_lookup',
        'game_images',
        ['entity_type', 'entity_key', 'image_type'],
        unique=True
    )


def downgrade() -> None:
    op.drop_table('game_images')
    op.drop_table('game_saves')
    op.drop_table('users')
