# Phase 10: Topographic and Bathymetric Spherical Earth

## Objective
To upgrade the existing spherical Earth implementation into a genuine 3D topographic and bathymetric Earth model. The globe serves as the physical and geographic foundation for all ocean model data and observations, differentiating land elevation from ocean bathymetry.

## Existing Earth Architecture
The globe maintains its spherical coordinate system (`R * Math.cos(lat) * Math.cos(lon)`). `EarthBase.jsx` serves as the container for the 3D Topographic base layer, the transparent Surface Level layer, and the bottom Bathymetric floor layer, preserving the original `earth_atmos_2048.jpg` texture mapping.

## Elevation and Bathymetry Source
- **Primary Scientific Data**: ETOPO 2022 (`exportImage.tiff`), provided locally at `data/geography/exportImage.tiff`.
- **Coverage Region**: North = 40°, South = -30°, West = 35°, East = 120°.
- **Fallback Strategy**: For regions outside the ETOPO coverage, a smooth, deterministic dual-frequency synthetic mathematical noise function (`sin` and `cos` based) is used to generate low-frequency variations that keep the globe visually complete without fabricating scientific data.

## Coordinate System
- Uses the project's canonical `sceneCoords.js` transformation (`geoToSpherical`).
- **Longitude**: Spherical longitude angle, mapped directly to scene X/Z via trigonometry.
- **Latitude**: Spherical latitude angle.
- Boundary blending uses GLSL `smoothstep` to flawlessly merge the ETOPO data with the synthetic fallback without altering ETOPO values inside the target region.

## Radius Model
- **Earth Surface Radius**: `EARTH_RADIUS = 5000`
- **Land Elevation Displacement**: `R_land = EARTH_RADIUS + (elevation * DEPTH_SCALE * verticalExaggeration)` (outward)
- **Ocean Depth Displacement**: `R_bottom = EARTH_RADIUS - (abs(depth) * DEPTH_SCALE * verticalExaggeration)` (inward)
*(Note: Because ETOPO expresses bathymetry as negative elevation, standard vertex displacement automatically handles both correctly).*

## Water Layers
1. **Surface Level (0m)**: Rendered as a transparent blue spherical shell precisely at `EARTH_RADIUS`.
2. **Bottom-most Depth**: Rendered by discarding positive elevations (land) in the fragment shader and coloring the submerged vertices in a deep ocean tone (`#002244`).
- Mutually exclusive toggles provided via the `ControlPanel` under "WATER LAYER".

## Files Created
- `backend/parsers/terrain_parser.py`: Python module utilizing PIL and numpy to downsample and expose the ETOPO TIFF grid.
- `backend/api/geography.py`: New FastAPI router serving the raw Float32 data array via `/api/v1/geography/terrain`.
- `frontend/src/components/OceanCanvas/TopographicEarth.jsx`: The foundational shader-displaced mesh geometry (Two-Tier ETOPO + synthetic fallback).
- `frontend/src/components/OceanCanvas/SurfaceLayer.jsx`: Transparent sea surface geometry.
- `frontend/src/components/OceanCanvas/BathymetricLayer.jsx`: Ocean floor specific styling layer.

## Files Modified
- `backend/main.py`: Registered the new geography API router.
- `frontend/src/api/apiClient.js`: Added `getTerrainData` API fetcher.
- `frontend/src/context/AppContext.jsx`: Added `waterLayer` (surface/bottom) and `terrainData` to global state.
- `frontend/src/components/ControlPanel/ControlPanel.jsx`: Added radio toggles for the Water Layers.
- `frontend/src/components/OceanCanvas/EarthBase.jsx`: Refactored to fetch terrain on mount and orchestrate the new layers.

## Existing Functionality Preserved
- Spherical coordinates remain entirely unaffected.
- Coastline, existing datasets, volume rendering, isosurface, and observations remain exactly as before, with no API contracts broken.

## Manual Verification
- [ ] Globe is still spherical.
- [ ] Mountains/land have actual 3D elevation.
- [ ] Ocean floor has actual depth relief.
- [ ] Surface Level selectable.
- [ ] Bottom-most Depth selectable.
- [ ] Switching layers is instant and doesn't crash.
- [ ] Orbit, Pan, Zoom works smoothly.
- [ ] Indian Ocean shows detailed ETOPO data while global fallback is smooth.
- [ ] Existing observation and model rendering intact.

*Note: Due to sandbox environment constraints, MANUAL VERIFICATION REQUIRED by user in browser.*

## Remaining Limitations
- Initial terrain load downsamples a large TIFF synchronously on the backend. For heavy concurrent production usage, caching this pre-processed buffer or using a tiled map service (WMS) would be more performant.
