import pytest
from starlette.testclient import TestClient
from app.main import app
from app.database import get_db
from tests.conftest import test_engine
from sqlalchemy.orm import sessionmaker


@pytest.fixture
def db_session(test_engine):
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_token(client):
    import uuid
    unique_username = f"save_test_{uuid.uuid4().hex[:8]}"
    response = client.post(
        "/api/auth/register",
        json={
            "username": unique_username,
            "password": "password123",
            "nickname": "Test User"
        }
    )
    return response.json()["access_token"]


def test_get_save_not_found(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/save", headers=headers)
    assert response.status_code == 404


def test_put_save(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    game_state = {
        "player": {
            "name": "莉娜",
            "roleId": "lina",
            "currentForm": "human",
            "combatRole": "summon_spirit",
            "level": 1,
            "exp": 0,
            "attrs": {"knowledge": 8, "practice": 5, "insight": 6, "resilience": 4},
            "combatStats": {"critRate": 0.05, "critDamage": 1.5, "evasionRate": 0.05, "accuracyRate": 0.95},
            "unlockedSkills": ["lina_basic"],
            "equippedSkills": ["lina_basic", None, None]
        },
        "resources": {"credits": 0, "coins": 0},
        "idle": {"task": "study", "startedAt": 0, "lastClaimedAt": 0},
        "progress": {
            "currentChapter": 0,
            "chapterCleared": [False, False, False, False],
            "chapterCredits": 0,
            "clearedNodes": [],
            "seenEvents": [],
            "archives": []
        },
        "map": {
            "currentMapId": "ch1_map1",
            "playerPosition": {"x": 100, "y": 300},
            "formSwitchAllowed": True,
            "revealedRegions": ["entrance"],
            "completedNodes": [],
            "nodeCooldowns": {}
        },
        "monsters": {},
        "combat": {"state": "idle", "speed": 1, "canSkip": True, "skipped": False},
        "inventory": {},
        "equipped": {}
    }

    response = client.put(
        "/api/save",
        json={"state": game_state, "state_version": 0},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "state_version" in data


def test_get_save_after_put(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    game_state = {
        "player": {
            "name": "莉娜",
            "roleId": "lina",
            "currentForm": "human",
            "combatRole": "summon_spirit",
            "level": 1,
            "exp": 0,
            "attrs": {"knowledge": 8, "practice": 5, "insight": 6, "resilience": 4},
            "combatStats": {"critRate": 0.05, "critDamage": 1.5, "evasionRate": 0.05, "accuracyRate": 0.95},
            "unlockedSkills": ["lina_basic"],
            "equippedSkills": ["lina_basic", None, None]
        },
        "resources": {"credits": 0, "coins": 0},
        "idle": {"task": "study", "startedAt": 0, "lastClaimedAt": 0},
        "progress": {
            "currentChapter": 0,
            "chapterCleared": [False, False, False, False],
            "chapterCredits": 0,
            "clearedNodes": [],
            "seenEvents": [],
            "archives": []
        },
        "map": {
            "currentMapId": "ch1_map1",
            "playerPosition": {"x": 100, "y": 300},
            "formSwitchAllowed": True,
            "revealedRegions": ["entrance"],
            "completedNodes": [],
            "nodeCooldowns": {}
        },
        "monsters": {},
        "combat": {"state": "idle", "speed": 1, "canSkip": True, "skipped": False},
        "inventory": {},
        "equipped": {}
    }

    client.put(
        "/api/save",
        json={"state": game_state, "state_version": 0},
        headers=headers
    )

    response = client.get("/api/save", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "state" in data
    assert data["state"]["player"]["name"] == "莉娜"


def test_version_mismatch(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    game_state = {
        "player": {
            "name": "莉娜",
            "roleId": "lina",
            "currentForm": "human",
            "combatRole": "summon_spirit",
            "level": 1,
            "exp": 0,
            "attrs": {"knowledge": 8, "practice": 5, "insight": 6, "resilience": 4},
            "combatStats": {"critRate": 0.05, "critDamage": 1.5, "evasionRate": 0.05, "accuracyRate": 0.95},
            "unlockedSkills": ["lina_basic"],
            "equippedSkills": ["lina_basic", None, None]
        },
        "resources": {"credits": 0, "coins": 0},
        "idle": {"task": "study", "startedAt": 0, "lastClaimedAt": 0},
        "progress": {
            "currentChapter": 0,
            "chapterCleared": [False, False, False, False],
            "chapterCredits": 0,
            "clearedNodes": [],
            "seenEvents": [],
            "archives": []
        },
        "map": {
            "currentMapId": "ch1_map1",
            "playerPosition": {"x": 100, "y": 300},
            "formSwitchAllowed": True,
            "revealedRegions": ["entrance"],
            "completedNodes": [],
            "nodeCooldowns": {}
        },
        "monsters": {},
        "combat": {"state": "idle", "speed": 1, "canSkip": True, "skipped": False},
        "inventory": {},
        "equipped": {}
    }

    client.put(
        "/api/save",
        json={"state": game_state, "state_version": 0},
        headers=headers
    )

    response = client.put(
        "/api/save",
        json={"state": game_state, "state_version": 0},
        headers=headers
    )
    assert response.status_code == 409
