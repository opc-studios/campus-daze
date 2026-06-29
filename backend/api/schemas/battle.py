from pydantic import BaseModel

class BattleStart(BaseModel):
    enemy_id: int
    character_id: int

class SkillRelease(BaseModel):
    skill_id: int

class BattleResult(BaseModel):
    battle_id: int
    result: int
    rewards: dict