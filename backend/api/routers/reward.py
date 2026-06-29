from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..utils.database import get_db
from .auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_rewards(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    rewards = db.execute("SELECT * FROM rewards_reward").fetchall()
    return [{"id": r.id, "name": r.name, "coin_amount": r.coin_amount, "exp_amount": r.exp_amount, "cat_food_amount": r.cat_food_amount} for r in rewards]

@router.post("/{reward_id}/claim")
async def claim_reward(reward_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    reward = db.execute("SELECT * FROM rewards_reward WHERE id = %s", (reward_id,)).fetchone()
    if reward is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found")
    
    character = db.execute("SELECT * FROM characters_gamecharacter WHERE user_id = %s LIMIT 1", (current_user.id,)).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No character found")
    
    db.execute("UPDATE characters_gamecharacter SET exp = exp + %s WHERE id = %s", (reward.exp_amount, character.id))
    db.commit()
    
    return {"message": "Reward claimed", "rewards": {"exp": reward.exp_amount, "coins": reward.coin_amount}}

@router.get("/achievements")
async def get_achievements(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    achievements = db.execute("SELECT * FROM rewards_achievement").fetchall()
    
    character = db.execute("SELECT * FROM characters_gamecharacter WHERE user_id = %s LIMIT 1", (current_user.id,)).fetchone()
    if character is None:
        return [{"id": a.id, "name": a.name, "description": a.description, "unlocked": 0} for a in achievements]
    
    char_achievements = {}
    for ca in db.execute("SELECT * FROM rewards_characterachievement WHERE character_id = %s", (character.id,)).fetchall():
        char_achievements[ca.achievement_id] = ca
    
    return [{
        "id": a.id,
        "name": a.name,
        "description": a.description,
        "unlocked": char_achievements.get(a.id, type('obj', (object,), {'unlocked': 0})).unlocked
    } for a in achievements]