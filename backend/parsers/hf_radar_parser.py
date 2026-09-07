import os
import xarray as xr
import numpy as np
import pandas as pd
from typing import Dict, List, Optional

from backend.parsers.base_parser import ObservationParser
from backend.models.schemas import ObsDatasetRecord, ProfileData, InstrumentRecord
from backend.validators.data_validator import ValidationError

class HFRadarParser(ObservationParser):
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
            
            # HF-Radar is a spatial grid
            lat_vals = ds['latitude'].values
            lon_vals = ds['longitude'].values
            
            lat_min = float(np.nanmin(lat_vals))
            lat_max = float(np.nanmax(lat_vals))
            lon_min = float(np.nanmin((lon_vals + 180) % 360 - 180))
            lon_max = float(np.nanmax((lon_vals + 180) % 360 - 180))
            
            time_vals = ds['time'].values
            t_val = time_vals[-1] if len(time_vals) > 0 else None
            ts_str = pd.Timestamp(t_val).strftime('%Y-%m-%dT%H:%M:%SZ') if pd.notna(t_val) else None
            
            # Extract latest time slice
            u_vals = ds['u'].isel(time=-1).values
            v_vals = ds['v'].isel(time=-1).values
            
            instrument_records = []
            
            # Iterate through grid
            for i, lat in enumerate(lat_vals):
                for j, lon in enumerate(lon_vals):
                    u = u_vals[i, j]
                    v = v_vals[i, j]
                    if not (np.isnan(u) or np.isnan(v)):
                        norm_lon = (lon + 180) % 360 - 180
                        inst_id = f"HFR_{i}_{j}"
                        instrument_records.append(InstrumentRecord(
                            id=inst_id,
                            instrument_type='hf_radar',
                            dataset_id=dataset_id,
                            lat=float(lat),
                            lon=float(norm_lon),
                            timestamp=ts_str,
                            available_profile_vars=[],  # No profiles
                            u=float(u),
                            v=float(v),
                            depth=0.0
                        ))
            
            return ObsDatasetRecord(
                id=dataset_id,
                name=f"HF-Radar Dataset {dataset_id}",
                source=source,
                source_type=source_type,
                format="netcdf_hf_radar",
                dataset_type="observation",
                instrument_type="hf_radar",
                instrument_count=len(instrument_records),
                lat_min=lat_min,
                lat_max=lat_max,
                lon_min=lon_min,
                lon_max=lon_max,
                instruments=instrument_records
            )

    def get_profile(self, source: str, source_type: str, instrument_id: str) -> ProfileData:
        # HF-Radar doesn't have a depth profile.
        # But we must satisfy the API contract in case it's called.
        # We can extract the u, v and return it as a single point profile.
        with self._open_dataset(source, source_type) as ds:
            # Parse instrument_id which is HFR_{i}_{j}
            parts = instrument_id.split('_')
            if len(parts) != 3:
                raise ValidationError(f"Invalid HF-Radar instrument ID: {instrument_id}")
            i, j = int(parts[1]), int(parts[2])
            
            lat = float(ds['latitude'].values[i])
            lon = float(ds['longitude'].values[j])
            lon = (lon + 180) % 360 - 180
            
            time_vals = ds['time'].values
            t_val = time_vals[-1] if len(time_vals) > 0 else None
            ts_str = pd.Timestamp(t_val).strftime('%Y-%m-%dT%H:%M:%SZ') if pd.notna(t_val) else None
            
            u = float(ds['u'].isel(time=-1).values[i, j])
            v = float(ds['v'].isel(time=-1).values[i, j])
            
            if np.isnan(u) or np.isnan(v):
                raise ValidationError(f"No valid data at {instrument_id}")
            
            return ProfileData(
                instrument_id=instrument_id,
                instrument_type="hf_radar",
                lat=lat,
                lon=lon,
                timestamp=ts_str,
                profiles={'u': [u], 'v': [v]},
                depths=[0.0],
                depth_from_pressure=False,
                units={'u': 'm/s', 'v': 'm/s'}
            )
