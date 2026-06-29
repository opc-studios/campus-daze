active_connections = {}

async def connect(websocket, user_id):
    await websocket.accept()
    active_connections[user_id] = websocket
    await broadcast_online_users()

async def disconnect(user_id):
    if user_id in active_connections:
        del active_connections[user_id]
        await broadcast_online_users()

async def broadcast_online_users():
    online_users = list(active_connections.keys())
    for ws in active_connections.values():
        await ws.send_json({"type": "ONLINE_USERS", "data": {"users": online_users}})

async def handle_message(websocket, user_id, data):
    message_type = data.get("type")
    
    if message_type == "CHAT_MESSAGE":
        message_data = data.get("data", {})
        for target_user_id, target_ws in active_connections.items():
            await target_ws.send_json({
                "type": "CHAT_MESSAGE",
                "data": {
                    "channel": message_data.get("channel"),
                    "message": message_data.get("message"),
                    "sender": user_id
                }
            })
    
    elif message_type == "JOIN_CHANNEL":
        await websocket.send_json({
            "type": "JOINED_CHANNEL",
            "data": {"channel": data.get("channel")}
        })
    
    else:
        await websocket.send_json({"type": "ERROR", "message": "Unknown message type"})