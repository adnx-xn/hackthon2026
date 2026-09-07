import pytest
import xarray as xr
import numpy as np
import pandas as pd
import os

from backend.parsers.netcdf_obs_parser import NetCDFObsParser
from backend.validators.data_validator import ValidationError

@pytest.fixture
def core_argo_dataset(tmp_path):
    n_prof = 2
    n_levels = 3
    
    platforms = np.array([b'FLOAT_01', b'FLOAT_02'])
    lats = np.array([10.0, -10.0])
    lons = np.array([60.0, 190.0]) # 190 should normalize to -170
    times = np.array(['2026-08-30T00:00:00', '2026-08-31T00:00:00'], dtype='datetime64[ns]')
    
    pres = np.array([
        [10.0, 50.0, 100.0],
        [20.0, 60.0, np.nan]
    ])
    pres_qc = np.array([
        [b'1', b'1', b'4'], # 4 is bad
        [b'1', b'1', b'9']  # 9 is missing
    ])
    
    temp = np.array([
        [25.0, 20.0, 15.0],
        [28.0, 22.0, np.nan]
    ])
    temp_qc = np.array([
        [b'1', b'3', b'1'], # 3 is bad
        [b'1', b'1', b'9']
    ])
    
    ds = xr.Dataset(
        data_vars={
            'PLATFORM_NUMBER': (['N_PROF'], platforms),
            'LATITUDE': (['N_PROF'], lats),
            'LONGITUDE': (['N_PROF'], lons),
            'JULD': (['N_PROF'], times),
            'PRES': (['N_PROF', 'N_LEVELS'], pres),
            'PRES_QC': (['N_PROF', 'N_LEVELS'], pres_qc),
            'TEMP': (['N_PROF', 'N_LEVELS'], temp),
            'TEMP_QC': (['N_PROF', 'N_LEVELS'], temp_qc)
        },
        coords={
            'N_PROF': np.arange(n_prof),
            'N_LEVELS': np.arange(n_levels)
        }
    )
    
    file_path = tmp_path / "synthetic_argo.nc"
    ds.to_netcdf(file_path)
    return str(file_path)

def test_get_metadata(core_argo_dataset):
    parser = NetCDFObsParser()
    metadata = parser.get_metadata(core_argo_dataset)
    
    assert metadata.dataset_type == "observation"
    assert metadata.instrument_type == "argo"
    assert metadata.instrument_count == 2
    assert metadata.lat_min == -10.0
    assert metadata.lon_max == 60.0
    
    # Check that instruments are found
    assert len(metadata.instruments) == 2
    ids = [i.id for i in metadata.instruments]
    assert 'FLOAT_01' in ids
    
    # Check normalized lon
    lon_vals = [i.lon for i in metadata.instruments]
    assert -170.0 in lon_vals

def test_get_profile(core_argo_dataset):
    parser = NetCDFObsParser()
    profile = parser.get_profile(core_argo_dataset, 'local', 'FLOAT_01')
    
    assert profile.instrument_id == 'FLOAT_01'
    assert profile.depth_from_pressure is True
    
    # Check QC masking
    assert profile.depths[0] == 10.0 * 0.9804
    assert profile.depths[1] == 50.0 * 0.9804
    assert profile.depths[2] is None
    
    assert profile.profiles['TEMP'][0] == 25.0
    assert profile.profiles['TEMP'][1] is None
    assert profile.profiles['TEMP'][2] == 15.0

def test_invalid_instrument(core_argo_dataset):
    parser = NetCDFObsParser()
    with pytest.raises(ValidationError):
        parser.get_profile(core_argo_dataset, 'local', 'FLOAT_99')

def test_missing_n_prof(tmp_path):
    ds = xr.Dataset(data_vars={'A': (['x'], [1])})
    file_path = tmp_path / "bad.nc"
    ds.to_netcdf(file_path)
    parser = NetCDFObsParser()
    with pytest.raises(ValidationError, match="Missing N_PROF dimension"):
        parser.get_metadata(str(file_path))
