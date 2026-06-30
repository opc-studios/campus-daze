"""
Battle WebSocket router.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json

router = APIRouter()

class BattleConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, battle_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[battle_id] = websocket

    def disconnect(self, battle_id: str):
        if battle_id in self.active_connections:
            del self.active_connections[battle_id]

    async def send_message(self, battle_id: str, message: dict):
        if battle_id in self.active_connections:
            await self.active_connections[battle_id].send_json(message)

manager = BattleConnectionManager()

@router.websocket("/battle/{battle_id}")
async def battle_websocket(websocket: WebSocket, battle_id: str):
    await manager.connect(battle_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await handle_battle_message(battle_id, data)
    except WebSocketDisconnect:
        manager.disconnect(battle_id)

async def handle_battle_message(battle_id: str, data: dict):
    message_type = data.get('type')
    if message_type == 'PLAYER_ATTACK':
        await manager.send_message(battle_id, {
            'type': 'DAMAGE_DEALT',
            'data': {'damage': 10, 'target_id': data.get('target_id')}
        })
    elif message_type == 'PLAYER_SKILL':
        await manager.send_message(battle_id, {
            'type': 'SKILL_USED',
            'data': {'skill_id': data.get('skill_id'), 'damage': 25}
        })
