from abc import ABC, abstractmethod
from typing import Any
from backend.models.schemas import DatasetRecord, DataSlice, VectorSlice, ProfileData, ObsDatasetRecord, VolumeSlice

class BaseParser(ABC):
    """Base class for all dataset parsers."""
    pass

class ModelParser(BaseParser):
    """Abstract parser for ocean model datasets."""

    @abstractmethod
    def get_metadata(self, source: str, source_type: str = 'local') -> DatasetRecord:
        """Parse dataset metadata into an internal DatasetRecord."""
        pass

    @abstractmethod
    def get_slice(self, source: str, source_type: str, variable: str, depth_idx: int, time_idx: int) -> DataSlice:
        """Parse a 2D scalar slice for a specific variable, depth, and time."""
        pass

    @abstractmethod
    def get_vector_slice(self, source: str, source_type: str, depth_idx: int, time_idx: int) -> VectorSlice:
        pass

    @abstractmethod
    def get_volume(self, source: str, source_type: str, variable: str, time_idx: int) -> VolumeSlice:
        """Parse a 3D scalar volume for a specific variable and time."""
        pass

    @abstractmethod
    def get_wms_map(self, source: str, source_type: str, variable: str, bbox: dict, width: int, height: int, time_idx: int, depth_idx: int, cmap_name: str, is_log: bool) -> bytes:
        """Generate a WMS PNG image."""
        pass

    @abstractmethod
    def get_wcs_coverage(self, source: str, source_type: str, variable: str, bbox: dict, time_slice: tuple, depth_slice: tuple) -> bytes:
        """Extract a WCS NetCDF subset."""
        pass

class ObservationParser(BaseParser):
    """Abstract parser for observational datasets (Argo, Glider)."""

    @abstractmethod
    def get_metadata(self, source: str, source_type: str = 'local') -> ObsDatasetRecord:
        """Parse dataset metadata into an internal ObsDatasetRecord."""
        pass

    @abstractmethod
    def get_profile(self, source: str, source_type: str, instrument_id: str) -> ProfileData:
        """Parse depth-resolved profile data for a specific instrument."""
        pass
