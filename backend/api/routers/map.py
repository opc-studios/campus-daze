from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..utils.database import get_db
from .auth import get_current_user

router = APIRouter()

@router.get("/areas")
async def get_areas(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    areas = db.execute(text("SELECT * FROM areas_area ORDER BY `order`")).fetchall()
    return [{"id": a.id, "name": a.name, "description": a.description, "unlocked": a.unlocked, "exploration_percent": a.exploration_percent} for a in areas]

@router.get("/areas/{area_id}")
async def get_area(area_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    area = db.execute(text("SELECT * FROM areas_area WHERE id = :area_id"), {"area_id": area_id}).fetchone()
    if area is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    
    npcs = db.execute(text("SELECT * FROM npcs_npc WHERE area_id = :area_id"), {"area_id": area_id}).fetchall()
    enemies = db.execute(text("SELECT * FROM enemies_enemy WHERE area_id = :area_id"), {"area_id": area_id}).fetchall()
    
    return {
        "id": area.id,
        "name": area.name,
        "description": area.description,
        "npcs": [{"id": n.id, "name": n.name} for n in npcs],
        "enemies": [{"id": e.id, "name": e.name, "level": e.level} for e in enemies]
    }

@router.post("/areas/{area_id}/explore")
async def explore_area(area_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    area = db.execute(text("SELECT * FROM areas_area WHERE id = :area_id"), {"area_id": area_id}).fetchone()
    if area is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    
    new_percent = min(100, area.exploration_percent + 10)
    db.execute(text("UPDATE areas_area SET exploration_percent = :new_percent WHERE id = :area_id"), {"new_percent": new_percent, "area_id": area_id})
    db.commit()
    
    rewards = {"exp": 50, "coins": 20}
    
    return {"message": "Area explored", "exploration_percent": new_percent, "rewards": rewards}