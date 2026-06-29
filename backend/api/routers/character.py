from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..schemas.character import CharacterCreate, CharacterUpdate, EquipmentUpdate, TransformRequest
from ..utils.database import get_db
from .auth import get_current_user

router = APIRouter()

@router.post("/")
async def create_character(character: CharacterCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    template = db.execute("SELECT * FROM characters_charactertemplate WHERE id = %s", (character.character_template_id,)).fetchone()
    profession = db.execute("SELECT * FROM characters_profession WHERE id = %s", (character.profession_id,)).fetchone()
    
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character template not found")
    if profession is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profession not found")
    
    db.execute(
        "INSERT INTO characters_gamecharacter (user_id, name, character_template_id, profession_id, level, exp, hp, max_hp, mp, max_mp, attack, defense, agility, intelligence, current_form) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (current_user.id, character.name, character.character_template_id, character.profession_id, 1, 0, template.base_hp, template.base_hp, 100, 100, template.base_attack, template.base_defense, template.base_agility, template.base_intelligence, 0)
    )
    db.commit()
    
    new_char = db.execute("SELECT * FROM characters_gamecharacter WHERE user_id = %s AND name = %s", (current_user.id, character.name)).fetchone()
    return {"id": new_char.id, "name": new_char.name, "level": new_char.level}

@router.get("/")
async def get_characters(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    characters = db.execute("SELECT * FROM characters_gamecharacter WHERE user_id = %s", (current_user.id,)).fetchall()
    return [{"id": c.id, "name": c.name, "level": c.level, "hp": c.hp, "max_hp": c.max_hp} for c in characters]

@router.get("/{character_id}")
async def get_character(character_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute("SELECT * FROM characters_gamecharacter WHERE id = %s AND user_id = %s", (character_id, current_user.id)).fetchone()
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
    character = db.execute("SELECT * FROM characters_gamecharacter WHERE id = %s AND user_id = %s", (character_id, current_user.id)).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    
    updates = []
    params = []
    
    if update_data.level is not None:
        updates.append("level = %s")
        params.append(update_data.level)
    if update_data.exp is not None:
        updates.append("exp = %s")
        params.append(update_data.exp)
    if update_data.hp is not None:
        updates.append("hp = %s")
        params.append(update_data.hp)
    if update_data.mp is not None:
        updates.append("mp = %s")
        params.append(update_data.mp)
    
    params.append(character_id)
    
    db.execute(f"UPDATE characters_gamecharacter SET {', '.join(updates)} WHERE id = %s", params)
    db.commit()
    
    updated_char = db.execute("SELECT * FROM characters_gamecharacter WHERE id = %s", (character_id,)).fetchone()
    return {"id": updated_char.id, "name": updated_char.name, "level": updated_char.level}

@router.put("/{character_id}/equipment")
async def update_equipment(character_id: int, equipment: EquipmentUpdate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute("SELECT * FROM characters_gamecharacter WHERE id = %s AND user_id = %s", (character_id, current_user.id)).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    
    db.execute(
        "REPLACE INTO characters_equipment (character_id, slot, equipment_template_id, level) VALUES (%s, %s, %s, %s)",
        (character_id, equipment.slot, equipment.equipment_id, 1)
    )
    db.commit()
    
    return {"message": "Equipment updated"}

@router.post("/{character_id}/transform")
async def transform_character(character_id: int, transform: TransformRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute("SELECT * FROM characters_gamecharacter WHERE id = %s AND user_id = %s", (character_id, current_user.id)).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    
    db.execute("UPDATE characters_gamecharacter SET current_form = %s WHERE id = %s", (transform.form_type, character_id))
    db.commit()
    
    return {"message": "Form transformed", "current_form": transform.form_type}