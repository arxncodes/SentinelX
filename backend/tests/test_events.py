"""
Integration tests for event ingestion API.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

TEST_DATABASE_URL = "sqlite:///./test_events.db"
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


@pytest.fixture
def auth_headers(client):
    """Register and login a test user, return auth headers."""
    client.post("/api/auth/register", json={
        "username": "eventtest",
        "email": "eventtest@example.com",
        "password": "eventpass123",
    })
    resp = client.post("/api/auth/login", json={
        "username": "eventtest",
        "password": "eventpass123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestEventIngestion:
    def test_ingest_auth_failure(self, client):
        response = client.post("/api/events", json={
            "source_ip": "192.168.1.100",
            "event_type": "authentication_failure",
            "service": "ssh",
            "username": "root",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["source_ip"] == "192.168.1.100"
        assert data["event_type"] == "authentication_failure"

    def test_ingest_port_scan(self, client):
        response = client.post("/api/events", json={
            "source_ip": "10.0.0.99",
            "event_type": "port_scan",
            "port": 22,
        })
        assert response.status_code == 201

    def test_ingest_requires_source_ip(self, client):
        response = client.post("/api/events", json={
            "event_type": "authentication_failure",
        })
        assert response.status_code == 422  # Validation error

    def test_list_events_requires_auth(self, client):
        response = client.get("/api/events")
        assert response.status_code == 403

    def test_list_events_authenticated(self, client, auth_headers):
        # Ingest a few events first
        for i in range(3):
            client.post("/api/events", json={
                "source_ip": f"10.0.0.{i+1}",
                "event_type": "authentication_failure",
            })

        response = client.get("/api/events", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 3

    def test_invalid_event_type(self, client):
        response = client.post("/api/events", json={
            "source_ip": "1.2.3.4",
            "event_type": "invalid_event_type_xyz",
        })
        assert response.status_code == 422
