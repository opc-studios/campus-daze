from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..schemas.task import TaskProgressUpdate
from ..utils.database import get_db
from .auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_tasks(task_type: int = None, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if task_type:
        tasks = db.execute("SELECT * FROM tasks_task WHERE type = %s", (task_type,)).fetchall()
    else:
        tasks = db.execute("SELECT * FROM tasks_task").fetchall()
    
    return [{"id": t.id, "name": t.name, "description": t.description, "type": t.type, "difficulty": t.difficulty, "order": t.order} for t in tasks]

@router.get("/{task_id}")
async def get_task(task_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.execute("SELECT * FROM tasks_task WHERE id = %s", (task_id,)).fetchone()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    return {"id": task.id, "name": task.name, "description": task.description, "objectives": task.objectives}

@router.post("/{task_id}/accept")
async def accept_task(task_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.execute("SELECT * FROM tasks_task WHERE id = %s", (task_id,)).fetchone()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    character = db.execute("SELECT * FROM characters_gamecharacter WHERE user_id = %s LIMIT 1", (current_user.id,)).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No character found")
    
    existing_progress = db.execute("SELECT * FROM tasks_taskprogress WHERE character_id = %s AND task_id = %s", (character.id, task_id)).fetchone()
    if existing_progress:
        return {"message": "Task already accepted", "progress": existing_progress.progress}
    
    db.execute("INSERT INTO tasks_taskprogress (character_id, task_id, progress, status) VALUES (%s, %s, %s, %s)", (character.id, task_id, 0, 1))
    db.commit()
    
    return {"message": "Task accepted"}

@router.put("/{task_id}/progress")
async def update_task_progress(task_id: int, progress_data: TaskProgressUpdate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute("SELECT * FROM characters_gamecharacter WHERE user_id = %s LIMIT 1", (current_user.id,)).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No character found")
    
    progress = db.execute("SELECT * FROM tasks_taskprogress WHERE character_id = %s AND task_id = %s", (character.id, task_id)).fetchone()
    if progress is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task progress not found")
    
    db.execute("UPDATE tasks_taskprogress SET progress = %s WHERE id = %s", (progress_data.progress, progress.id))
    db.commit()
    
    return {"message": "Progress updated", "progress": progress_data.progress}

@router.post("/{task_id}/complete")
async def complete_task(task_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.execute("SELECT * FROM characters_gamecharacter WHERE user_id = %s LIMIT 1", (current_user.id,)).fetchone()
    if character is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No character found")
    
    progress = db.execute("SELECT * FROM tasks_taskprogress WHERE character_id = %s AND task_id = %s", (character.id, task_id)).fetchone()
    if progress is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task progress not found")
    
    db.execute("UPDATE tasks_taskprogress SET status = %s, completed_at = %s WHERE id = %s", (2, datetime.now(), progress.id))
    
    task = db.execute("SELECT * FROM tasks_task WHERE id = %s", (task_id,)).fetchone()
    if task.reward_id:
        reward = db.execute("SELECT * FROM rewards_reward WHERE id = %s", (task.reward_id,)).fetchone()
        if reward:
            db.execute("UPDATE characters_gamecharacter SET exp = exp + %s WHERE id = %s", (reward.exp_amount, character.id))
    
    db.commit()
    
    return {"message": "Task completed", "rewards": {"exp": reward.exp_amount if task.reward_id and reward else 0}}