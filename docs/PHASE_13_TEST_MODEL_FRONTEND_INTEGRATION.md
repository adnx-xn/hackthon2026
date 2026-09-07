# Frontend Integration of `test_model.nc`

This document details the successful integration of the `test_model.nc` dataset into the SIH26 3D visualization frontend.

## Dataset
- **Dataset ID:** `test_model`
- **Filename:** `test_model.nc`

## NetCDF Structure
Inspection of `test_model.nc` revealed the following native dimensions and variables:
- **Dimensions**: `time = 3`, `depth = 29`, `latitude = 601`, `longitude = 840`
- **Coordinates**: `time` (datetime64), `depth` (float32, meters), `latitude` (float32, degrees_north), `longitude` (float32, degrees_east)
- **Data Variables**:
  - `thetao` (Sea water potential temperature, °C)
  - `so` (Sea water salinity, PSU)
  - `uo` (Eastward sea water velocity, m/s)
  - `vo` (Northward sea water velocity, m/s)

## Dataset Profile
The dataset profile in `frontend/src/config/datasetProfiles.json` explicitly maps the backend variables to frontend views for `test_model`:
- **Temperature** → `thetao`
- **Salinity** → `so`
- **Currents** → `uo` + `vo`

## Surface Rendering
The frontend utilizes `SurfaceDataLayer.jsx` which dynamically iterates over the grid. For each valid point, the `[longitude, latitude]` coordinates are mapped to 3D spatial points using the authoritative `geoToSpherical()` utility at `EARTH_RADIUS + 2.0` (to sit precisely above the Earth base without z-fighting). The resulting `THREE.BufferGeometry` respects the curvature of the spherical Earth, automatically ignoring missing data points.

## Legend
The `ScientificLegend` component dynamically reads the active `surfaceData` or `vectorSlice` metadata provided by the backend API. It renders the explicit human-readable quantity mapped from the dataset profile, along with the dynamically calculated minimum and maximum scale bounds and native units (`°C` for Temperature, `1e-3` (PSU) for Salinity, and `m s-1` for currents).

## Error Handling
The `SurfaceDataLayer` and `VectorLayer` components are strictly isolated within a dedicated `ErrorBoundary` component located in `OceanCanvas.jsx`. If any scientific rendering fails (e.g., malformed data arrays or API failures), the `ErrorBoundary` gracefully catches the exception. It prevents a white screen by leaving the base `EarthBase` mounted and displays a "Scientific layer failed" HTML overlay button that allows the user to safely restore the state to the `None` view.

## Files Modified
- `frontend/src/config/datasetProfiles.json`

## Files Created
- `docs/PHASE_13_TEST_MODEL_FRONTEND_INTEGRATION.md`

## Validation
- **Code Verified:**
  - Dynamic discovery via `CatalogService` verified via `curl` to `/api/v1/datasets`.
  - Slice extraction endpoint verified yielding successful payloads for `thetao` and vector slices.
  - Geometry and dataset profile structures mapped perfectly without hacks.
- **Manually Verified:** None (Awaiting manual UI verification by user).
- **Blocked/Not Tested:** Visual fidelity (Awaiting user observation).

## Remaining Limitations
- Currents vector plotting skips large density data to cap arrows at 500, dropping visual resolution.
- Rendering assumes `depthIdx = 0` exclusively for the active surface view, discarding the other 28 depths.
