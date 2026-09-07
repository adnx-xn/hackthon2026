# PHASE 10: SURFACE-ONLY OCEAN MODEL VISUALIZATION

## Overview

The 3D topographic and bathymetric Earth visualization presented instability and regressions when rendering full 3D variables. To establish a stable, geographically correct 3D globe as a foundation, we simplified the active ocean-model visualization to **Surface-Only** rendering on the existing spherical Earth.

## Implementations

### Frontend Architecture
- **Surface Visualization Mode:** Introduced a new `'Surface'` visualization mode to `AppContext` and `ControlPanel`. It is the default mode.
- **2D Variable Support:** The `ControlPanel` prevents `/volume` endpoint requests for native 2D surface variables (like `bottomT`, `mlotst`) by properly routing the request to `/data` using `getDataSlice` with `depth_idx = 0`.
- **`SurfaceDataLayer` Component:** A new rendering component that maps 2D data grids directly onto the spherical globe using `BufferGeometry` and the `geoToSpherical` utility function at `depthMeters = 0`.
- **`VectorLayer` Spherical Support:** Updated vector mapping logic to use `geoToSpherical`. It also calculates proper tangent plane orientations for Arrows (Local North and East) so they lie flat and point correctly on the globe surface.

### Backend Data Handling
- The backend continues to use `xarray.isel(depth=0)` or simply serve 2D variables natively without a depth dimension.
- No changes to API schema were required; the frontend now respects the API contracts preventing 422 Unprocessable Entity errors.

## Limitations Addressed
- **422 Errors Prevented:** The frontend no longer requests 3D volume slices for 2D surface variables.
- **Rendering Performance:** `SurfaceDataLayer` cleanly manages missing values without generating geometry where data is undefined, improving visual correctness and keeping memory low.

## Current State
The application starts stably with the spherical Earth, defaulting to `Surface` mode. Depth selection is purposefully disabled in this mode. Future enhancements can safely reactivate Depth Navigation and Volumetric rendering as subsequent architectural layers.
