from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Union

# ─── INTERNAL (never serialised to API) ───────────────────────────────────────
class DatasetRecord(BaseModel):
    """Internal catalog entry. NOT returned in any API response."""
    id: str
    name: str
    source: str               # absolute path or valid HTTP(S) URL
    source_type: str          # 'local' | 'opendap'
    format: str               # 'netcdf' | 'csv'
    dataset_type: str         # 'model' | 'observation'
    variables: List[str]
    has_u_v: bool
    u_var_name: Optional[str]  # resolved U variable name
    v_var_name: Optional[str]  # resolved V variable name
    depth_levels: List[float]
    depth_from_pressure: bool
    time_steps: List[str]
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    metadata_attrs: Dict[str, str] = Field(default_factory=dict)

class ObsDatasetRecord(BaseModel):
    """Internal catalog entry for observation datasets. NOT returned in any API response."""
    id: str
    name: str
    source: str               # absolute path or valid HTTP(S) URL
    source_type: str          # 'local' | 'opendap'
    format: str               # 'netcdf' | 'csv'
    dataset_type: str         # 'observation'
    instrument_type: str      # 'argo' | 'glider'
    instrument_count: int
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    instruments: List["InstrumentRecord"]

# ─── PUBLIC API SCHEMAS ───────────────────────────────────────────────────────
class DatasetMetadataPublic(BaseModel):
    """Returned by GET /api/v1/datasets and GET /api/v1/datasets/{id}."""
    id: str
    name: str
    # file_path intentionally absent
    format: str
    dataset_type: str
    variables: List[str]
    has_u_v: bool
    depth_levels: List[float]
    depth_from_pressure: bool = False  # True if depths derived from pressure
    time_steps: List[str]
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float

class DataSlice(BaseModel):
    """Returned by GET /api/v1/datasets/{id}/data."""
    dataset_id: str
    variable: str
    depth_m: float
    depth_from_pressure: bool = False   # indicates approximated depth
    timestamp: str                      # ISO 8601
    lat: List[float]                    # ascending, South-to-North
    lon: List[float]                    # ascending, -180 to +180
    values: List[List[Optional[float]]] # values[lat_idx][lon_idx]; None = missing
    units: Optional[str] = None
    value_min: float                    # computed after masking
    value_max: float

class VectorSlice(BaseModel):
    """Returned by GET /api/v1/datasets/{id}/vectors."""
    dataset_id: str
    depth_m: float
    depth_from_pressure: bool = False
    timestamp: str
    lat: List[float]
    lon: List[float]
    u: List[List[Optional[float]]]  # eastward component; None = masked
    v: List[List[Optional[float]]]  # northward component; None = masked
    speed_max: float                # pre-computed max speed (excludes masked)

class InstrumentRecord(BaseModel):
    """Returned by instrument list and detail endpoints."""
    id: str
    instrument_type: str            # 'argo' | 'glider'
    dataset_id: str
    lat: float
    lon: float                      # normalised to -180/+180
    timestamp: Optional[str] = None
    available_profile_vars: List[str]
    u: Optional[Union[float, List[float]]] = None
    v: Optional[Union[float, List[float]]] = None
    depth: Optional[Union[float, List[float]]] = None

class ProfileData(BaseModel):
    """Returned by profile endpoint."""
    instrument_id: str
    instrument_type: str
    lat: float
    lon: float
    timestamp: Optional[str] = None
    profiles: Dict[str, List[Optional[float]]]  # var_name → depth-indexed values
    depths: List[Optional[float]]                          # in meters
    depth_from_pressure: bool = False
    units: Dict[str, str] = Field(default_factory=dict)                  # var_name → units string

class ObsDatasetSummary(BaseModel):
    """Returned by GET /api/v1/observations."""
    id: str
    name: str
    instrument_type: str    # 'argo' | 'glider'
    instrument_count: int
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float

class VolumeMetadata(BaseModel):
    """Metadata returned in X-Volume-Metadata header for 3D volumes."""
    dataset_id: str
    variable: str
    time_idx: int
    dimensions: Dict[str, int]          # e.g., {"nz": ..., "ny": ..., "nx": ...}
    dimension_order: List[str]          # ["depth", "lat", "lon"]
    depths: List[float]                 # corresponding to nz
    latitudes: List[float]              # corresponding to ny
    longitudes: List[float]             # corresponding to nx
    dtype: str = "float32"
    missing_value: str = "NaN"
    units: Optional[str] = None
    value_min: float
    value_max: float

class VolumeSlice(BaseModel):
    """Internal structure passed from normalizer/service to API layer."""
    metadata: VolumeMetadata
    binary_data: bytes                  # The actual numpy Float32 array as bytes

