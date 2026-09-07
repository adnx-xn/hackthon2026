import os
import xarray as xr
import numpy as np
import pandas as pd
from typing import Dict, List, Optional

from backend.parsers.base_parser import ObservationParser
from backend.models.schemas import ObsDatasetRecord, ProfileData, InstrumentRecord
from backend.validators.data_validator import ValidationError

class MooringParser(ObservationParser):
    def _open_dataset(self, source: str, source_type: str = 'local') -> xr.Dataset:
        if source_type == 'local':
            if not os.path.exists(source):
                raise FileNotFoundError(f"Dataset not found: {source}")
            return xr.open_dataset(source, decode_times=True)
        elif source_type == 'opendap':
            if not source.startswith(('http://', 'https://')):
                raise ValueError("Invalid OPeNDAP URL scheme.")
            try:
                return xr.open_dataset(source, decode_times=True)
            except Exception as e:
                raise ValueError("Failed to access remote OPeNDAP dataset.") from e
        else:
            raise ValueError(f"Unsupported source_type: {source_type}")

    def get_metadata(self, source: str, source_type: str = 'local') -> ObsDatasetRecord:
        with self._open_dataset(source, source_type) as ds:
            dataset_id = os.path.splitext(os.path.basename(source) if source_type == 'local' else source.split('/')[-1])[0]
            
            # Moorings usually have fixed coordinates
            lat_val = float(ds['latitude'].values)
            lon_val = float(ds['longitude'].values)
            lon_val = (lon_val + 180) % 360 - 180

            if 'platform_id' in ds:
                pid = str(ds['platform_id'].values)
            else:
                pid = f"MOORING_{dataset_id}"
                
            time_vals = ds['time'].values
            t_val = time_vals[-1] if len(time_vals) > 0 else None
            ts_str = pd.Timestamp(t_val).strftime('%Y-%m-%dT%H:%M:%SZ') if pd.notna(t_val) else None
            
            depth_val = float(ds['depth'].values[0]) if 'depth' in ds and ds['depth'].size > 0 else None
            
            prof_vars = [v for v in ds.data_vars if 'depth' in ds[v].dims and v != 'platform_id']
            if not prof_vars:
                # might be time only
                prof_vars = [v for v in ds.data_vars if 'time' in ds[v].dims and v != 'platform_id']

            inst_record = InstrumentRecord(
                id=pid,
                instrument_type='mooring',
                dataset_id=dataset_id,
                lat=lat_val,
                lon=lon_val,
                timestamp=ts_str,
                available_profile_vars=prof_vars,
                depth=depth_val
            )

            return ObsDatasetRecord(
                id=dataset_id,
                name=f"Mooring Dataset {dataset_id}",
                source=source,
                source_type=source_type,
                format="netcdf_mooring",
                dataset_type="observation",
                instrument_type="mooring",
                instrument_count=1,
                lat_min=lat_val,
                lat_max=lat_val,
                lon_min=lon_val,
                lon_max=lon_val,
                instruments=[inst_record]
            )

    def get_profile(self, source: str, source_type: str, instrument_id: str) -> ProfileData:
        with self._open_dataset(source, source_type) as ds:
            # We fetch the latest time index for the profile
            profile_ds = ds.isel(time=-1)
            
            lat = float(ds['latitude'].values)
            lon = float(ds['longitude'].values)
            lon = (lon + 180) % 360 - 180
            
            t_val = profile_ds['time'].values
            ts_str = pd.Timestamp(t_val).strftime('%Y-%m-%dT%H:%M:%SZ') if pd.notna(t_val) else None
            
            if 'depth' in ds:
                depths = profile_ds['depth'].values
                depth_list = [float(d) if not np.isnan(d) else None for d in np.atleast_1d(depths)]
                prof_vars = [v for v in profile_ds.data_vars if 'depth' in profile_ds[v].dims and v != 'platform_id']
            else:
                depth_list = [0.0]
                prof_vars = [v for v in profile_ds.data_vars if 'time' in profile_ds[v].dims and v != 'platform_id']
            
            profiles = {}
            units = {}
            for v in prof_vars:
                vals = np.atleast_1d(profile_ds[v].values)
                profiles[v] = [float(x) if not np.isnan(x) else None for x in vals]
                units[v] = profile_ds[v].attrs.get('units', '')
                
            return ProfileData(
                instrument_id=instrument_id,
                instrument_type="mooring",
                lat=lat,
                lon=lon,
                timestamp=ts_str,
                profiles=profiles,
                depths=depth_list,
                depth_from_pressure=False,
                units=units
            )
