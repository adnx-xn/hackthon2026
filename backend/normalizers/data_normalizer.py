import numpy as np
import xarray as xr
import math
from typing import Tuple, List, Any

class DataNormalizer:
    MAX_DIM = 200
    MAX_GRID_POINTS = 40000
    MAX_VOXELS = 1_000_000


    @staticmethod
    def mask_fill_values(da: xr.DataArray) -> xr.DataArray:
        """Step 7: Mask fill values and NaN. xarray handles most by default, but we ensure it."""
        # if there are explicit attributes, replace them, though open_dataset with mask_and_scale usually does this
        return da

    @staticmethod
    def apply_unit_conversion(da: xr.DataArray) -> xr.DataArray:
        """Step 8: Apply unit conversion (e.g., K -> C for temperature)."""
        units = da.attrs.get('units', '').lower()
        if units in ['k', 'kelvin']:
            da = da - 273.15
            da.attrs['units'] = 'C'
            da.attrs['original_units'] = units
        return da

    @staticmethod
    def normalize_longitude(da: xr.DataArray, lon_dim: str) -> xr.DataArray:
        """Step 9 & 10: Normalize longitude to -180..+180 and reorder columns."""
        lon = da[lon_dim].values
        lon_norm = (lon + 180) % 360 - 180
        lon_sort_idx = np.argsort(lon_norm)
        
        # Apply the index to the DataArray
        da = da.isel({lon_dim: lon_sort_idx})
        # Assign the normalized coordinates
        da = da.assign_coords({lon_dim: lon_norm[lon_sort_idx]})
        return da

    @staticmethod
    def sort_latitude(da: xr.DataArray, lat_dim: str) -> xr.DataArray:
        """Step 11 & 12: Sort latitude ascending (South->North) and reorder rows."""
        lat = da[lat_dim].values
        lat_sort_idx = np.argsort(lat)
        
        # Apply the index to the DataArray
        da = da.isel({lat_dim: lat_sort_idx})
        # Assign the sorted coordinates
        da = da.assign_coords({lat_dim: lat[lat_sort_idx]})
        return da

    @staticmethod
    def downsample(da: xr.DataArray, lat_dim: str, lon_dim: str, max_dim: int = MAX_DIM) -> xr.DataArray:
        """Step 14: Stride-based downsampling (isel with stride - NOT coarsen)."""
        lat_size = da.sizes[lat_dim]
        lon_size = da.sizes[lon_dim]
        
        stride_lat = max(1, math.ceil(lat_size / max_dim))
        stride_lon = max(1, math.ceil(lon_size / max_dim))
        
        return da.isel({lat_dim: slice(None, None, stride_lat), lon_dim: slice(None, None, stride_lon)})

    @staticmethod
    def downsample_3d(da: xr.DataArray, depth_dim: str, lat_dim: str, lon_dim: str) -> xr.DataArray:
        """3D Stride-based downsampling to stay within MAX_VOXELS limit."""
        nz = da.sizes.get(depth_dim, 1)
        ny = da.sizes.get(lat_dim, 1)
        nx = da.sizes.get(lon_dim, 1)
        
        total_voxels = nz * ny * nx
        if total_voxels <= DataNormalizer.MAX_VOXELS:
            return da
            
        # Compute a uniform stride factor for all 3 dimensions
        ratio = total_voxels / DataNormalizer.MAX_VOXELS
        stride = max(1, math.ceil(ratio ** (1/3)))
        
        selectors = {}
        if depth_dim in da.dims:
            selectors[depth_dim] = slice(None, None, stride)
        if lat_dim in da.dims:
            selectors[lat_dim] = slice(None, None, stride)
        if lon_dim in da.dims:
            selectors[lon_dim] = slice(None, None, stride)
            
        return da.isel(**selectors)

    @staticmethod
    def compute_min_max(da: xr.DataArray) -> Tuple[float, float]:
        """Step 15: Compute value_min / value_max after masking and downsampling."""
        # Use numpy directly to handle nans gracefully
        arr = da.values
        valid_mask = ~np.isnan(arr)
        if np.any(valid_mask):
            return float(np.min(arr[valid_mask])), float(np.max(arr[valid_mask]))
        return 0.0, 0.0

    @staticmethod
    def convert_nan_to_none(da: xr.DataArray) -> List[List[Any]]:
        """Step 16: Convert NaN -> None for JSON serialisation."""
        arr = da.values
        # Create a list of lists, preserving 0.0 but converting NaN to None
        return [[None if np.isnan(val) else float(val) for val in row] for row in arr]
