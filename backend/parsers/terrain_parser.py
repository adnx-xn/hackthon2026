import os
import numpy as np
from PIL import Image

# Increase maximum image pixels to avoid DecompressionBombError for large TIFFs
Image.MAX_IMAGE_PIXELS = None


class TerrainParser:
    def __init__(self, file_path: str):
        self.file_path = file_path
        # ETOPO scientific region bounds
        self.bounds = {
            "lat_min": -30.0,
            "lat_max": 40.0,
            "lon_min": 35.0,
            "lon_max": 120.0
        }
        self._data = None
        self._metadata = None

    def load(self, max_dim: int = 512):
        """
        Load and downsample the ETOPO TIFF.
        This is a blocking call — the caller must run it in a threadpool
        (e.g. via asyncio.to_thread) to avoid blocking the event loop.
        Results are cached after the first call.
        """
        if self._data is not None:
            return self._data, self._metadata

        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"Terrain data not found at {self.file_path}")

        # Open TIFF using PIL
        img = Image.open(self.file_path)

        # Fast downsample using PIL's thumbnail before converting to numpy.
        # thumbnail() preserves aspect ratio and is faster than resize().
        img.thumbnail((max_dim, max_dim), Image.Resampling.NEAREST)

        # Convert to float32 numpy array — shape: (H, W)
        # Row 0 = geographically NORTH (lat=40N), last row = SOUTH (lat=-30S)
        # Col 0 = WEST (lon=35E), last col = EAST (lon=120E)
        arr = np.array(img, dtype=np.float32)

        # Handle multi-band images (e.g., RGB GeoTIFF)
        if arr.ndim == 3:
            arr = arr[:, :, 0]

        # Replace NaNs/NoData with 0 (sea level), clip extreme values
        arr = np.nan_to_num(arr, nan=0.0)
        arr = np.clip(arr, -11000.0, 9000.0)

        new_h, new_w = arr.shape
        self._data = arr
        self._metadata = {
            "bounds": self.bounds,
            "width": new_w,
            "height": new_h,
            # Document orientation so shader code can be written correctly
            "row0_is_north": True,   # row 0 = lat_max (40N)
            "col0_is_west": True,    # col 0 = lon_min (35E)
        }
        return self._data, self._metadata


# Module-level singleton
terrain_parser = None


def get_terrain_parser():
    global terrain_parser
    if terrain_parser is None:
        file_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "data", "geography", "exportImage.tiff"
        )
        terrain_parser = TerrainParser(os.path.abspath(file_path))
    return terrain_parser
