"""
WebSocket 功能测试
"""
import pytest
from fastapi import WebSocket
from unittest.mock import AsyncMock, MagicMock, patch
from app.api.ws import ConnectionManager, push_random_event, push_reward_notification


class TestConnectionManager:
    """测试连接管理器"""
    
    @pytest.fixture
    def manager(self):
        """创建连接管理器实例"""
        return ConnectionManager()
    
    @pytest.fixture
    def mock_websocket(self):
        """创建模拟 WebSocket 对象"""
        ws = MagicMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock()
        ws.receive_text = AsyncMock()
        return ws
    
    async def test_connect(self, manager, mock_websocket):
        """测试连接建立"""
        user_id = 1
        await manager.connect(user_id, mock_websocket)
        
        assert user_id in manager.active_connections
        assert mock_websocket in manager.active_connections[user_id]
        mock_websocket.accept.assert_called_once()
    
    async def test_disconnect(self, manager, mock_websocket):
        """测试连接断开"""
        user_id = 1
        await manager.connect(user_id, mock_websocket)
        manager.disconnect(user_id, mock_websocket)
        
        assert user_id not in manager.active_connections
    
    async def test_send_personal_message(self, manager, mock_websocket):
        """测试发送个人消息"""
        user_id = 1
        await manager.connect(user_id, mock_websocket)
        
        message = {"type": "test", "data": "hello"}
        await manager.send_personal_message(user_id, message)
        
        mock_websocket.send_json.assert_called_once_with(message)
    
    async def test_join_room(self, manager):
        """测试加入房间"""
        user_id = 1
        room_id = "room_1"
        
        await manager.join_room(user_id, room_id)
        
        assert user_id in manager.user_rooms
        assert room_id in manager.user_rooms[user_id]
        assert room_id in manager.room_users
        assert user_id in manager.room_users[room_id]
    
    async def test_leave_room(self, manager):
        """测试离开房间"""
        user_id = 1
        room_id = "room_1"
        
        await manager.join_room(user_id, room_id)
        await manager.leave_room(user_id, room_id)
        
        assert room_id not in manager.user_rooms.get(user_id, set())
        assert user_id not in manager.room_users.get(room_id, set())
    
    async def test_broadcast_to_room(self, manager, mock_websocket):
        """测试房间广播"""
        user_id_1 = 1
        user_id_2 = 2
        room_id = "room_1"
        
        mock_ws_2 = MagicMock(spec=WebSocket)
        mock_ws_2.accept = AsyncMock()
        mock_ws_2.send_json = AsyncMock()
        
        await manager.connect(user_id_1, mock_websocket)
        await manager.connect(user_id_2, mock_ws_2)
        await manager.join_room(user_id_1, room_id)
        await manager.join_room(user_id_2, room_id)
        
        message = {"type": "broadcast", "data": "test"}
        await manager.broadcast_to_room(room_id, message)
        
        mock_websocket.send_json.assert_called()
        mock_ws_2.send_json.assert_called()
    
    async def test_get_room_users(self, manager):
        """测试获取房间用户"""
        user_id_1 = 1
        user_id_2 = 2
        room_id = "room_1"
        
        await manager.join_room(user_id_1, room_id)
        await manager.join_room(user_id_2, room_id)
        
        users = await manager.get_room_users(room_id)
        assert user_id_1 in users
        assert user_id_2 in users
    
    async def test_get_user_rooms(self, manager):
        """测试获取用户房间"""
        user_id = 1
        room_id_1 = "room_1"
        room_id_2 = "room_2"
        
        await manager.join_room(user_id, room_id_1)
        await manager.join_room(user_id, room_id_2)
        
        rooms = await manager.get_user_rooms(user_id)
        assert room_id_1 in rooms
        assert room_id_2 in rooms


class TestPushFunctions:
    """测试推送函数"""
    
    @pytest.fixture
    def mock_manager(self):
        """创建模拟连接管理器"""
        manager = MagicMock(spec=ConnectionManager)
        manager.send_personal_message = AsyncMock()
        return manager
    
    async def test_push_random_event(self, mock_manager):
        """测试推送随机事件"""
        with patch('app.api.ws.manager', mock_manager):
            user_id = 1
            event_data = {"eventId": "evt_test", "name": "测试事件"}
            
            await push_random_event(user_id, event_data)
            
            mock_manager.send_personal_message.assert_called_once_with(
                user_id,
                {"type": "random_event", "data": event_data}
            )
    
    async def test_push_reward_notification(self, mock_manager):
        """测试推送奖励通知"""
        with patch('app.api.ws.manager', mock_manager):
            user_id = 1
            reward_data = {"source": "combat", "rewards": {"exp": 100}}
            
            await push_reward_notification(user_id, reward_data)
            
            mock_manager.send_personal_message.assert_called_once_with(
                user_id,
                {"type": "reward", "data": reward_data}
            )
