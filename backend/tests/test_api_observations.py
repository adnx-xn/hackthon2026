import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import ObsDatasetSummary, InstrumentRecord, ProfileData
from backend.services.observation_service import ObservationDatasetNotFoundError, InstrumentNotFoundError

client = TestClient(app)

@patch('backend.api.observations.observation_service.list_datasets')
def test_list_observations(mock_list):
    mock_list.return_value = [
        ObsDatasetSummary(
            id='obs1', name='obs1.nc', instrument_type='argo',
            instrument_count=1, lat_min=0, lat_max=10, lon_min=0, lon_max=10
        )
    ]
    response = client.get("/api/v1/observations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['id'] == 'obs1'
    assert 'file_path' not in data[0]

@patch('backend.api.observations.observation_service.get_instruments')
def test_get_instruments_success(mock_get):
    mock_get.return_value = [
        InstrumentRecord(
            id='inst1', instrument_type='argo', dataset_id='obs1',
            lat=0.0, lon=0.0, timestamp='2026-08-30T00:00:00Z',
            available_profile_vars=['temp']
        )
    ]
    response = client.get("/api/v1/observations/obs1/instruments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['id'] == 'inst1'

@patch('backend.api.observations.observation_service.get_instrument')
def test_get_instrument_not_found(mock_get):
    mock_get.side_effect = InstrumentNotFoundError("Instrument not found")
    response = client.get("/api/v1/observations/obs1/instruments/unknown")
    assert response.status_code == 404
    data = response.json()
    assert data['error'] is True
    assert data['code'] == 'DATASET_NOT_FOUND'

@patch('backend.api.observations.observation_service.get_profile')
def test_get_profile_success(mock_profile):
    mock_profile.return_value = ProfileData(
        instrument_id='inst1', instrument_type='argo', lat=0.0, lon=0.0,
        timestamp='2026-08-30T00:00:00Z', profiles={'temp': [1.0]},
        depths=[10.0], depth_from_pressure=False, units={'temp': 'C'}
    )
    response = client.get("/api/v1/observations/obs1/instruments/inst1/profile")
    assert response.status_code == 200
    data = response.json()
    assert data['instrument_id'] == 'inst1'
    assert data['profiles']['temp'][0] == 1.0

@patch('backend.api.observations.observation_service.get_instruments')
def test_get_instruments_dataset_not_found(mock_get):
    mock_get.side_effect = ObservationDatasetNotFoundError("Dataset not found")
    response = client.get("/api/v1/observations/unknown/instruments")
    assert response.status_code == 404
    data = response.json()
    assert data['error'] is True
    assert data['code'] == 'DATASET_NOT_FOUND'
