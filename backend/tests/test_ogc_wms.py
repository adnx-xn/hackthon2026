import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.main import app

client = TestClient(app)

def test_wms_get_capabilities():
    response = client.get("/api/v1/ogc/wms?SERVICE=WMS&REQUEST=GetCapabilities")
    assert response.status_code == 200
    assert "text/xml" in response.headers["content-type"]
    assert "<WMS_Capabilities" in response.text
    assert "version=\"1.3.0\"" in response.text

def test_wms_invalid_service():
    response = client.get("/api/v1/ogc/wms?SERVICE=INVALID&REQUEST=GetCapabilities")
    assert response.status_code == 400
    assert "text/xml" in response.headers["content-type"]
    assert "SERVICE must be WMS" in response.text

def test_wms_get_map_missing_layers():
    response = client.get("/api/v1/ogc/wms?SERVICE=WMS&REQUEST=GetMap")
    assert response.status_code == 400
    assert "LAYERS parameter is required" in response.text

def test_wms_get_map_invalid_bbox():
    response = client.get("/api/v1/ogc/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS=dummy&BBOX=invalid&WIDTH=256&HEIGHT=256")
    assert response.status_code == 400
    assert "Invalid BBOX format" in response.text

def test_wms_get_map_invalid_size():
    response = client.get("/api/v1/ogc/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS=dummy&BBOX=0,0,10,10&WIDTH=9999&HEIGHT=256")
    assert response.status_code == 400
    assert "WIDTH or HEIGHT exceeds maximum allowed size" in response.text

def test_wms_get_map_layer_not_found():
    response = client.get("/api/v1/ogc/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS=nonexistent&BBOX=0,0,10,10&WIDTH=256&HEIGHT=256")
    assert response.status_code == 400
    assert "Layer nonexistent not found" in response.text

@patch("backend.services.dataset_service.DatasetService.get_wms_map")
@patch("backend.services.catalog_service.CatalogService.get_model_dataset")
def test_wms_get_map_success(mock_get_dataset, mock_get_wms_map):
    mock_get_dataset.return_value = MagicMock(variables=["temp"], time_steps=["2026-01-01T00:00:00Z"], depth_levels=[0.0])
    mock_get_wms_map.return_value = b"fake_png_bytes"
    
    response = client.get("/api/v1/ogc/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS=dummy&BBOX=0,0,10,10&WIDTH=256&HEIGHT=256")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content == b"fake_png_bytes"
