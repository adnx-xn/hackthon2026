import os
import xarray as xr
import numpy as np
import pandas as pd

def create_ctd_fixture(path):
    time = pd.date_range("2026-08-01", periods=1)
    depth = np.array([0, 10, 50, 100])
    
    ds = xr.Dataset(
        {
            "temperature": (("time", "depth"), np.array([[25.0, 24.5, 20.0, 15.0]])),
            "salinity": (("time", "depth"), np.array([[35.0, 35.1, 35.5, 35.8]])),
        },
        coords={
            "time": time,
            "depth": depth,
            "latitude": ("time", [15.0]),
            "longitude": ("time", [65.0]),
        }
    )
    # add instrument id
    ds["platform_id"] = (("time",), ["CTD_001"])
    ds.to_netcdf(path)

def create_bgc_fixture(path):
    time = pd.date_range("2026-08-01", periods=1)
    depth = np.array([0, 10, 50])
    
    ds = xr.Dataset(
        {
            "temperature": (("time", "depth"), np.array([[26.0, 25.5, 21.0]])),
            "salinity": (("time", "depth"), np.array([[34.0, 34.1, 34.5]])),
            "chlorophyll": (("time", "depth"), np.array([[0.5, 0.8, 0.1]])),
        },
        coords={
            "time": time,
            "depth": depth,
            "latitude": ("time", [10.0]),
            "longitude": ("time", [70.0]),
        }
    )
    ds["platform_id"] = (("time",), ["BGC_001"])
    ds.to_netcdf(path)

def create_mooring_fixture(path):
    # Time series at a fixed location
    time = pd.date_range("2026-08-01", periods=3, freq="D")
    depth = np.array([10.0])
    
    ds = xr.Dataset(
        {
            "temperature": (("time", "depth"), np.array([[28.0], [28.2], [28.1]])),
            "salinity": (("time", "depth"), np.array([[34.5], [34.5], [34.6]])),
        },
        coords={
            "time": time,
            "depth": depth,
            "latitude": 8.0,
            "longitude": 75.0,
        }
    )
    ds["platform_id"] = "MOORING_001"
    ds.to_netcdf(path)

def create_adcp_fixture(path):
    time = pd.date_range("2026-08-01", periods=1)
    depth = np.array([5, 15, 25, 35])
    
    ds = xr.Dataset(
        {
            "u": (("time", "depth"), np.array([[0.5, 0.4, 0.2, 0.0]])),
            "v": (("time", "depth"), np.array([[0.1, 0.2, 0.1, 0.0]])),
        },
        coords={
            "time": time,
            "depth": depth,
            "latitude": ("time", [12.0]),
            "longitude": ("time", [72.0]),
        }
    )
    ds["platform_id"] = (("time",), ["ADCP_001"])
    ds.to_netcdf(path)

def create_hf_radar_fixture(path):
    # Spatial grid at one time
    time = pd.date_range("2026-08-01", periods=1)
    lat = np.array([15.0, 15.1, 15.2])
    lon = np.array([73.0, 73.1, 73.2])
    
    # 3x3 grid
    u = np.array([[[0.1, 0.2, 0.3], [0.1, np.nan, 0.3], [0.1, 0.2, 0.3]]])
    v = np.array([[[0.0, 0.1, 0.0], [0.0, np.nan, 0.0], [0.0, 0.1, 0.0]]])
    
    ds = xr.Dataset(
        {
            "u": (("time", "latitude", "longitude"), u),
            "v": (("time", "latitude", "longitude"), v),
        },
        coords={
            "time": time,
            "latitude": lat,
            "longitude": lon,
        }
    )
    ds.to_netcdf(path)

if __name__ == "__main__":
    fixtures_dir = "backend/tests/fixtures/obs"
    os.makedirs(fixtures_dir, exist_ok=True)
    
    create_ctd_fixture(os.path.join(fixtures_dir, "ctd_test.nc"))
    create_bgc_fixture(os.path.join(fixtures_dir, "bgc_test.nc"))
    create_mooring_fixture(os.path.join(fixtures_dir, "mooring_test.nc"))
    create_adcp_fixture(os.path.join(fixtures_dir, "adcp_test.nc"))
    create_hf_radar_fixture(os.path.join(fixtures_dir, "hf_radar_test.nc"))
    
    print("Fixtures created successfully.")
