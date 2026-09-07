import os
import xarray as xr
import numpy as np
import pandas as pd
from typing import Dict, List, Optional

from backend.parsers.base_parser import ObservationParser
from backend.models.schemas import ObsDatasetRecord, ProfileData, InstrumentRecord
from backend.validators.data_validator import ValidationError

class BGCParser(ObservationParser):
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
            
            lat_vals = ds['latitude'].values
            lon_vals = ds['longitude'].values
            lon_vals = (lon_vals + 180) % 360 - 180

            lat_min = float(np.nanmin(lat_vals))
            lat_max = float(np.nanmax(lat_vals))
            lon_min = float(np.nanmin(lon_vals))
            lon_max = float(np.nanmax(lon_vals))
            
            time_vals = ds['time'].values
            if 'platform_id' in ds:
                platforms = [str(p) for p in ds['platform_id'].values]
            else:
                platforms = [f"BGC_{i}" for i in range(len(time_vals))]
                
            instruments = {}
            for i in range(len(platforms)):
                pid = platforms[i]
                t_val = time_vals[i] if 'time' in ds else None
                if pid not in instruments:
                    ts_str = pd.Timestamp(t_val).strftime('%Y-%m-%dT%H:%M:%SZ') if pd.notna(t_val) else None
                    instruments[pid] = {
                        'id': pid,
                        'instrument_type': 'bgc',
                        'dataset_id': dataset_id,
                        'lat': float(lat_vals[i] if lat_vals.ndim == 1 else lat_vals[i,0]),
                        'lon': float(lon_vals[i] if lon_vals.ndim == 1 else lon_vals[i,0]),
                        'timestamp': ts_str
                    }
                    
            prof_vars = [v for v in ds.data_vars if 'depth' in ds[v].dims and v != 'platform_id']
            
            instrument_records = []
            for info in instruments.values():
                instrument_records.append(InstrumentRecord(
                    id=info['id'],
                    instrument_type=info['instrument_type'],
                    dataset_id=info['dataset_id'],
                    lat=info['lat'],
                    lon=info['lon'],
                    timestamp=info['timestamp'],
                    available_profile_vars=prof_vars
                ))

            return ObsDatasetRecord(
                id=dataset_id,
                name=f"BGC Dataset {dataset_id}",
                source=source,
                source_type=source_type,
                format="netcdf_bgc",
                dataset_type="observation",
                instrument_type="bgc",
                instrument_count=len(instrument_records),
                lat_min=lat_min,
                lat_max=lat_max,
                lon_min=lon_min,
                lon_max=lon_max,
                instruments=instrument_records
            )

    def get_profile(self, source: str, source_type: str, instrument_id: str) -> ProfileData:
        with self._open_dataset(source, source_type) as ds:
            if 'platform_id' in ds:
                platforms = [str(p) for p in ds['platform_id'].values]
            else:
                platforms = [f"BGC_{i}" for i in range(len(ds['time']))]
                
            try:
                idx = platforms.index(instrument_id)
            except ValueError:
                raise ValidationError(f"Instrument {instrument_id} not found in dataset.")
                
            profile_ds = ds.isel(time=idx)
            
            lat = float(profile_ds['latitude'].values)
            lon = float(profile_ds['longitude'].values)
            lon = (lon + 180) % 360 - 180
            
            t_val = profile_ds['time'].values
            ts_str = pd.Timestamp(t_val).strftime('%Y-%m-%dT%H:%M:%SZ') if pd.notna(t_val) else None
            
            depths = profile_ds['depth'].values
            depth_list = [float(d) if not np.isnan(d) else None for d in depths]
            
            prof_vars = [v for v in profile_ds.data_vars if 'depth' in profile_ds[v].dims and v != 'platform_id']
            
            profiles = {}
            units = {}
            for v in prof_vars:
                vals = profile_ds[v].values
                profiles[v] = [float(x) if not np.isnan(x) else None for x in vals]
                units[v] = profile_ds[v].attrs.get('units', '')
                
            return ProfileData(
                instrument_id=instrument_id,
                instrument_type="bgc",
                lat=lat,
                lon=lon,
                timestamp=ts_str,
                profiles=profiles,
                depths=depth_list,
                depth_from_pressure=False,
                units=units
            )
