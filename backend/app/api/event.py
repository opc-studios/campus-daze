from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.game_save import GameSave
from app.services.event_service import event_service
from app.services import save_service
from app.services.reward_service import reward_service
from loguru import logger
from pydantic import BaseModel

router = APIRouter(prefix="/api/event", tags=["event"])


class ResolveEventRequest(BaseModel):
    eventId: str
    optionIndex: int


class ResolveEventResponse(BaseModel):
    rewards: list
    consequence: str | None = None


@router.post("/resolve", response_model=ResolveEventResponse)
async def resolve_event(
    request: ResolveEventRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    结算事件选项
    """
    try:
        # 结算事件选项
        result = event_service.resolve_event_option(request.eventId, request.optionIndex)

        if not result:
            raise HTTPException(status_code=400, detail="Invalid event or option")

        # 直接查存档对象（需要修改 state_json）
        res = await db.execute(
            select(GameSave).where(GameSave.user_id == current_user.id)
        )
        save = res.scalar_one_or_none()

        if not save:
            raise HTTPException(status_code=404, detail="Save not found")

        # 应用奖励到存档
        state = save.state_json
        for reward in result["rewards"]:
            reward_type = reward.get("type")
            amount = reward.get("amount", 0)

            if reward_type == "exp":
                state["player"]["exp"] = state["player"].get("exp", 0) + amount
            elif reward_type == "credits":
                state["resources"]["credits"] = state["resources"].get("credits", 0) + amount
                state["progress"]["chapterCredits"] = state["progress"].get("chapterCredits", 0) + amount
            elif reward_type == "coins":
                state["resources"]["coins"] = state["resources"].get("coins", 0) + amount
            elif reward_type == "item":
                item_id = reward.get("itemId")
                if item_id:
                    state["inventory"][item_id] = state["inventory"].get(item_id, 0) + amount
            elif reward_type == "archive":
                archive_id = reward.get("itemId")
                if archive_id and archive_id not in state["progress"]["archives"]:
                    state["progress"]["archives"].append(archive_id)

        # 应用后果
        consequence = result.get("consequence")
        if consequence == "lose_5_credits":
            state["resources"]["credits"] = max(0, state["resources"].get("credits", 0) - 5)
        elif consequence == "lose_5_coins":
            state["resources"]["coins"] = max(0, state["resources"].get("coins", 0) - 5)

        # 保存存档
        save.state_json = state
        save.state_version += 1
        await db.commit()
        await db.refresh(save)

        # 通过 WebSocket 推送奖励通知
        await reward_service.notify_event_reward(
            current_user.id,
            request.eventId,
            {"rewards": result["rewards"]}
        )

        return ResolveEventResponse(
            rewards=result["rewards"],
            consequence=consequence
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to resolve event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
