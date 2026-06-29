from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..schemas.character import CharacterCreate, CharacterUpdate, EquipmentUpdate, TransformRequest
from ..utils.database import get_db
from .auth import get_current_user

router = APIRouter()

@router.post("/")
async def create_character(character: CharacterCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    template = db.execute(text("SELECT * FROM characters_charactertemplate WHERE id = :template_id"), {"template_id": character.character_template_id}).fetchone()
    profession = db.execute(text("SELECT * FROM characters_profession WHERE id = :profession_id"), {"profession_id": character.profession_id}).fetchone()
    
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character template not found")
    if profession is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profession not found")
    
    db.execute(
        text("INSERT INTO characters_gamecharacter (user_id, name, character_template_id, profession_id, level, exp, hp, max_hp, mp, max_mp, attack, defense, agility, intelligence, current_form) VALUES (:user_id, :name, :template_id, :profession_id, :level, :exp, :hp, :max_hp, :mp, :max_mp, :attack, :defense, :agility, :intelligence, :current_form)"),
        {"user_id": current_user.id, "name": character.name, "template_id": character.character_template_id, "profession_id": character.profession_id, "level": 1, "exp": 0, "hp": template.base_hp, "max_hp": template.base_hp, "mp": 100, "max_mp": 100, "attack": template.base_attack, "defense": template.base_defense, "agility": template.base_agility, "intelligence": template.base_intelligence, "current_form": 0}
    )
    db.commit()
    
    new_char = db.execute(text("SELECT * FROM characters_gamecharacter WHERE user_id = :user_id AND name = :name"), {"user_id": current_user.id, "name": character.name}).fetchone()
    return {"id": new_char.id, "name": new_char.name, "level": new_char.level}

@router.get("/")
async def get_characters(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    characters = db.execute(text("SELECT * FROM characters_gamecharacter WHERE user_id = :user_id"), {"user_id": current_user.id}).fetchall()
    return [{"id": c.id, "name": c.name, "level": c.level, "hp": c.hp, "max_hp": c.max_hp, "mp": c.mp, "max_mp": c.max_mp} for c in characters]

@router.get("/{character_id}")
async def get_character(character_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute(text("SELECT * FROM characters_gamecharacter WHERE id = :character_id AND user_id = :user_id"), {"character_id": character_id, "user_id": current_user.id}).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    return {
        "id": character.id,
        "name": character.name,
        "level": character.level,
        "exp": character.exp,
        "hp": character.hp,
        "max_hp": character.max_hp,
        "mp": character.mp,
        "max_mp": character.max_mp,
        "attack": character.attack,
        "defense": character.defense,
        "agility": character.agility,
        "intelligence": character.intelligence,
        "current_form": character.current_form
    }

@router.put("/{character_id}")
async def update_character(character_id: int, update_data: CharacterUpdate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute(text("SELECT * FROM characters_gamecharacter WHERE id = :character_id AND user_id = :user_id"), {"character_id": character_id, "user_id": current_user.id}).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    
    updates = []
    params = {"character_id": character_id}
    
    if update_data.level is not None:
        updates.append("level = :level")
        params["level"] = update_data.level
    if update_data.exp is not None:
        updates.append("exp = :exp")
        params["exp"] = update_data.exp
    if update_data.hp is not None:
        updates.append("hp = :hp")
        params["hp"] = update_data.hp
    if update_data.mp is not None:
        updates.append("mp = :mp")
        params["mp"] = update_data.mp
    
    db.execute(text(f"UPDATE characters_gamecharacter SET {', '.join(updates)} WHERE id = :character_id"), params)
    db.commit()
    
    updated_char = db.execute(text("SELECT * FROM characters_gamecharacter WHERE id = :character_id"), {"character_id": character_id}).fetchone()
    return {"id": updated_char.id, "name": updated_char.name, "level": updated_char.level}

@router.put("/{character_id}/equipment")
async def update_equipment(character_id: int, equipment: EquipmentUpdate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute(text("SELECT * FROM characters_gamecharacter WHERE id = :character_id AND user_id = :user_id"), {"character_id": character_id, "user_id": current_user.id}).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    
    db.execute(
        text("REPLACE INTO characters_equipment (character_id, slot, equipment_template_id, level) VALUES (:character_id, :slot, :equipment_id, :level)"),
        {"character_id": character_id, "slot": equipment.slot, "equipment_id": equipment.equipment_id, "level": 1}
    )
    db.commit()
    
    return {"message": "Equipment updated"}

@router.post("/{character_id}/transform")
async def transform_character(character_id: int, transform: TransformRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute(text("SELECT * FROM characters_gamecharacter WHERE id = :character_id AND user_id = :user_id"), {"character_id": character_id, "user_id": current_user.id}).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    
    db.execute(text("UPDATE characters_gamecharacter SET current_form = :form_type WHERE id = :character_id"), {"form_type": transform.form_type, "character_id": character_id})
    db.commit()
    
    return {"message": "Form transformed", "current_form": transform.form_type}