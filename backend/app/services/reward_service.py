from typing import Dict, Any
from loguru import logger
from app.api.ws import push_reward_notification


class RewardService:
    """奖励通知推送服务"""
    
    async def notify_offline_reward(self, user_id: int, rewards: Dict[str, Any]):
        """
        离线收益通知
        
        Args:
            user_id: 用户 ID
            rewards: 奖励数据，例如 {"exp": 100, "credits": 5, "coins": 50}
        """
        logger.info(f"Notifying offline reward for user {user_id}: {rewards}")
        
        await push_reward_notification(user_id, {
            "source": "offline",
            "rewards": rewards
        })
    
    async def notify_combat_reward(self, user_id: int, rewards: Dict[str, Any]):
        """
        战斗胜利奖励通知
        
        Args:
            user_id: 用户 ID
            rewards: 奖励数据，例如 {"exp": 50, "credits": 3, "items": ["item_1"]}
        """
        logger.info(f"Notifying combat reward for user {user_id}: {rewards}")
        
        await push_reward_notification(user_id, {
            "source": "combat",
            "rewards": rewards
        })
    
    async def notify_event_reward(self, user_id: int, event_id: str, rewards: Dict[str, Any]):
        """
        事件奖励通知
        
        Args:
            user_id: 用户 ID
            event_id: 事件 ID
            rewards: 奖励数据
        """
        logger.info(f"Notifying event reward for user {user_id}, event {event_id}: {rewards}")
        
        await push_reward_notification(user_id, {
            "source": "event",
            "event_id": event_id,
            "rewards": rewards
        })
    
    async def notify_achievement_unlock(self, user_id: int, achievement_id: str, achievement_name: str):
        """
        成就解锁通知
        
        Args:
            user_id: 用户 ID
            achievement_id: 成就 ID
            achievement_name: 成就名称
        """
        logger.info(f"Notifying achievement unlock for user {user_id}: {achievement_id}")
        
        await push_reward_notification(user_id, {
            "source": "achievement",
            "achievement_id": achievement_id,
            "achievement_name": achievement_name
        })
    
    async def notify_chapter_clear(self, user_id: int, chapter_id: int, rewards: Dict[str, Any]):
        """
        章节通关奖励通知
        
        Args:
            user_id: 用户 ID
            chapter_id: 章节 ID
            rewards: 奖励数据
        """
        logger.info(f"Notifying chapter clear reward for user {user_id}, chapter {chapter_id}: {rewards}")
        
        await push_reward_notification(user_id, {
            "source": "chapter_clear",
            "chapter_id": chapter_id,
            "rewards": rewards
        })


# 全局实例
reward_service = RewardService()
