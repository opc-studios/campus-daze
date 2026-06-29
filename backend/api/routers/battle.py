from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..schemas.battle import BattleStart, SkillRelease
from ..utils.database import get_db
from .auth import get_current_user

router = APIRouter()

active_battles = {}

@router.post("/start")
async def start_battle(battle_data: BattleStart, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute("SELECT * FROM characters_gamecharacter WHERE id = %s AND user_id = %s", (battle_data.character_id, current_user.id)).fetchone()
    enemy = db.execute("SELECT * FROM enemies_enemy WHERE id = %s", (battle_data.enemy_id,)).fetchone()
    
    if character is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    if enemy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enemy not found")
    
    battle_id = f"battle_{datetime.now().timestamp()}"
    active_battles[battle_id] = {
        "character": character,
        "enemy": enemy,
        "turn": "player",
        "character_hp": character.hp,
        "enemy_hp": enemy.hp,
        "start_time": datetime.now()
    }
    
    db.execute(
        "INSERT INTO enemies_battle (character_id, enemy_id, result, turn_count, start_time) VALUES (%s, %s, %s, %s, %s)",
        (battle_data.character_id, battle_data.enemy_id, 0, 1, datetime.now())
    )
    db.commit()
    
    return {"battle_id": battle_id, "state": active_battles[battle_id]}

@router.post("/{battle_id}/attack")
async def attack(battle_id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if battle_id not in active_battles:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Battle not found")
    
    battle = active_battles[battle_id]
    if battle["turn"] != "player":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not your turn")
    
    damage = max(1, battle["character"].attack - battle["enemy"].defense // 2)
    battle["enemy_hp"] -= damage
    battle["turn"] = "enemy"
    
    if battle["enemy_hp"] <= 0:
        battle["enemy_hp"] = 0
        rewards = {"exp": battle["enemy"].exp_reward, "coins": battle["enemy"].coin_reward}
        db.execute("UPDATE enemies_battle SET result = %s, end_time = %s WHERE character_id = %s AND enemy_id = %s", (1, datetime.now(), battle["character"].id, battle["enemy"].id))
        db.execute("UPDATE characters_gamecharacter SET exp = exp + %s WHERE id = %s", (battle["enemy"].exp_reward, battle["character"].id))
        db.commit()
        del active_battles[battle_id]
        return {"result": "victory", "damage": damage, "rewards": rewards}
    
    return {"damage": damage, "enemy_hp": battle["enemy_hp"], "turn": "enemy"}

@router.post("/{battle_id}/skill")
async def use_skill(battle_id: str, skill_data: SkillRelease, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if battle_id not in active_battles:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Battle not found")
    
    battle = active_battles[battle_id]
    if battle["turn"] != "player":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not your turn")
    
    skill = db.execute("SELECT * FROM characters_skill WHERE id = %s AND character_id = %s", (skill_data.skill_id, battle["character"].id)).fetchone()
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    
    skill_template = db.execute("SELECT * FROM characters_skilltemplate WHERE id = %s", (skill.skill_template_id,)).fetchone()
    if skill_template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill template not found")
    
    if battle["character"].mp < skill_template.mp_cost:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough MP")
    
    damage = skill_template.damage + battle["character"].attack // 2
    battle["enemy_hp"] -= damage
    battle["turn"] = "enemy"
    
    db.execute("UPDATE characters_gamecharacter SET mp = mp - %s WHERE id = %s", (skill_template.mp_cost, battle["character"].id))
    db.commit()
    
    if battle["enemy_hp"] <= 0:
        battle["enemy_hp"] = 0
        rewards = {"exp": battle["enemy"].exp_reward, "coins": battle["enemy"].coin_reward}
        db.execute("UPDATE enemies_battle SET result = %s, end_time = %s WHERE character_id = %s AND enemy_id = %s", (1, datetime.now(), battle["character"].id, battle["enemy"].id))
        db.execute("UPDATE characters_gamecharacter SET exp = exp + %s WHERE id = %s", (battle["enemy"].exp_reward, battle["character"].id))
        db.commit()
        del active_battles[battle_id]
        return {"result": "victory", "damage": damage, "rewards": rewards}
    
    return {"damage": damage, "enemy_hp": battle["enemy_hp"], "turn": "enemy"}

@router.get("/{battle_id}/result")
async def get_battle_result(battle_id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if battle_id not in active_battles:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Battle not found or already ended")
    
    battle = active_battles[battle_id]
    return {
        "battle_id": battle_id,
        "character_hp": battle["character_hp"],
        "enemy_hp": battle["enemy_hp"],
        "turn": battle["turn"]
    }