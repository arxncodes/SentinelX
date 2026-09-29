"""
API integration tests for authentication endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# Test database (SQLite in-memory)
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True, scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


class TestAuth:
    def test_register_user(self, client):
        response = client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "securepass123",
            "full_name": "Test User",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "testuser"
        assert "hashed_password" not in data

    def test_register_duplicate_username(self, client):
        client.post("/api/auth/register", json={
            "username": "dupuser",
            "email": "dup@example.com",
            "password": "password123",
        })
        response = client.post("/api/auth/register", json={
            "username": "dupuser",
            "email": "other@example.com",
            "password": "password123",
        })
        assert response.status_code == 400

    def test_login_success(self, client):
        client.post("/api/auth/register", json={
            "username": "logintest",
            "email": "login@example.com",
            "password": "testpass456",
        })
        response = client.post("/api/auth/login", json={
            "username": "logintest",
            "password": "testpass456",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register", json={
            "username": "wrongpass",
            "email": "wrongpass@example.com",
            "password": "correct_pass",
        })
        response = client.post("/api/auth/login", json={
            "username": "wrongpass",
            "password": "wrong_password",
        })
        assert response.status_code == 401

    def test_get_me_authenticated(self, client):
        client.post("/api/auth/register", json={
            "username": "meuser",
            "email": "me@example.com",
            "password": "mepassword123",
        })
        login_resp = client.post("/api/auth/login", json={
            "username": "meuser",
            "password": "mepassword123",
        })
        token = login_resp.json()["access_token"]

        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["username"] == "meuser"

    def test_get_me_unauthenticated(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 403
