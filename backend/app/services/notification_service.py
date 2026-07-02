from app.api.ws import push_random_event, push_reward_notification, push_system_notification
import random


class NotificationService:
    @staticmethod
    async def trigger_idle_event(user_id: int, task: str):
        events = [
            {
                "eventId": "evt_idle_cat",
                "name": "校园流浪猫",
                "description": "一只可爱的猫咪蹭了蹭你的腿。"
            },
            {
                "eventId": "evt_idle_tutor",
                "name": "学长辅导",
                "description": "一位热心的学长主动提出帮你解答疑惑。"
            },
            {
                "eventId": "evt_idle_coffee",
                "name": "免费咖啡",
                "description": "咖啡店今天做活动，免费赠送一杯咖啡。"
            }
        ]
        
        if random.random() < 0.3:
            event = random.choice(events)
            await push_random_event(user_id, event)
    
    @staticmethod
    async def notify_reward(user_id: int, rewards: dict):
        await push_reward_notification(user_id, rewards)
    
    @staticmethod
    async def notify_level_up(user_id: int, new_level: int):
        await push_system_notification(user_id, f"恭喜升级到 Lv.{new_level}!")
    
    @staticmethod
    async def notify_achievement(user_id: int, achievement: str):
        await push_system_notification(user_id, f"解锁成就: {achievement}")
