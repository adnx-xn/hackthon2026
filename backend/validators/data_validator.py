class ValidationError(Exception):
    """Raised when dataset validation fails."""
    pass

class DataValidator:
    DIM_ALIASES = {
        'lat': ['lat', 'latitude', 'y', 'nav_lat', 'yt_ocean', 'yu_ocean'],
        'lon': ['lon', 'longitude', 'x', 'nav_lon', 'xt_ocean', 'xu_ocean'],
        'time': ['time', 't', 'time_counter'],
        'depth': ['depth', 'z', 'lev', 'level', 'pressure', 'st_ocean', 'sw_ocean']
    }

    @staticmethod
    def detect_dimensions(ds) -> dict:
        dims = {}
        for coord_name in ds.coords:
            coord_lower = coord_name.lower()
            for std_name, aliases in DataValidator.DIM_ALIASES.items():
                if coord_lower in aliases:
                    if std_name not in dims:
                        dims[std_name] = coord_name
                    break
        return dims

    @staticmethod
    def validate_required_dimensions(dims: dict):
        if 'lat' not in dims or 'lon' not in dims:
            raise ValidationError("Required dimensions 'lat' and 'lon' not found.")

    @staticmethod
    def verify_1d_coordinates(ds, lat_dim: str, lon_dim: str):
        if len(ds[lat_dim].dims) > 1 or len(ds[lon_dim].dims) > 1:
            raise ValidationError("Curvilinear grids not supported in V1.")
