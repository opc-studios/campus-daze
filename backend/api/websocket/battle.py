active_connections = {}

async def connect(websocket, user_id):
    await websocket.accept()
    active_connections[user_id] = websocket
    await websocket.send_json({"type": "CONNECTED", "message": "Battle websocket connected"})

async def disconnect(user_id):
    if user_id in active_connections:
        del active_connections[user_id]

async def handle_message(websocket, user_id, data):
    message_type = data.get("type")
    
    if message_type == "PLAYER_ATTACK":
        await websocket.send_json({
            "type": "DAMAGE_DEALT",
            "data": {
                "target_id": data.get("target_id"),
                "damage": 20,
                "hp_left": 80
            }
        })
    
    elif message_type == "PLAYER_SKILL":
        await websocket.send_json({
            "type": "DAMAGE_DEALT",
            "data": {
                "target_id": data.get("target_id"),
                "damage": 50,
                "hp_left": 50
            }
        })
    
    elif message_type == "FORM_CHANGE":
        await websocket.send_json({
            "type": "FORM_CHANGED",
            "data": {"form_type": data.get("form_type")}
        })
    
    elif message_type == "ENEMY_TURN":
        await websocket.send_json({
            "type": "ENEMY_TURN",
            "data": {"enemy_action": "attack", "damage": 15}
        })
    
    elif message_type == "BATTLE_END":
        await websocket.send_json({
            "type": "BATTLE_END",
            "data": {"result": data.get("result"), "rewards": {"exp": 100, "coins": 50}}
        })
    
    else:
        await websocket.send_json({"type": "ERROR", "message": "Unknown message type"})