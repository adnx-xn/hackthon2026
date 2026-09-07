import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture
def client() -> TestClient:
    """Return a FastAPI test client instance."""
    return TestClient(app)
