from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.game_save import GameSave, RoleIdEnum
from app.utils.errors import SaveNotFound, SaveVersionMismatch, SaveRoleLocked
from app.services.progress_validator import ProgressValidator


async def get_save(db: AsyncSession, user_id: int) -> dict:
    result = await db.execute(
        select(GameSave).where(GameSave.user_id == user_id)
    )
    save = result.scalar_one_or_none()

    if not save:
        raise SaveNotFound()

    return {
        "state": save.state_json,
        "state_version": save.state_version
    }


async def put_save(
    db: AsyncSession,
    user_id: int,
    state: dict,
    state_version: int
) -> dict:
    result = await db.execute(
        select(GameSave).where(GameSave.user_id == user_id)
    )
    save = result.scalar_one_or_none()

    if not save:
        new_save = GameSave(
            user_id=user_id,
            role_id=state["player"]["roleId"],
            state_json=state,
            state_version=1,
            schema_version=1
        )
        db.add(new_save)
        await db.commit()
        await db.refresh(new_save)
        return {"state_version": new_save.state_version}

    if save.state_version != state_version:
        raise SaveVersionMismatch()

    if save.role_id != state["player"]["roleId"]:
        raise SaveRoleLocked()

    old_state = save.state_json
    validator = ProgressValidator()
    validation_result = validator.validate(old_state, state)

    if not validation_result["valid"]:
        from app.utils.errors import SaveValidationFailed
        raise SaveValidationFailed(validation_result.get("errors"))

    save.state_json = state
    save.state_version += 1
    await db.commit()
    await db.refresh(save)

    return {"state_version": save.state_version}


async def init_save(
    db: AsyncSession,
    user_id: int,
    role_id: str,
    initial_state: dict
) -> dict:
    result = await db.execute(
        select(GameSave).where(GameSave.user_id == user_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        return {
            "state": existing.state_json,
            "state_version": existing.state_version
        }

    new_save = GameSave(
        user_id=user_id,
        role_id=role_id,
        state_json=initial_state,
        state_version=1,
        schema_version=1
    )
    db.add(new_save)
    await db.commit()
    await db.refresh(new_save)

    return {
        "state": new_save.state_json,
        "state_version": new_save.state_version
    }


async def update_save(db: AsyncSession, save: GameSave) -> None:
    """更新存档（事件结算等场景使用）"""
    await db.commit()
    await db.refresh(save)
