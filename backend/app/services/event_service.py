import json
import random
from pathlib import Path
from typing import Optional
from loguru import logger
from app.api.ws import push_random_event


class EventService:
    def __init__(self):
        self.events = self._load_events()
    
    def _load_events(self) -> list:
        """加载事件配置"""
        try:
            events_path = Path(__file__).parent.parent.parent.parent / "frontend" / "src" / "game" / "config" / "events.json"
            if events_path.exists():
                with open(events_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            else:
                logger.warning(f"Events config not found at {events_path}")
                return []
        except Exception as e:
            logger.error(f"Failed to load events: {e}")
            return []
    
    async def trigger_idle_event(self, user_id: int, task: str) -> Optional[dict]:
        """
        挂机事件触发（每 10 分钟）
        
        Args:
            user_id: 用户 ID
            task: 当前挂机任务类型（study/intern）
        
        Returns:
            触发的事件数据，如果没有触发则返回 None
        """
        # 从 events.json 加载 trigger="idle" 的事件
        idle_events = [e for e in self.events if e.get("trigger") == "idle"]
        
        if not idle_events:
            logger.debug(f"No idle events available for user {user_id}")
            return None
        
        # 随机选择 1 个事件
        event = random.choice(idle_events)
        
        logger.info(f"Triggering idle event {event['eventId']} for user {user_id}")
        
        # 调用 push_random_event() 推送
        await push_random_event(user_id, event)
        
        return event
    
    async def trigger_map_event(self, user_id: int, node_id: str) -> Optional[dict]:
        """
        地图事件点触发
        
        Args:
            user_id: 用户 ID
            node_id: 地图节点 ID
        
        Returns:
            触发的事件数据，如果没有匹配的事件则返回 None
        """
        # 根据 node_id 从 events.json 加载对应事件
        map_events = [e for e in self.events if e.get("trigger") == "map" and e.get("nodeId") == node_id]
        
        if not map_events:
            logger.debug(f"No map event found for node {node_id}")
            return None
        
        # 地图事件点必定触发
        event = map_events[0]  # 通常一个节点只有一个事件
        
        logger.info(f"Triggering map event {event['eventId']} at node {node_id} for user {user_id}")
        
        # 调用 push_random_event() 推送
        await push_random_event(user_id, event)
        
        return event
    
    def get_event_by_id(self, event_id: str) -> Optional[dict]:
        """根据事件 ID 获取事件配置"""
        for event in self.events:
            if event.get("eventId") == event_id:
                return event
        return None
    
    def resolve_event_option(self, event_id: str, option_index: int) -> Optional[dict]:
        """
        结算事件选项
        
        Args:
            event_id: 事件 ID
            option_index: 选项索引（0-based）
        
        Returns:
            奖励数据，如果事件或选项不存在则返回 None
        """
        event = self.get_event_by_id(event_id)
        if not event:
            logger.warning(f"Event {event_id} not found")
            return None
        
        options = event.get("options", [])
        if option_index < 0 or option_index >= len(options):
            logger.warning(f"Invalid option index {option_index} for event {event_id}")
            return None
        
        option = options[option_index]
        rewards = option.get("rewards", [])
        consequence = option.get("consequence")
        
        return {
            "rewards": rewards,
            "consequence": consequence
        }


# 全局实例
event_service = EventService()
