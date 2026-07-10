from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings


if "sqlite" in settings.DATABASE_URL:
    sync_engine = create_engine(
        settings.DATABASE_URL.replace("+aiosqlite", ""),
        echo=False,
        connect_args={"check_same_thread": False},
    )
else:
    sync_engine = create_engine(
        settings.DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
    )

SessionLocal = sessionmaker(
    bind=sync_engine,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_db_async():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()