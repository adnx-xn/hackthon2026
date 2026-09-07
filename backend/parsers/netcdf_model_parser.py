import os
import xarray as xr
import numpy as np
import pandas as pd
from typing import Optional

from backend.parsers.base_parser import ModelParser
from backend.models.schemas import DatasetRecord, DataSlice, VectorSlice, VolumeSlice, VolumeMetadata
from backend.validators.data_validator import DataValidator, ValidationError
from backend.normalizers.data_normalizer import DataNormalizer


class NetCDFModelParser(ModelParser):
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

    def get_metadata(self, source: str, source_type: str = 'local') -> DatasetRecord:
        with self._open_dataset(source, source_type) as ds:
            dims = DataValidator.detect_dimensions(ds)
            DataValidator.validate_required_dimensions(dims)
            
            lat_dim = dims['lat']
            lon_dim = dims['lon']
            DataValidator.verify_1d_coordinates(ds, lat_dim, lon_dim)
            
            lon_vals = (ds[lon_dim].values + 180) % 360 - 180
            lat_vals = ds[lat_dim].values
            
            lat_min = float(np.min(lat_vals))
            lat_max = float(np.max(lat_vals))
            lon_min = float(np.min(lon_vals))
            lon_max = float(np.max(lon_vals))

            time_steps = []
            if 'time' in dims:
                time_vals = np.atleast_1d(ds[dims['time']].values)
                try:
                   time_steps = [
    pd.Timestamp(t).strftime('%Y-%m-%dT%H:%M:%SZ')
    for t in time_vals
]
                except Exception:
                    time_steps = [str(t)[:19] + "Z" for t in time_vals]

            depth_levels = []
            depth_from_pressure = False 
            if 'depth' in dims:
                depth_dim = dims['depth']
                depth_vals = ds[depth_dim].values
                if 'pressure' in depth_dim.lower() or ds[depth_dim].attrs.get('units', '').lower() in ['dbar', 'decibar']:
                    depth_vals = depth_vals * 0.9804
                    depth_from_pressure = True
                depth_levels = [float(d) for d in depth_vals]

            variables = []
            u_var = None
            v_var = None
            
            for var_name in ds.data_vars:
                if len(ds[var_name].dims) >= 2:
                    variables.append(var_name)
                    vn_lower = var_name.lower()
                    if vn_lower in ['u', 'uo', 'u_vel', 'uvel', 'water_u']:
                        u_var = var_name
                    elif vn_lower in ['v', 'vo', 'v_vel', 'vvel', 'water_v']:
                        v_var = var_name
                        
            has_u_v = (u_var is not None and v_var is not None)

            ds_name = os.path.basename(source) if source_type == 'local' else source.split('/')[-1]
            ds_id = ds_name.replace('.nc', '')
            
            return DatasetRecord(
                id=ds_id,
                name=ds_name,
                source=source,
                source_type=source_type,
                format="netcdf",
                dataset_type="model",
                variables=variables,
                has_u_v=has_u_v,
                u_var_name=u_var,
                v_var_name=v_var,
                depth_levels=depth_levels,
                depth_from_pressure=depth_from_pressure,
                time_steps=time_steps,
                lat_min=lat_min,
                lat_max=lat_max,
                lon_min=lon_min,
                lon_max=lon_max,
                metadata_attrs={k: str(v) for k, v in ds.attrs.items()}
            )
            
    def _process_slice(self, da: xr.DataArray, dims: dict, ds: xr.Dataset, depth_idx: int, time_idx: int):
        selectors = {}
        if 'time' in dims:
            selectors[dims['time']] = time_idx
        if 'depth' in dims:
            selectors[dims['depth']] = depth_idx
            
        da = da.isel(**selectors).squeeze()
        
        da = DataNormalizer.mask_fill_values(da)
        da = DataNormalizer.apply_unit_conversion(da)
        
        lat_dim = dims['lat']
        lon_dim = dims['lon']
        
        da = DataNormalizer.normalize_longitude(da, lon_dim)
        da = DataNormalizer.sort_latitude(da, lat_dim)
        da = DataNormalizer.downsample(da, lat_dim, lon_dim)
        
        return da

    def get_slice(self, source: str, source_type: str, variable: str, depth_idx: int, time_idx: int) -> DataSlice:
        with self._open_dataset(source, source_type) as ds:
            if variable not in ds.variables:
                raise ValueError(f"Variable {variable} not found in dataset.")
                
            dims = DataValidator.detect_dimensions(ds)
            DataValidator.validate_required_dimensions(dims)
            DataValidator.verify_1d_coordinates(ds, dims['lat'], dims['lon'])
            
            da = ds[variable]
            da = self._process_slice(da, dims, ds, depth_idx, time_idx)
            
            timestamp = ""
            if 'time' in dims:
                t_val = ds[dims['time']].isel({dims['time']: time_idx}).values
                try:
                    timestamp = pd.to_datetime([t_val]).strftime('%Y-%m-%dT%H:%M:%SZ')[0]
                except Exception:
                    timestamp = str(t_val)[:19] + "Z"
                
            depth_m = 0.0
            depth_from_pressure = False
            if 'depth' in dims:
                d_val = float(ds[dims['depth']].isel({dims['depth']: depth_idx}).values)
                d_dim = dims['depth']
                if 'pressure' in d_dim.lower() or ds[d_dim].attrs.get('units', '').lower() in ['dbar', 'decibar']:
                    d_val = d_val * 0.9804
                    depth_from_pressure = True
                depth_m = d_val
                
            value_min, value_max = DataNormalizer.compute_min_max(da)
            values = DataNormalizer.convert_nan_to_none(da)
            
            dataset_id = os.path.basename(source).replace('.nc', '') if source_type == 'local' else source.split('/')[-1].replace('.nc', '')
            return DataSlice(
                dataset_id=dataset_id,
                variable=variable,
                depth_m=depth_m,
                depth_from_pressure=depth_from_pressure,
                timestamp=timestamp,
                lat=[float(v) for v in da[dims['lat']].values],
                lon=[float(v) for v in da[dims['lon']].values],
                values=values,
                units=da.attrs.get('units'),
                value_min=value_min,
                value_max=value_max
            )

    def get_vector_slice(self, source: str, source_type: str, depth_idx: int, time_idx: int) -> VectorSlice:
        with self._open_dataset(source, source_type) as ds:
            record = self.get_metadata(source, source_type)
            if not record.has_u_v:
                raise ValueError("Dataset does not contain valid U and V components.")
                
            u_var = record.u_var_name
            v_var = record.v_var_name
            
            dims = DataValidator.detect_dimensions(ds)
            
            da_u = ds[u_var]
            da_u = self._process_slice(da_u, dims, ds, depth_idx, time_idx)
            
            da_v = ds[v_var]
            da_v = self._process_slice(da_v, dims, ds, depth_idx, time_idx)
            
            timestamp = ""
            if 'time' in dims:
                t_val = ds[dims['time']].isel({dims['time']: time_idx}).values
                try:
                    timestamp = pd.to_datetime([t_val]).strftime('%Y-%m-%dT%H:%M:%SZ')[0]
                except Exception:
                    timestamp = str(t_val)[:19] + "Z"
                
            depth_m = 0.0
            depth_from_pressure = False
            if 'depth' in dims:
                d_val = float(ds[dims['depth']].isel({dims['depth']: depth_idx}).values)
                d_dim = dims['depth']
                if 'pressure' in d_dim.lower() or ds[d_dim].attrs.get('units', '').lower() in ['dbar', 'decibar']:
                    d_val = d_val * 0.9804
                    depth_from_pressure = True
                depth_m = d_val
                
            u_vals = da_u.values
            v_vals = da_v.values
            speed = np.sqrt(u_vals**2 + v_vals**2)
            valid_mask = ~np.isnan(speed)
            speed_max = float(np.max(speed[valid_mask])) if np.any(valid_mask) else 0.0
            
            u_list = DataNormalizer.convert_nan_to_none(da_u)
            v_list = DataNormalizer.convert_nan_to_none(da_v)
            
            return VectorSlice(
                dataset_id=record.id,
                depth_m=depth_m,
                depth_from_pressure=depth_from_pressure,
                timestamp=timestamp,
                lat=[float(v) for v in da_u[dims['lat']].values],
                lon=[float(v) for v in da_u[dims['lon']].values],
                u=u_list,
                v=v_list,
                speed_max=speed_max
            )

    def get_volume(self, source: str, source_type: str, variable: str, time_idx: int) -> VolumeSlice:
        with self._open_dataset(source, source_type) as ds:
            if variable not in ds.variables:
                raise ValueError(f"Variable {variable} not found in dataset.")
                
            dims = DataValidator.detect_dimensions(ds)
            DataValidator.validate_required_dimensions(dims)
            DataValidator.verify_1d_coordinates(ds, dims['lat'], dims['lon'])
            
            da = ds[variable]
            
            # Select time if present
            if 'time' in dims:
                da = da.isel({dims['time']: time_idx}).squeeze()
                
            da = DataNormalizer.mask_fill_values(da)
            da = DataNormalizer.apply_unit_conversion(da)
            
            lat_dim = dims['lat']
            lon_dim = dims['lon']
            depth_dim = dims.get('depth')
            
            da = DataNormalizer.normalize_longitude(da, lon_dim)
            da = DataNormalizer.sort_latitude(da, lat_dim)
            
            if depth_dim:
                da = DataNormalizer.downsample_3d(da, depth_dim, lat_dim, lon_dim)
                # Reorder dimensions to depth -> lat -> lon
                da = da.transpose(depth_dim, lat_dim, lon_dim)
            else:
                # If no depth, we treat it as a 1-depth volume for consistency
                da = da.expand_dims('depth')
                depth_dim = 'depth'
                da = DataNormalizer.downsample_3d(da, depth_dim, lat_dim, lon_dim)
                da = da.transpose(depth_dim, lat_dim, lon_dim)
            
            value_min, value_max = DataNormalizer.compute_min_max(da)
            
            # Extract coordinates
            latitudes = [float(v) for v in da[lat_dim].values]
            longitudes = [float(v) for v in da[lon_dim].values]
            
            depths = []
            if 'depth' in dims:
                d_vals = da[depth_dim].values
                # pressure conversion
                d_dim = dims['depth']
                if 'pressure' in d_dim.lower() or ds[d_dim].attrs.get('units', '').lower() in ['dbar', 'decibar']:
                    d_vals = d_vals * 0.9804
                depths = [float(d) for d in d_vals]
            else:
                depths = [0.0]
                
            nz, ny, nx = da.shape
            
            # Ensure float32 and preserve NaNs
            np_data = np.asarray(da.values, dtype=np.float32)
            binary_data = np_data.tobytes()
            
            dataset_id = os.path.basename(source).replace('.nc', '') if source_type == 'local' else source.split('/')[-1].replace('.nc', '')
            metadata = VolumeMetadata(
                dataset_id=dataset_id,
                variable=variable,
                time_idx=time_idx,
                dimensions={"nz": nz, "ny": ny, "nx": nx},
                dimension_order=["depth", "lat", "lon"],
                depths=depths,
                latitudes=latitudes,
                longitudes=longitudes,
                dtype="float32",
                missing_value="NaN",
                units=da.attrs.get('units'),
                value_min=value_min,
                value_max=value_max
            )
            
            return VolumeSlice(
                metadata=metadata,
                binary_data=binary_data
            )

    def get_wms_map(self, source: str, source_type: str, variable: str, 
                    bbox: dict, width: int, height: int, 
                    time_idx: int, depth_idx: int, cmap_name: str, is_log: bool) -> bytes:
        import matplotlib.colors as mcolors
        import matplotlib.cm as cm
        from PIL import Image
        from io import BytesIO

        with self._open_dataset(source, source_type) as ds:
            if variable not in ds.variables:
                raise ValueError(f"Variable {variable} not found in dataset.")
                
            dims = DataValidator.detect_dimensions(ds)
            da = ds[variable]
            
            selectors = {}
            if 'time' in dims:
                selectors[dims['time']] = time_idx
            if 'depth' in dims:
                selectors[dims['depth']] = depth_idx
            da = da.isel(**selectors).squeeze()
            
            da = DataNormalizer.mask_fill_values(da)
            da = DataNormalizer.apply_unit_conversion(da)
            
            lat_dim = dims['lat']
            lon_dim = dims['lon']
            
            da = DataNormalizer.normalize_longitude(da, lon_dim)
            da = DataNormalizer.sort_latitude(da, lat_dim)
            
            min_lat = bbox.get("min_lat", -90)
            max_lat = bbox.get("max_lat", 90)
            min_lon = bbox.get("min_lon", -180)
            max_lon = bbox.get("max_lon", 180)
            
            da = da.sel({lat_dim: slice(min_lat, max_lat), lon_dim: slice(min_lon, max_lon)})
            
            if da.sizes[lat_dim] == 0 or da.sizes[lon_dim] == 0:
                raise ValueError("BBOX does not intersect data domain.")
            
            val_min = float(np.nanmin(da.values))
            val_max = float(np.nanmax(da.values))
            if val_min == val_max:
                val_max += 0.1
                
            norm = mcolors.LogNorm(vmin=max(val_min, 1e-10), vmax=val_max) if is_log else mcolors.Normalize(vmin=val_min, vmax=val_max)
            
            try:
                cmap = cm.get_cmap(cmap_name)
            except ValueError:
                cmap = cm.get_cmap('viridis')
            
            mapped_colors = cmap(norm(da.values)) 
            
            is_nan = np.isnan(da.values)
            mapped_colors[is_nan, 3] = 0.0  # Set alpha to 0 for NaNs
            
            img_data = np.flipud((mapped_colors * 255).astype(np.uint8))
            img = Image.fromarray(img_data, mode='RGBA')
            
            img = img.resize((width, height), Image.Resampling.NEAREST)
            
            buf = BytesIO()
            img.save(buf, format="PNG")
            return buf.getvalue()

    def get_wcs_coverage(self, source: str, source_type: str, variable: str, 
                         bbox: dict, time_slice: tuple, depth_slice: tuple) -> bytes:
        with self._open_dataset(source, source_type) as ds:
            if variable not in ds.variables:
                raise ValueError(f"Variable {variable} not found in dataset.")
                
            dims = DataValidator.detect_dimensions(ds)
            lat_dim = dims['lat']
            lon_dim = dims['lon']
            
            ds_sub = ds.copy()
            lon_vals = (ds_sub[lon_dim].values + 180) % 360 - 180
            ds_sub = ds_sub.assign_coords({lon_dim: lon_vals})
            ds_sub = ds_sub.sortby(lon_dim)
            ds_sub = ds_sub.sortby(lat_dim)
            
            min_lat = bbox.get("min_lat", -90)
            max_lat = bbox.get("max_lat", 90)
            min_lon = bbox.get("min_lon", -180)
            max_lon = bbox.get("max_lon", 180)
            
            ds_sub = ds_sub.sel({lat_dim: slice(min_lat, max_lat), lon_dim: slice(min_lon, max_lon)})
            
            if 'time' in dims and time_slice:
                if time_slice[0] is not None or time_slice[1] is not None:
                    t_start = time_slice[0] if time_slice[0] else ds_sub[dims['time']].values[0]
                    t_end = time_slice[1] if time_slice[1] else ds_sub[dims['time']].values[-1]
                    ds_sub = ds_sub.sel({dims['time']: slice(t_start, t_end)})
                
            if 'depth' in dims and depth_slice:
                if depth_slice[0] is not None or depth_slice[1] is not None:
                    d_start = depth_slice[0] if depth_slice[0] is not None else ds_sub[dims['depth']].values[0]
                    d_end = depth_slice[1] if depth_slice[1] is not None else ds_sub[dims['depth']].values[-1]
                    # Ensure ascending slice for depth if coordinates are ascending
                    if d_start > d_end:
                        d_start, d_end = d_end, d_start
                    ds_sub = ds_sub.sel({dims['depth']: slice(d_start, d_end)})
                
            vars_to_keep = [variable]
            ds_sub = ds_sub[vars_to_keep]
            
            total_cells = np.prod(list(ds_sub.dims.values()))
            if total_cells > 1000000:
                raise ValueError(f"WCS subset exceeds maximum allowed cells (1,000,000). Requested: {total_cells}")
                
            if total_cells == 0:
                raise ValueError("Requested subset contains 0 cells.")
                
            return ds_sub.to_netcdf(engine="scipy")

