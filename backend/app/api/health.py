from fastapi import APIRouter
from app.schemas.common import HealthResponse
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
    )
