import os
import pytest
import numpy as np
import xarray as xr
import pandas as pd
from backend.parsers.netcdf_model_parser import NetCDFModelParser
from backend.validators.data_validator import ValidationError

@pytest.fixture(scope="module")
def sample_nc_file(tmp_path_factory):
    # Create a dummy netcdf dataset
    lat = np.array([10.0, 5.0, 0.0, -5.0]) # descending
    lon = np.array([0.0, 90.0, 180.0, 270.0, 350.0]) # 0-360
    depth = np.array([10.0, 50.0])
    time = pd.date_range("2020-01-01", periods=1).values
    
    # temp has NaNs and zeros
    temp_data = np.zeros((1, 2, 4, 5))
    temp_data[0, 0, :, :] = np.array([
        [1.0, 2.0, np.nan, 4.0, 5.0],
        [6.0, 0.0, 8.0, 9.0, 10.0], # includes 0.0
        [11.0, 12.0, 13.0, 14.0, 15.0],
        [16.0, 17.0, 18.0, 19.0, 20.0]
    ])
    
    u_data = np.ones((1, 2, 4, 5))
    v_data = np.ones((1, 2, 4, 5))

    ds = xr.Dataset(
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
        attrs=dict(description="Mock dataset"),
    )
    # pressure units to test depth_from_pressure
    ds['depth'].attrs['units'] = 'dbar'
    
    # Save to temp file
    fn = tmp_path_factory.mktemp("data") / "test_model.nc"
    ds.to_netcdf(str(fn))
    return str(fn)

@pytest.fixture(scope="module")
def large_nc_file(tmp_path_factory):
    lat = np.linspace(-90, 90, 300)
    lon = np.linspace(-180, 180, 300)
    temp_data = np.ones((300, 300))
    ds = xr.Dataset(
        data_vars=dict(temp=(["lat", "lon"], temp_data)),
        coords=dict(lon=(["lon"], lon), lat=(["lat"], lat))
    )
    fn = tmp_path_factory.mktemp("data") / "large_model.nc"
    ds.to_netcdf(str(fn))
    return str(fn)
    
@pytest.fixture(scope="module")
def curvilinear_nc_file(tmp_path_factory):
    lat = np.ones((10, 10))
    lon = np.ones((10, 10))
    temp_data = np.ones((10, 10))
    ds = xr.Dataset(
        data_vars=dict(temp=(["y", "x"], temp_data)),
        coords=dict(
            lon=(["y", "x"], lon), 
            lat=(["y", "x"], lat)
        )
    )
    fn = tmp_path_factory.mktemp("data") / "curv_model.nc"
    ds.to_netcdf(str(fn))
    return str(fn)


def test_basic_model_parsing_metadata(sample_nc_file):
    parser = NetCDFModelParser()
    record = parser.get_metadata(sample_nc_file)
    
    assert record.dataset_type == "model"
    assert record.has_u_v is True
    assert record.u_var_name == "u"
    assert record.v_var_name == "v"
    assert record.depth_from_pressure is True
    assert len(record.depth_levels) == 2
    # depth 10 dbar * 0.9804 = 9.804
    assert np.isclose(record.depth_levels[0], 9.804)


def test_latitude_reversal_and_longitude_normalization(sample_nc_file):
    parser = NetCDFModelParser()
    slice_data = parser.get_slice(sample_nc_file, "local", "temp", depth_idx=0, time_idx=0)
    
    # Longitude was [0, 90, 180, 270, 350]
    # Normalized: [0, 90, -180, -90, -10]
    # Sorted: [-180, -90, -10, 0, 90]
    assert np.allclose(slice_data.lon, [-180, -90, -10, 0, 90])
    
    # Latitude was [10, 5, 0, -5] (descending)
    # Sorted: [-5, 0, 5, 10]
    assert np.allclose(slice_data.lat, [-5, 0, 5, 10])
    
    # Values should be reordered correspondingly
    # Lat at -5 (last row of original)
    # original last row: [16, 17, 18, 19, 20]
    # reordered lon idx: 2 (180), 3 (270), 4 (350), 0 (0), 1 (90)
    # expected row: [18.0, 19.0, 20.0, 16.0, 17.0]
    import typing
    assert np.allclose(typing.cast(list[float], slice_data.values[0]), [18.0, 19.0, 20.0, 16.0, 17.0])


def test_fill_missing_values_and_zeros(sample_nc_file):
    parser = NetCDFModelParser()
    slice_data = parser.get_slice(sample_nc_file, "local", "temp", depth_idx=0, time_idx=0)
    
    # The original row 0 (lat=10) is now row 3 (lat=10)
    # original row 0: [1.0, 2.0, NaN, 4.0, 5.0]
    # reordered lon idx: 2, 3, 4, 0, 1
    # expected row: [None, 4.0, 5.0, 1.0, 2.0]
    row_3 = slice_data.values[3]
    assert row_3[0] is None # NaN preserved as None
    assert row_3[1] == 4.0
    assert row_3[2] == 5.0
    assert row_3[3] == 1.0
    assert row_3[4] == 2.0

    # The original row 1 (lat=5) is now row 2 (lat=5)
    # original row 1: [6.0, 0.0, 8.0, 9.0, 10.0]
    # reordered lon: 2, 3, 4, 0, 1
    # expected row: [8.0, 9.0, 10.0, 6.0, 0.0]
    row_2 = slice_data.values[2]
    assert row_2[4] == 0.0 # Valid zero is preserved


def test_grid_point_limit(large_nc_file):
    parser = NetCDFModelParser()
    slice_data = parser.get_slice(large_nc_file, "local", "temp", depth_idx=0, time_idx=0)
    
    # Original is 300x300 = 90,000 points.
    # MAX_DIM = 200, so stride should be ceil(300/200) = 2.
    # New size should be 150x150 = 22,500 points
    assert len(slice_data.lat) == 150
    assert len(slice_data.lon) == 150
    assert len(slice_data.lat) * len(slice_data.lon) <= 40000


def test_validation_failures(curvilinear_nc_file):
    parser = NetCDFModelParser()
    with pytest.raises(ValidationError):
        parser.get_metadata(curvilinear_nc_file)

def test_missing_dataset():
    parser = NetCDFModelParser()
    with pytest.raises(FileNotFoundError):
        parser.get_metadata("does_not_exist.nc")

def test_volume_extraction(sample_nc_file):
    parser = NetCDFModelParser()
    volume_slice = parser.get_volume(sample_nc_file, "local", "temp", time_idx=0)
    
    metadata = volume_slice.metadata
    
    # Check basic metadata
    assert metadata.variable == "temp"
    assert metadata.dimension_order == ["depth", "lat", "lon"]
    assert metadata.dimensions["nz"] == 2
    assert metadata.dimensions["ny"] == 4
    assert metadata.dimensions["nx"] == 5
    
    # Longitude was [0, 90, 180, 270, 350]
    # Normalized: [-180, -90, -10, 0, 90]
    assert np.allclose(metadata.longitudes, [-180, -90, -10, 0, 90])
    
    # Latitude was [10, 5, 0, -5] (descending)
    # Sorted: [-5, 0, 5, 10]
    assert np.allclose(metadata.latitudes, [-5, 0, 5, 10])
    
    # Depths (from pressure 10, 50 dbar * 0.9804)
    assert np.isclose(metadata.depths[0], 9.804)
    assert np.isclose(metadata.depths[1], 49.02)
    
    # Check binary data length
    # nz=2 * ny=4 * nx=5 = 40 floats * 4 bytes = 160 bytes
    assert len(volume_slice.binary_data) == 160
    
    # Check actual values by decoding binary data
    # The array should be Float32
    decoded_array = np.frombuffer(volume_slice.binary_data, dtype=np.float32).reshape((2, 4, 5))
    
    # original row 0 at depth 10: [1.0, 2.0, NaN, 4.0, 5.0]
    # at lat 10, it is now row 3 (idx 3) due to ascending sort
    # reordered lon idx: 2, 3, 4, 0, 1 -> [NaN, 4.0, 5.0, 1.0, 2.0]
    row_depth0_lat10 = decoded_array[0, 3, :]
    assert np.isnan(row_depth0_lat10[0])
    assert row_depth0_lat10[1] == 4.0
    assert row_depth0_lat10[2] == 5.0
    assert row_depth0_lat10[3] == 1.0
    assert row_depth0_lat10[4] == 2.0

