from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.utils.security import decode_token
from app.models.user import User
from sqlalchemy import select
from typing import Dict, Set
import json

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # 预留：用户加入的房间
        self.user_rooms: Dict[int, Set[str]] = {}
        # 预留：房间内的用户列表
        self.room_users: Dict[str, Set[int]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # 预留：断开连接时清理房间信息
        if user_id in self.user_rooms:
            for room_id in self.user_rooms[user_id]:
                if room_id in self.room_users:
                    self.room_users[room_id].discard(user_id)
                    if not self.room_users[room_id]:
                        del self.room_users[room_id]
            del self.user_rooms[user_id]

    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    # ========== 预留：多人功能房间系统 ==========
    
    async def join_room(self, user_id: int, room_id: str):
        """
        预留：用户加入房间
        
        Args:
            user_id: 用户 ID
            room_id: 房间 ID
        """
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)
        
        if room_id not in self.room_users:
            self.room_users[room_id] = set()
        self.room_users[room_id].add(user_id)
    
    async def leave_room(self, user_id: int, room_id: str):
        """
        预留：用户离开房间
        
        Args:
            user_id: 用户 ID
            room_id: 房间 ID
        """
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
            if not self.user_rooms[user_id]:
                del self.user_rooms[user_id]
        
        if room_id in self.room_users:
            self.room_users[room_id].discard(user_id)
            if not self.room_users[room_id]:
                del self.room_users[room_id]
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user_id: int = None):
        """
        预留：房间广播（未来多人功能）
        
        Args:
            room_id: 房间 ID
            message: 要广播的消息
            exclude_user_id: 排除的用户 ID（可选）
        """
        if room_id not in self.room_users:
            return
        
        for user_id in self.room_users[room_id]:
            if exclude_user_id and user_id == exclude_user_id:
                continue
            await self.send_personal_message(user_id, message)
    
    async def get_room_users(self, room_id: str) -> Set[int]:
        """
        预留：获取房间内所有用户
        
        Args:
            room_id: 房间 ID
        
        Returns:
            房间内用户 ID 集合
        """
        return self.room_users.get(room_id, set())
    
    async def get_user_rooms(self, user_id: int) -> Set[str]:
        """
        预留：获取用户加入的所有房间
        
        Args:
            user_id: 用户 ID
        
        Returns:
            用户加入的房间 ID 集合
        """
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
