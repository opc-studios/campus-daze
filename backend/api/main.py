import os
import sys
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from api.routers import auth, character, battle, task, map, npc, reward, rest
from api.websocket import battle as ws_battle, chat as ws_chat

app = FastAPI(title="学术喵的奇幻之旅", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(character.router, prefix="/api/characters", tags=["characters"])
app.include_router(battle.router, prefix="/api/battle", tags=["battle"])
app.include_router(task.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(map.router, prefix="/api/map", tags=["map"])
app.include_router(npc.router, prefix="/api/npc", tags=["npc"])
app.include_router(reward.router, prefix="/api/rewards", tags=["rewards"])
app.include_router(rest.router, prefix="/api/rest", tags=["rest"])

@app.get("/")
async def root():
    return {"message": "学术喵的奇幻之旅 API"}

@app.websocket("/ws/battle/{user_id}")
async def websocket_battle(websocket: WebSocket, user_id: str):
    await ws_battle.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            await ws_battle.handle_message(websocket, user_id, data)
    except WebSocketDisconnect:
        await ws_battle.disconnect(user_id)

@app.websocket("/ws/chat/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: str):
    await ws_chat.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            await ws_chat.handle_message(websocket, user_id, data)
    except WebSocketDisconnect:
        await ws_chat.disconnect(user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)