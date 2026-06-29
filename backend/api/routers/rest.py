from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta

from ..utils.database import get_db
from .auth import get_current_user

router = APIRouter()

@router.post("/start")
async def start_rest(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute(text("SELECT * FROM characters_gamecharacter WHERE user_id = :user_id LIMIT 1"), {"user_id": current_user.id}).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No character found")
    
    db.execute(text("INSERT INTO rest_restrecord (character_id, start_time) VALUES (:character_id, :start_time)"), {"character_id": character.id, "start_time": datetime.now()})
    db.commit()
    
    return {"message": "Rest started", "start_time": datetime.now().isoformat()}

@router.post("/end")
async def end_rest(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute(text("SELECT * FROM characters_gamecharacter WHERE user_id = :user_id LIMIT 1"), {"user_id": current_user.id}).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No character found")
    
    rest_record = db.execute(text("SELECT * FROM rest_restrecord WHERE character_id = :character_id AND end_time IS NULL ORDER BY start_time DESC LIMIT 1"), {"character_id": character.id}).fetchone()
    if rest_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active rest found")
    
    duration = (datetime.now() - rest_record.start_time).total_seconds() // 60
    coins_earned = min(100, int(duration * 2))
    exp_earned = min(200, int(duration * 3))
    cat_food_earned = min(10, int(duration // 10))
    
    db.execute(text("UPDATE rest_restrecord SET end_time = :end_time, coins_earned = :coins_earned, exp_earned = :exp_earned, cat_food_earned = :cat_food_earned WHERE id = :record_id"),
               {"end_time": datetime.now(), "coins_earned": coins_earned, "exp_earned": exp_earned, "cat_food_earned": cat_food_earned, "record_id": rest_record.id})
    db.execute(text("UPDATE characters_gamecharacter SET exp = exp + :exp_earned WHERE id = :character_id"), {"exp_earned": exp_earned, "character_id": character.id})
    db.commit()
    
    return {"message": "Rest ended", "rewards": {"coins": coins_earned, "exp": exp_earned, "cat_food": cat_food_earned}}

@router.get("/offline")
async def get_offline_rewards(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute(text("SELECT * FROM characters_gamecharacter WHERE user_id = :user_id LIMIT 1"), {"user_id": current_user.id}).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No character found")
    
    last_login = character.updated_at if hasattr(character, 'updated_at') else datetime.now() - timedelta(hours=1)
    offline_duration = (datetime.now() - last_login).total_seconds() // 60
    
    if offline_duration < 5:
        return {"message": "Not enough offline time", "rewards": {}}
    
    coins_earned = min(500, int(offline_duration * 1.5))
    exp_earned = min(1000, int(offline_duration * 2))
    
    return {"message": "Offline rewards calculated", "offline_minutes": int(offline_duration), "rewards": {"coins": coins_earned, "exp": exp_earned}}