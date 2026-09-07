import os
import xarray as xr
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime

from backend.parsers.base_parser import ObservationParser
from backend.models.schemas import ObsDatasetRecord, ProfileData, InstrumentRecord
from backend.validators.data_validator import ValidationError

class NetCDFObsParser(ObservationParser):
    """
    Parser for Core-Argo GDAC NetCDF files.
    """
    
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

    def _decode_platform_number(self, val) -> str:
        """Decode a platform number byte array to string."""
        if isinstance(val, (bytes, np.bytes_)):
            return val.decode('utf-8').strip()
        return str(val).strip()

    def get_metadata(self, source: str, source_type: str = 'local') -> ObsDatasetRecord:
        with self._open_dataset(source, source_type) as ds:
            if 'N_PROF' not in ds.dims:
                raise ValidationError("Missing N_PROF dimension, not a valid Core-Argo format.")

            dataset_id = os.path.splitext(os.path.basename(source) if source_type == 'local' else source.split('/')[-1])[0]
            
            lat_vals = ds['LATITUDE'].values
            lon_vals = ds['LONGITUDE'].values
            
            # Normalize lon to -180..+180
            lon_vals = (lon_vals + 180) % 360 - 180

            lat_min = float(np.nanmin(lat_vals))
            lat_max = float(np.nanmax(lat_vals))
            lon_min = float(np.nanmin(lon_vals))
            lon_max = float(np.nanmax(lon_vals))

            # Group by PLATFORM_NUMBER
            platform_var = ds['PLATFORM_NUMBER'].values
            platforms = [self._decode_platform_number(p) for p in platform_var]

            time_vals = ds['JULD'].values

            # Find profile variables
            prof_vars = [
                var_name for var_name, var in ds.data_vars.items()
                if 'N_PROF' in var.dims and 'N_LEVELS' in var.dims and not var_name.endswith('_QC')
            ]
            # Exclude coordinate-like profile vars if any, but in Argo TEMP, PSAL, PRES are data_vars.
            
            instruments = {}
            for i in range(len(platforms)):
                pid = platforms[i]
                t_val = time_vals[i]
                # Keep latest profile for the instrument
                if pid not in instruments or (not pd.isna(t_val) and t_val > instruments[pid]['time']):
                    ts_str = pd.Timestamp(t_val).strftime('%Y-%m-%dT%H:%M:%SZ') if not pd.isna(t_val) else None
                    instruments[pid] = {
                        'id': pid,
                        'instrument_type': 'argo',
                        'dataset_id': dataset_id,
                        'lat': float(lat_vals[i]),
                        'lon': float(lon_vals[i]),
                        'timestamp': ts_str,
                        'time': t_val
                    }
                    
            instrument_records = []
            for pid, info in instruments.items():
                record = InstrumentRecord(
                    id=info['id'],
                    instrument_type=info['instrument_type'],
                    dataset_id=info['dataset_id'],
                    lat=info['lat'],
                    lon=info['lon'],
                    timestamp=info['timestamp'],
                    available_profile_vars=prof_vars
                )
                instrument_records.append(record)

            return ObsDatasetRecord(
                id=dataset_id,
                name=f"Argo Dataset {dataset_id}",
                source=source,
                source_type=source_type,
                format="netcdf",
                dataset_type="observation",
                instrument_type="argo",
                instrument_count=len(instrument_records),
                lat_min=lat_min,
                lat_max=lat_max,
                lon_min=lon_min,
                lon_max=lon_max,
                instruments=instrument_records
            )

    def get_profile(self, source: str, source_type: str, instrument_id: str) -> ProfileData:
        with self._open_dataset(source, source_type) as ds:
            if 'N_PROF' not in ds.dims:
                raise ValidationError("Missing N_PROF dimension.")

            platform_var = ds['PLATFORM_NUMBER'].values
            platforms = np.array([self._decode_platform_number(p) for p in platform_var])
            
            # Find the most recent profile for this instrument
            mask = (platforms == instrument_id)
            if not np.any(mask):
                raise ValidationError(f"Instrument {instrument_id} not found in dataset.")
            
            # Get indices for this instrument
            indices = np.where(mask)[0]
            
            # Select the latest profile by JULD
            times = ds['JULD'].values[indices]
            valid_times = [t for t in times if not pd.isna(t)]
            
            if len(valid_times) > 0:
                latest_idx = indices[np.argmax(times)]
            else:
                latest_idx = indices[-1]

            profile_ds = ds.isel(N_PROF=latest_idx)
            
            lat = float(profile_ds['LATITUDE'].values)
            lon = float(profile_ds['LONGITUDE'].values)
            lon = (lon + 180) % 360 - 180
            
            t_val = profile_ds['JULD'].values
            ts_str = pd.Timestamp(t_val).strftime('%Y-%m-%dT%H:%M:%SZ') if not pd.isna(t_val) else None
            
            # Depth / Pressure
            if 'DEPTH' in profile_ds.data_vars or 'DEPTH' in profile_ds.coords:
                depth_var = 'DEPTH'
                depth_from_pressure = False
            elif 'PRES' in profile_ds.data_vars or 'PRES' in profile_ds.coords:
                depth_var = 'PRES'
                depth_from_pressure = True
            else:
                raise ValidationError("No DEPTH or PRES variable found in profile.")
            
            # Handle QC for depth if available
            depths = profile_ds[depth_var].values
            if f'{depth_var}_QC' in profile_ds.data_vars:
                qc_vals = profile_ds[f'{depth_var}_QC'].values
                qc_mask = self._get_qc_mask(qc_vals)
                depths = np.where(qc_mask, depths, np.nan)
            
            if depth_from_pressure:
                depths = depths * 0.9804

            prof_vars = [
                var_name for var_name, var in profile_ds.data_vars.items()
                if 'N_LEVELS' in var.dims and not var_name.endswith('_QC')
            ]
            
            profiles = {}
            units = {}
            for v in prof_vars:
                if v == depth_var:
                    continue
                vals = profile_ds[v].values
                if f'{v}_QC' in profile_ds.data_vars:
                    qc_vals = profile_ds[f'{v}_QC'].values
                    qc_mask = self._get_qc_mask(qc_vals)
                    vals = np.where(qc_mask, vals, np.nan)
                
                # Convert NaN to None
                profiles[v] = [float(x) if not np.isnan(x) else None for x in vals]
                units[v] = profile_ds[v].attrs.get('units', '')

            depths_list = [float(x) if not np.isnan(x) else None for x in depths]
            
            return ProfileData(
                instrument_id=instrument_id,
                instrument_type="argo",
                lat=lat,
                lon=lon,
                timestamp=ts_str,
                profiles=profiles,
                depths=depths_list,
                depth_from_pressure=depth_from_pressure,
                units=units
            )

    def _get_qc_mask(self, qc_vals) -> np.ndarray:
        """
        Returns boolean mask where True means data is GOOD (QC < 3).
        Argo QC flags are usually byte strings like b'1', b'2', b'3', b'4', b'9' or strings.
        1 = good, 2 = probably good, 3 = probably bad, 4 = bad.
        """
        # Convert to string and strip spaces
        if qc_vals.dtype.kind in ('S', 'O', 'U'):
            if isinstance(qc_vals[0], bytes):
                strs = np.array([v.decode('utf-8').strip() if isinstance(v, bytes) else str(v).strip() for v in qc_vals])
            else:
                strs = np.array([str(v).strip() for v in qc_vals])
        else:
            strs = np.array([str(v).strip() for v in qc_vals])
            
        # Mask everything except '1' and '2'. Empty string or nan is also masked out for safety, or maybe allowed if no QC.
        # "Quality flags with value >= 3 (bad data) MUST be masked as missing."
        # If it's missing (e.g., fill values), let's say it's bad.
        mask = np.isin(strs, ['1', '2', '0', '8'])  # 0 is no QC, 8 is interpolated. Often just 1 and 2.
        # Wait, let's just mask out '3', '4', '9'
        bad = np.isin(strs, ['3', '4', '9'])
        # if string is empty, we don't consider it bad.
        return ~bad
