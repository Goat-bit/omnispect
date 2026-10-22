from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_get_media_catalog():
    response = client.get("/api/media")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert len(data["items"]) >= 10


def test_filter_media_by_type():
    response = client.get("/api/media?media_type=anime")
    assert response.status_code == 200
    items = response.json()["items"]
    assert all(item["media_type"] == "anime" for item in items)


def test_recommendations_engine():
    response = client.get("/api/recommendations?media_id=1")
    assert response.status_code == 200
    data = response.json()
    assert data["source_media_id"] == 1
    assert len(data["recommendations"]) > 0


def test_prometheus_metrics_exposed():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text or "python_info" in response.text