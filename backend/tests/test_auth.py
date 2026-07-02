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
            "email": "test@example.com",
            "password": "password123",
            "nickname": "Test User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_login(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "nickname": "Test User"
        }
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
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
            "email": "test@example.com",
            "password": "password123",
            "nickname": "Test User"
        }
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401


def test_register_duplicate_email(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "nickname": "Test User"
        }
    )

    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "password456",
            "nickname": "Another User"
        }
    )
    assert response.status_code == 409
