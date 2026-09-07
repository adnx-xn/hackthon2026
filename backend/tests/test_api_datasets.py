import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import DatasetMetadataPublic, DataSlice, VectorSlice
from backend.services.dataset_service import DatasetNotFoundError

client = TestClient(app)

@patch('backend.api.datasets.dataset_service.list_datasets')
def test_list_datasets(mock_list):
    mock_list.return_value = [
        DatasetMetadataPublic(
            id='model1', name='model1.nc', format='netcdf', dataset_type='model',
            variables=['temp'], has_u_v=False, depth_levels=[0.0],
            depth_from_pressure=False, time_steps=['2026-08-30T00:00:00Z'],
            lat_min=0, lat_max=10, lon_min=0, lon_max=10
        )
    ]
    response = client.get("/api/v1/datasets")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['id'] == 'model1'
    assert 'file_path' not in data[0]

@patch('backend.api.datasets.dataset_service.get_dataset')
def test_get_dataset_success(mock_get):
    mock_get.return_value = DatasetMetadataPublic(
        id='model1', name='model1.nc', format='netcdf', dataset_type='model',
        variables=['temp'], has_u_v=False, depth_levels=[0.0],
        depth_from_pressure=False, time_steps=['2026-08-30T00:00:00Z'],
        lat_min=0, lat_max=10, lon_min=0, lon_max=10
    )
    response = client.get("/api/v1/datasets/model1")
    assert response.status_code == 200
    assert response.json()['id'] == 'model1'
    assert 'file_path' not in response.json()

@patch('backend.api.datasets.dataset_service.get_dataset')
def test_get_dataset_not_found(mock_get):
    mock_get.side_effect = DatasetNotFoundError("Dataset not found")
    response = client.get("/api/v1/datasets/unknown")
    assert response.status_code == 404
    data = response.json()
    assert data['error'] is True
    assert data['code'] == 'DATASET_NOT_FOUND'

@patch('backend.api.datasets.dataset_service.get_data_slice')
def test_get_data_success(mock_get_slice):
    mock_get_slice.return_value = DataSlice(
        dataset_id='model1', variable='temp', depth_m=0.0, depth_from_pressure=False,
        timestamp='2026-08-30T00:00:00Z', lat=[0.0], lon=[0.0], values=[[1.0]],
        units='C', value_min=1.0, value_max=1.0
    )
    
    response = client.get("/api/v1/datasets/model1/data?variable=temp&depth_idx=0&time_idx=0")
    assert response.status_code == 200
    data = response.json()
    assert data['dataset_id'] == 'model1'

def test_get_data_invalid_params():
    response = client.get("/api/v1/datasets/model1/data?variable=temp&depth_idx=-1&time_idx=0")
    assert response.status_code == 422
    data = response.json()
    assert data['error'] is True
    assert data['code'] == 'VALIDATION_ERROR'

@patch('backend.api.datasets.dataset_service.get_vector_slice')
def test_get_vectors_no_uv(mock_get_vector):
    mock_get_vector.side_effect = ValueError("Dataset does not contain valid U and V components.")
    response = client.get("/api/v1/datasets/model1/vectors?depth_idx=0&time_idx=0")
    assert response.status_code == 422
    data = response.json()
    assert data['error'] is True
    assert data['code'] == 'NO_UV_DATA'

@patch('backend.api.datasets.dataset_service.get_data_slice')
def test_get_data_variable_not_found(mock_get_slice):
    mock_get_slice.side_effect = ValueError("Variable not_there not found in dataset.")
    response = client.get("/api/v1/datasets/model1/data?variable=not_there&depth_idx=0&time_idx=0")
    assert response.status_code == 422
    data = response.json()
    assert data['error'] is True
    assert data['code'] == 'VARIABLE_NOT_FOUND'
