import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import VolumeMetadata, VolumeSlice
from backend.services.dataset_service import DatasetNotFoundError
import json

client = TestClient(app)

@patch('backend.api.volume.dataset_service.get_volume')
def test_get_volume_success(mock_get_volume):
    metadata = VolumeMetadata(
        dataset_id='model1',
        variable='temp',
        time_idx=0,
        dimensions={"nz": 2, "ny": 3, "nx": 4},
        dimension_order=["depth", "lat", "lon"],
        depths=[0.0, 10.0],
        latitudes=[10.0, 20.0, 30.0],
        longitudes=[100.0, 110.0, 120.0, 130.0],
        dtype="float32",
        missing_value="NaN",
        units="C",
        value_min=0.0,
        value_max=10.0
    )
    
    # 2 * 3 * 4 = 24 elements -> 96 bytes float32
    binary_data = b'0' * 96 
    
    mock_get_volume.return_value = VolumeSlice(
        metadata=metadata,
        binary_data=binary_data
    )
    
    response = client.get("/api/v1/datasets/model1/volume?variable=temp&time_idx=0")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/octet-stream"
    
    assert "X-Volume-Metadata" in response.headers
    metadata_response = json.loads(response.headers["X-Volume-Metadata"])
    
    assert metadata_response["dataset_id"] == "model1"
    assert metadata_response["dimensions"]["nz"] == 2
    assert metadata_response["dimension_order"] == ["depth", "lat", "lon"]
    
    # Check binary length
    assert len(response.content) == 96

@patch('backend.api.volume.dataset_service.get_volume')
def test_get_volume_not_found(mock_get_volume):
    mock_get_volume.side_effect = DatasetNotFoundError("Dataset not found")
    response = client.get("/api/v1/datasets/unknown/volume?variable=temp&time_idx=0")
    assert response.status_code == 404
    data = response.json()
    assert data['error'] is True
    assert data['code'] == 'DATASET_NOT_FOUND'

def test_get_volume_invalid_params():
    response = client.get("/api/v1/datasets/model1/volume?variable=temp&time_idx=-1")
    assert response.status_code == 422
    data = response.json()
    assert data['error'] is True
    assert data['code'] == 'VALIDATION_ERROR'
