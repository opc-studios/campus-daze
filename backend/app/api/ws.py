from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.utils.security import decode_token
from app.services.event_service import event_service
from typing import Dict, Set, Optional
import asyncio
import json
import random
import time
from loguru import logger

router = APIRouter(tags=["websocket"])


# H 挂机离线事件累积常量（GDD §6.6）
IDLE_INTERVAL_SECONDS = 600      # 挂机事件周期：600 秒
IDLE_TRIGGER_PROBABILITY = 0.30  # 每周期触发概率：30%
MAX_OFFLINE_ACCUMULATED = 10     # 离线累积事件上限


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # 用户挂机调度任务
        self.idle_scheduler_tasks: Dict[int, asyncio.Task] = {}
        # 预留：用户加入的房间
        self.user_rooms: Dict[int, Set[str]] = {}
        # 预留：房间内的用户列表
        self.room_users: Dict[str, Set[int]] = {}
        # H 离线事件累积：记录用户上次断开连接的时间戳
        self.last_disconnect_time: Dict[int, float] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        # H 离线事件累积：重连后批量推送离线期间累积的挂机事件
        await self._push_offline_accumulated_events(user_id)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                # H 离线事件累积：记录断开时间，供下次重连计算
                self.last_disconnect_time[user_id] = time.time()

        # 取消挂机调度任务
        if user_id in self.idle_scheduler_tasks:
            self.idle_scheduler_tasks[user_id].cancel()
            del self.idle_scheduler_tasks[user_id]

        # 预留：断开连接时清理房间信息
        if user_id in self.user_rooms:
            for room_id in self.user_rooms[user_id]:
                if room_id in self.room_users:
                    self.room_users[room_id].discard(user_id)
                    if not self.room_users[room_id]:
                        del self.room_users[room_id]
            del self.user_rooms[user_id]

    async def _push_offline_accumulated_events(self, user_id: int):
        """
        H 离线事件累积（GDD §6.6）：
        离线期间按 600s/30% 概率估算应触发的挂机事件数，
        上限 MAX_OFFLINE_ACCUMULATED，重连后批量推送通知。
        """
        last_disconnect = self.last_disconnect_time.pop(user_id, None)
        if last_disconnect is None:
            return
        offline_seconds = time.time() - last_disconnect
        if offline_seconds < IDLE_INTERVAL_SECONDS:
            return
        # 估算累积事件数 = 周期数 × 触发概率
        cycles = int(offline_seconds // IDLE_INTERVAL_SECONDS)
        expected = int(cycles * IDLE_TRIGGER_PROBABILITY)
        accumulated = min(expected, MAX_OFFLINE_ACCUMULATED)
        if accumulated <= 0:
            return
        logger.info(
            f"Offline accumulation for user {user_id}: "
            f"offline={offline_seconds:.0f}s, cycles={cycles}, accumulated={accumulated}"
        )
        # 推送累积通知（前端可展示"离线期间累积 N 个事件"提示）
        await self.send_personal_message(user_id, {
            "type": "offline_events_accumulated",
            "data": {
                "offlineSeconds": int(offline_seconds),
                "cycleCount": cycles,
                "accumulatedEvents": accumulated
            }
        })

    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.debug(f"Failed to send to user {user_id}: {e}")

    def start_idle_scheduler(self, user_id: int):
        """启动挂机随机事件调度器（每 600 秒尝试推送一次）"""
        if user_id in self.idle_scheduler_tasks:
            if not self.idle_scheduler_tasks[user_id].done():
                return
        task = asyncio.create_task(self._idle_event_loop(user_id))
        self.idle_scheduler_tasks[user_id] = task

    async def _idle_event_loop(self, user_id: int):
        """每 600 秒触发一次随机挂机事件（30% 概率）"""
        try:
            while True:
                await asyncio.sleep(IDLE_INTERVAL_SECONDS)
                if user_id not in self.active_connections:
                    break
                # 30% 概率触发
                if random.random() < IDLE_TRIGGER_PROBABILITY:
                    try:
                        await event_service.trigger_idle_event(user_id)
                    except Exception as e:
                        logger.exception(f"Idle event scheduler error for user {user_id}: {e}")
        except asyncio.CancelledError:
            logger.debug(f"Idle scheduler cancelled for user {user_id}")
        except Exception as e:
            logger.exception(f"Idle scheduler unexpected error for user {user_id}: {e}")

    # ========== 预留：多人功能房间系统 ==========

    async def join_room(self, user_id: int, room_id: str):
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)

        if room_id not in self.room_users:
            self.room_users[room_id] = set()
        self.room_users[room_id].add(user_id)

    async def leave_room(self, user_id: int, room_id: str):
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
            if not self.user_rooms[user_id]:
                del self.user_rooms[user_id]

        if room_id in self.room_users:
            self.room_users[room_id].discard(user_id)
            if not self.room_users[room_id]:
                del self.room_users[room_id]

    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user_id: int = None):
        if room_id not in self.room_users:
            return

        for user_id in self.room_users[room_id]:
            if exclude_user_id and user_id == exclude_user_id:
                continue
            await self.send_personal_message(user_id, message)

    async def get_room_users(self, room_id: str) -> Set[int]:
        return self.room_users.get(room_id, set())

    async def get_user_rooms(self, user_id: int) -> Set[str]:
        return self.user_rooms.get(user_id, set())


manager = ConnectionManager()


@router.websocket("/ws/game")
async def game_websocket(
    websocket: WebSocket,
    token: str
):
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001)
        return

    user_id = int(payload.get("sub"))

    await manager.connect(user_id, websocket)
    # 启动挂机随机事件调度器
    manager.start_idle_scheduler(user_id)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type")

                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                elif msg_type == "heartbeat":
                    await websocket.send_json({"type": "heartbeat_ack"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)


async def push_random_event(user_id: int, event_data: dict):
    await manager.send_personal_message(user_id, {
        "type": "random_event",
        "data": event_data
    })


async def push_reward_notification(user_id: int, reward_data: dict):
    await manager.send_personal_message(user_id, {
        "type": "reward",
        "data": reward_data
    })


async def push_system_notification(user_id: int, message: str):
    await manager.send_personal_message(user_id, {
        "type": "system",
        "data": {"message": message}
    })
