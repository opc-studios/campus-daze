from pydantic import BaseModel
from typing import Optional

class CharacterCreate(BaseModel):
    name: str
    character_template_id: int
    profession_id: int

class CharacterUpdate(BaseModel):
    level: Optional[int] = None
    exp: Optional[int] = None
    hp: Optional[int] = None
    mp: Optional[int] = None

class EquipmentUpdate(BaseModel):
    slot: int
    equipment_id: int

class TransformRequest(BaseModel):
    form_type: int