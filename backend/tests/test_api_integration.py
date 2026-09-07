import os
import pytest
import numpy as np
import xarray as xr
import pandas as pd
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.catalog_service import catalog_service

@pytest.fixture(scope="module")
def setup_integration_env(tmp_path_factory):
    """
    Creates temporary NetCDF files (Model & Obs) and builds the real catalog.
    """
    models_dir = tmp_path_factory.mktemp("models")
    obs_dir = tmp_path_factory.mktemp("obs")

    # 1. Create Model Dataset
    lat = np.array([10.0, 0.0, -10.0])
    lon = np.array([0.0, 180.0, 350.0])
    depth = np.array([0.0, 50.0])
    time = pd.date_range("2026-08-30", periods=1).values

    temp_data = np.ones((1, 2, 3, 3))
    u_data = np.ones((1, 2, 3, 3))
    v_data = np.ones((1, 2, 3, 3))

    model_ds = xr.Dataset(
        data_vars=dict(
            temp=(["time", "depth", "lat", "lon"], temp_data),
            u=(["time", "depth", "lat", "lon"], u_data),
            v=(["time", "depth", "lat", "lon"], v_data),
        ),
        coords=dict(
            lon=(["lon"], lon),
            lat=(["lat"], lat),
            depth=(["depth"], depth),
            time=(["time"], time),
        ),
        attrs=dict(description="Integration Model")
    )
    model_ds['depth'].attrs['units'] = 'm'
    
    model_file = models_dir / "int_model.nc"
    model_ds.to_netcdf(str(model_file))

    # 2. Create Obs Dataset (Argo format)
    obs_lat = np.array([5.0])
    obs_lon = np.array([100.0])
    obs_time = pd.date_range("2026-08-30", periods=1).values
    
    # Needs N_PROF and N_LEVELS for Argo
    prof_temp = np.ones((1, 10))
    prof_pres = np.linspace(0, 100, 10).reshape(1, 10)
    
    obs_ds = xr.Dataset(
        data_vars=dict(
            TEMP=(["N_PROF", "N_LEVELS"], prof_temp),
            PRES=(["N_PROF", "N_LEVELS"], prof_pres),
            PLATFORM_NUMBER=(["N_PROF"], np.array([b"1234567"])),
            LATITUDE=(["N_PROF"], obs_lat),
            LONGITUDE=(["N_PROF"], obs_lon),
            JULD=(["N_PROF"], obs_time)
        ),
        coords=dict(
            N_PROF=(["N_PROF"], [0]),
            N_LEVELS=(["N_LEVELS"], list(range(10)))
        ),
        attrs=dict(description="Integration Obs")
    )
    
    obs_file = obs_dir / "int_obs.nc"
    obs_ds.to_netcdf(str(obs_file))

    # Build the catalog pointing to our temp directories
    catalog_service.build_catalog(str(models_dir), str(obs_dir))
    
    yield
    
    # Cleanup catalog after
    catalog_service._model_datasets.clear()
    catalog_service._obs_datasets.clear()

client = TestClient(app)

def test_integration_flow(setup_integration_env):
    # 1. Verify Dataset Discovery
    res = client.get("/api/v1/datasets")
    assert res.status_code == 200
    datasets = res.json()
    assert len(datasets) == 1
    dataset_id = datasets[0]['id']
    assert dataset_id == "int_model"
    assert "file_path" not in datasets[0]

    # 2. Verify Dataset Metadata Retrieval
    res = client.get(f"/api/v1/datasets/{dataset_id}")
    assert res.status_code == 200
    meta = res.json()
    assert "temp" in meta['variables']
    assert meta['has_u_v'] is True

    # 3. Verify Depths
    res = client.get(f"/api/v1/datasets/{dataset_id}/depths")
    assert res.status_code == 200
    depths = res.json()
    assert len(depths) == 2
    assert depths[0]['depth_m'] == 0.0

    # 4. Verify Data Slice
    res = client.get(f"/api/v1/datasets/{dataset_id}/data?variable=temp&depth_idx=0&time_idx=0")
    assert res.status_code == 200
    slice_data = res.json()
    assert slice_data['variable'] == 'temp'
    assert len(slice_data['lat']) == 3
    assert len(slice_data['lon']) == 3

    # 5. Verify Vector Slice
    res = client.get(f"/api/v1/datasets/{dataset_id}/vectors?depth_idx=0&time_idx=0")
    assert res.status_code == 200
    vec_data = res.json()
    assert 'u' in vec_data
    assert 'v' in vec_data

    # 6. Verify 404
    res = client.get("/api/v1/datasets/invalid_id/data?variable=temp&depth_idx=0&time_idx=0")
    assert res.status_code == 404

    # 7. Verify 422
    res = client.get(f"/api/v1/datasets/{dataset_id}/data?variable=temp&depth_idx=-5&time_idx=0")
    assert res.status_code == 422

    # 8. Verify Observations Discovery
    res = client.get("/api/v1/observations")
    assert res.status_code == 200
    obs = res.json()
    assert len(obs) == 1
    obs_id = obs[0]['id']
    assert obs_id == "int_obs"

    # 9. Verify Instruments
    res = client.get(f"/api/v1/observations/{obs_id}/instruments")
    assert res.status_code == 200
    insts = res.json()
    assert len(insts) == 1
    inst_id = insts[0]['id']
    assert inst_id == "1234567"

    # 10. Verify Profile
    res = client.get(f"/api/v1/observations/{obs_id}/instruments/{inst_id}/profile")
    assert res.status_code == 200
    prof = res.json()
    assert "TEMP" in prof['profiles']
    assert len(prof['depths']) == 10
