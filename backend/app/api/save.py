from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services import save_service
from app.schemas.game_state import GameState

router = APIRouter(tags=["save"])


@router.get("/api/save")
async def get_save(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = save_service.get_save(db, current_user.id)
    return result


@router.put("/api/save")
async def put_save(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    state = data.get("state")
    state_version = data.get("state_version", 0)
    
    result = save_service.put_save(db, current_user.id, state, state_version)
    return result
