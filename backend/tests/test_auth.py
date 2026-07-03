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


def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "password": "password123",
            "nickname": "Test User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["username"] == "testuser"
    assert data["user"]["email"] is None


def test_register_with_email(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser2",
            "password": "password123",
            "nickname": "Test User 2",
            "email": "test@example.com"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@example.com"


def test_login(client):
    client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "password": "password123",
            "nickname": "Test User"
        }
    )

    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "password": "password123",
            "nickname": "Test User"
        }
    )

    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401


def test_register_duplicate_username(client):
    client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "password": "password123",
            "nickname": "Test User"
        }
    )

    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "password": "password456",
            "nickname": "Another User"
        }
    )
    assert response.status_code == 409


def test_me_endpoint(client):
    reg = client.post(
        "/api/auth/register",
        json={
            "username": "meuser",
            "password": "password123",
            "nickname": "Me User"
        }
    )
    token = reg.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "meuser"


def test_refresh_token(client):
    reg = client.post(
        "/api/auth/register",
        json={
            "username": "refreshuser",
            "password": "password123",
            "nickname": "Refresh User"
        }
    )
    refresh_token = reg.json()["refresh_token"]

    response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
