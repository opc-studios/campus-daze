from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..schemas.npc import DialogueResponse
from ..utils.database import get_db
from .auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_npcs(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    npcs = db.execute("SELECT * FROM npcs_npc").fetchall()
    return [{"id": n.id, "name": n.name, "area_id": n.area_id, "affinity": n.affinity} for n in npcs]

@router.get("/{npc_id}/dialogue")
async def get_dialogue(npc_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    npc = db.execute("SELECT * FROM npcs_npc WHERE id = %s", (npc_id,)).fetchone()
    if npc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NPC not found")
    
    dialogue = db.execute("SELECT * FROM npcs_dialogue WHERE npc_id = %s ORDER BY order LIMIT 1", (npc_id,)).fetchone()
    if dialogue is None:
        return {"text": "没有对话内容", "choices": []}
    
    return {"text": dialogue.text, "choices": dialogue.choices, "next_dialogue_id": dialogue.next_dialogue_id}

@router.post("/{npc_id}/respond")
async def respond_dialogue(npc_id: int, response: DialogueResponse, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    npc = db.execute("SELECT * FROM npcs_npc WHERE id = %s", (npc_id,)).fetchone()
    if npc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NPC not found")
    
    db.execute("UPDATE npcs_npc SET affinity = affinity + %s, dialogues_completed = dialogues_completed + %s WHERE id = %s", (5, 1, npc_id))
    db.commit()
    
    return {"message": "Response received", "affinity": npc.affinity + 5}