# Version 1 Scope Document

## 3D Ocean Data Visualization System for INCOIS

| Field        | Value                                          |
|--------------|------------------------------------------------|
| Document ID  | SCOPE-INCOIS-3DVIZ-001                         |
| Version      | 1.0                                            |
| Status       | Draft — Binding Scope for V1 Implementation    |
| Date         | 2026-08-27                                     |

> **Purpose of This Document:** This document defines the scope of the project.
>
> **NOTE (August 2026):** The original restricted "V1 Prototype" scope defined below has been superseded by the Final INCOIS Client Requirements. Where previous constraints block the final requirements (e.g., banning volumetric rendering, OPeNDAP, or new instruments), those constraints are now OBSOLETE. The system must support true volumetric visualization and a broader range of data sources/standards.
>
> **COMPULSORY 3D VISUALIZATION REQUIREMENT:** The final system must support true 3D volumetric visualization (raymarching/Data3DTexture), isosurface extraction, and depth-slice visualization. Previous restrictions limiting the visualization to a single depth-slice or multiple stacked planes are OBSOLETE. Current vectors and vertical exaggeration remain P0/MUST HAVE.

---

## 1. MoSCoW Classification

### 1.1 MUST HAVE (V1 is incomplete without these)

These features are mandatory. V1 cannot be considered delivered if any MUST HAVE item is missing.

| ID       | Feature                                   | Description                                                                                                                           | Linked FR      |
|----------|-------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|----------------|
| MH-001   | Backend REST API                          | FastAPI backend serving dataset metadata, variable slices, and observation data via JSON endpoints                                     | FR-001         |
| MH-002   | NetCDF Model Dataset Ingestion            | Backend parses NetCDF files from the data directory; exposes variables, depths, times                                                 | FR-001         |
| MH-003   | 3D Visualization Canvas (Three.js WebGL)  | React + Three.js WebGL scene rendering the interactive 3D ocean domain. Scene must support camera rotation, zoom, pan, and depth positioning of layers. | FR-002, FR-012 |
| MH-004   | Temperature 3D Depth-Slice                | Temperature field rendered as a colored mesh inside the 3D WebGL scene at the selected depth                                          | FR-002         |
| MH-005   | Salinity 3D Depth-Slice                   | Salinity field rendered using the same 3D pipeline as temperature                                                                     | FR-002         |
| MH-006   | Variable Selector                         | Dropdown listing variables available in the loaded dataset                                                                            | FR-003         |
| MH-007   | Depth Level Navigation                    | Slider to select depth level; the depth-slice mesh moves to the new depth position within the 3D scene                                | FR-004         |
| MH-008   | Time Step Navigation                      | Slider + step buttons; timestamp displayed; animation play/pause                                                                      | FR-005         |
| MH-009   | Argo Float Overlay (3D markers)           | Argo float positions displayed as georeferenced 3D markers in the scene                                                               | FR-007         |
| MH-010   | Glider Overlay (3D markers)               | Glider positions displayed as distinctly styled 3D markers in the scene                                                               | FR-007         |
| MH-011   | Instrument Selection (click)              | Click on a 3D marker to open the profile panel                                                                                        | FR-008         |
| MH-012   | Profile Panel (2D depth chart)            | Supplementary **2D** chart showing variable vs depth for the selected instrument. This panel is separate from the 3D visualization.   | FR-008         |
| MH-013   | Colorbar Display                          | Visible colorbar with current palette and min/max labels                                                                              | FR-009         |
| MH-014   | Color Palette Selection                   | At least 4 named palettes: viridis, plasma, coolwarm, jet                                                                             | FR-009         |
| MH-015   | Colorbar Min/Max Override                 | User can input custom min and max values; visualization updates immediately                                                            | FR-009         |
| MH-016   | 3D Camera Controls                        | Rotate, zoom, pan via mouse; reset camera button; Three.js OrbitControls                                                              | FR-012         |
| MH-017   | Error Handling (backend)                  | Invalid/corrupt datasets return structured JSON errors; backend does not crash                                                         | FR-013         |
| MH-018   | Error Display (frontend)                  | Frontend shows user-readable error messages when backend returns errors                                                                | FR-013         |
| MH-019   | Dataset Validation                        | Backend validates required dimensions (lat, lon); skips invalid files with logged errors                                              | FR-013         |
| MH-020   | Dataset Catalog Endpoint                  | `GET /api/v1/datasets` returns list of discovered model datasets with metadata                                                           | FR-001         |
| MH-021   | Observation Catalog Endpoint              | `GET /api/v1/observations` returns list of discovered observation *datasets* with instrument counts (not individual instruments directly)  | FR-007         |
| MH-022   | Data Slice Endpoint                       | `GET /api/v1/datasets/{id}/data` returns single variable/depth/time slice as JSON grid                                                   | FR-002         |
| MH-023   | Profile Endpoint                          | `GET /api/v1/observations/{dataset_id}/instruments/{instrument_id}/profile` returns instrument depth profile data                         | FR-008         |
| MH-024   | Instrument Layer Toggle                   | Show/hide Argo and Glider layers independently via UI toggle                                                                             | FR-007         |
| MH-025   | Missing Variable Handling                 | Variables absent from a dataset are excluded from the selector; no error is raised                                                       | NFR-006        |
| MH-026   | **Status Display (P0)**                   | UI always shows: active dataset name, variable, depth in meters, time, A loading indicator is displayed whenever data is being fetched or processed. **Elevated to P0 — scientifically essential for users to know which variable/depth/time is displayed.** | FR-015         |
| MH-027   | **Current Vector Visualization (3D)**     | U/V current arrows rendered as 3D objects (`THREE.ArrowHelper`) in the scene on the depth-slice plane, when dataset contains u/v variables. Explicitly required by project description. | FR-006         |
| MH-028   | **Vertical Exaggeration Control**         | Slider/input applying a multiplicative factor to the depth (Y) axis in the 3D scene. Preserves horizontal lat/lon accuracy. Explicitly required by project description. Without this, depth structure is invisible due to ocean aspect ratio. | FR-011         |

---

### 1.2 SHOULD HAVE (Important for V1, but may be deferred if implementation time is constrained.)

> Note: Current Vector Visualization and Vertical Exaggeration have been **promoted to MUST HAVE (MH-027, MH-028)** per the project's compulsory 3D requirements. Status Display has been **promoted to MUST HAVE (MH-026)** per review finding IMPORTANT-12. They are no longer in this section.

| ID       | Feature                                | Description                                                                                              | Linked FR    |
|----------|----------------------------------------|----------------------------------------------------------------------------------------------------------|--------------|
| SH-001   | Layer Opacity Control                  | Slider to control opacity of the active model layer                                                      | FR-010       |
| SH-002   | Profile Variable Switching             | Profile panel allows switching between available variables (T, S, Chl where present)                    | FR-008       |
Steps marked [SHOULD] are optional if implementation time is constrained.
| SH-003   | Animation Speed Control                | User-adjustable animation speed during time playback                                                     | FR-005       |
| SH-004   | Colorbar Log Scale Toggle              | Toggle linear/log scale for scientifically appropriate variables; displays warning if data contains negative values | FR-009       |
| SH-005   | Glider Track Display                   | Glider path rendered as a polyline connecting sequential positions in the 3D scene                      | FR-007       |
| SH-006   | ASCII/CSV Observation Ingestion        | Backend can also parse CSV/delimited Argo or Glider data files                                           | FR-001       |
| SH-007   | Dataset Metadata Display               | Clicking on a dataset shows its full metadata (variable names, depth levels, time range, bounding box)  | FR-015       |
| SH-009   | Vector Endpoint                        | `GET /api/v1/datasets/{id}/vectors` returns U/V slice as JSON for frontend rendering                     | FR-006       |
| SH-010   | ASCII/CSV Model Ingestion                | Backend can also parse regular-grid model data supplied as ASCII/CSV.                                 | FR-001       |
---

### 1.3 COULD HAVE (Implement only if core V1 is complete and time permits)

| ID       | Feature                                | Description                                                                                              |
|----------|----------------------------------------|----------------------------------------------------------------------------------------------------------|
| CH-001   | Isosurface Rendering                   | 3D surface at a user-specified variable value (P2 in SRS — FR-014)                                       |
| CH-002   | Multiple Simultaneous Depth Slices     | Render 2 or more depth levels simultaneously for comparison                                              |
| CH-003   | Chlorophyll Visualization              | Colormap display of chlorophyll variable if present in dataset                                           |
| CH-004   | Profile Panel Model Comparison         | Overlay the model value extracted at instrument position on the same profile chart                       |
| CH-005   | Instrument Hover Tooltip               | Show instrument ID and location in a tooltip on hover before clicking                                    |
| CH-006   | Keyboard Time Navigation               | Left/right arrow keys advance/retreat one time step                                                      |
| CH-007   | Colorbar Histogram                     | Small histogram of data distribution overlaid on colorbar                                                |
| CH-008   | Geographic Grid Overlay                | Lat/lon grid lines displayed on the ocean scene                                                          |
| CH-009   | Light/Dark UI Theme                    | Toggle between light and dark UI themes                                                                  |

---

### 1.4 FUTURE / POST-DELIVERY (Non-Required Ideas)

> **[OBSOLETE RULE]:** Previous restrictions banning OGC WMS/WCS, OPeNDAP, CTD/BGC/Mooring/HF Radar/ADCP overlays, Isosurfaces, and Full Volumetric Rendering are OBSOLETE. These features are now REQUIRED by the final INCOIS client mandate.

The following items remain strictly out of scope for the final delivery:

| ID       | Feature                                  | Rationale                                                                                                      |
|----------|------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| FU-001   | User Authentication                      | Not required for internal deployment                                                                           |
| FU-010   | Browser UI File Upload                   | Uses server-side data directory placement or OPeNDAP URLs                                                      |
| FU-011   | Data Download / Export from UI           | Not required for demonstration                                                                                 |
| FU-012   | Mobile / Tablet UI                       | Targets desktop only                                                                                           |
| FU-013   | Multi-user Session Management            | Single-user prototype                                                                                          |
| FU-014   | ML-Derived Ocean Products                | No ML integration                                                                                              |
| FU-015   | Advanced Educational Modules             | Scientific visualization is focus                                                                              |
| FU-016   | Curvilinear/Unstructured Grid Support    | Regular rectangular grids sufficient                                                                           |
| FU-017   | Real-Time Streaming Data Ingestion       | Uses static pre-placed datasets or OPeNDAP endpoints                                                           |
| FU-018   | INCOIS Automated Data Pipeline           | Manual dataset placement / configuration                                                                       |
| FU-019   | Kubernetes / Container Orchestration     | Single-server deployment only                                                                                  |
| FU-020   | Payment / Identity / Social Features     | Not applicable to this project                                                                                 |
| FU-021   | WCAG 2.1 Full Accessibility Compliance   | Accessibility improvements are deferred                                                                        |
| FU-022   | Printed / PDF Report Generation          | Not required                                                                                                   |

---

## 2. Feature Matrix

| Feature                                         | V1 Status    | Priority | Notes                                                        |
|-------------------------------------------------|--------------|----------|--------------------------------------------------------------|
| Backend REST API                                | MUST HAVE    | P0       | FastAPI + Python                                             |
| NetCDF Model Dataset Ingestion                  | MUST HAVE    | P0       | Using xarray + netCDF4                                       |
| **3D WebGL Visualization Canvas (Three.js)**    | MUST HAVE    | P0       | Interactive 3D scene with camera controls — NOT a 2D map    |
| Temperature 3D Depth-Slice                      | MUST HAVE    | P0       | Mesh rendered inside 3D scene at depth                      |
| Salinity 3D Depth-Slice                         | MUST HAVE    | P0       | Mesh rendered inside 3D scene at depth                      |
| Variable Selector                               | MUST HAVE    | P0       |                                                              |
| Depth Navigation (3D scene depth positioning)   | MUST HAVE    | P0       | Moves depth-slice mesh along depth axis in 3D scene         |
| Time Navigation + Animation                     | MUST HAVE    | P0       |                                                              |
| Argo Float Overlay (3D markers)                 | MUST HAVE    | P0       |                                                              |
| Glider Overlay (3D markers)                     | MUST HAVE    | P0       |                                                              |
| Instrument Click → Profile Panel               | MUST HAVE    | P0       |                                                              |
| Profile Panel (2D chart, supplementary)         | MUST HAVE    | P0       | 2D chart (T/S/Chl vs depth); supplementary to 3D scene      |
| Colorbar Display                                | MUST HAVE    | P0       |                                                              |
| Color Palette Selection (≥4)                   | MUST HAVE    | P0       | viridis, plasma, coolwarm, jet                               |
| Colorbar Min/Max Override                       | MUST HAVE    | P0       |                                                              |
| 3D Camera Controls                              | MUST HAVE    | P0       | Rotate, zoom, pan, reset (OrbitControls)                     |
| Error Handling + Display                        | MUST HAVE    | P0       |                                                              |
| Missing Variable Handling                       | MUST HAVE    | P0       |                                                              |
| Status Display (variable/depth/time)            | MUST HAVE    | P0       |                                                              |
| **Current Vector Visualization (3D arrows)**    | **MUST HAVE**| **P0**   | **Promoted P1→P0. Explicitly required. Conditional on u/v present in dataset.** |
| **Vertical Exaggeration Control**               | **MUST HAVE**| **P0**   | **Promoted P1→P0. Explicitly required. Essential for meaningful 3D depth visualization.** |
| Layer Opacity Control                           | SHOULD HAVE  | P1       |                                                              |
| Profile Variable Switching                      | SHOULD HAVE  | P1       |                                                              |
| Animation Speed Control                         | SHOULD HAVE  | P1       |                                                              |
| Colorbar Log Scale                              | SHOULD HAVE  | P1       |                                                              |
| Glider Track Polyline (3D scene)                | SHOULD HAVE  | P1       |                                                              |
| ASCII/CSV Observation Ingestion                 | SHOULD HAVE  | P1       |                                                              |
| Dataset Metadata Display                        | SHOULD HAVE  | P1       |                                                              |
| Camera Reset Button                             | SHOULD HAVE  | P1       |                                                              |
| Isosurface Rendering                            | COULD HAVE   | P2       | Only if MUST/SHOULD are complete; 3D surface in scene        |
| Multiple Simultaneous Depth Slices              | COULD HAVE   | P2       |                                                              |
| Chlorophyll Visualization                       | COULD HAVE   | P2       |                                                              |
| Model-Profile Overlay in Panel                  | COULD HAVE   | P2       |                                                              |
| Instrument Hover Tooltip                        | COULD HAVE   | P2       |                                                              |
| User Authentication                             | FUTURE       | —        | Post-delivery                                                |
| OGC WMS / WCS                                   | MUST HAVE    | P1       | Required by final client mandate                             |
| OPeNDAP                                         | MUST HAVE    | P1       | Required by final client mandate                             |
| CTD / BGC / Mooring / HF / ADCP                | MUST HAVE    | P0       | Required by final client mandate                             |
| Browser File Upload                             | FUTURE       | —        | Post-delivery                                                |
| Mobile UI                                       | FUTURE       | —        | Post-delivery                                                |
| ML Products                                     | FUTURE       | —        | Post-delivery                                                |
| Real-Time Streaming                             | FUTURE       | —        | Post-delivery                                                |
| **Full Volumetric Rendering (transparency)**    | MUST HAVE    | P0       | Required by final client mandate                             |

---

## 3. V1 User Journeys

### Journey 1 — Core Model Visualization

```
Open browser → View initial 3D ocean scene
→ Select dataset from dataset panel
→ Select "Temperature" variable
→ Move depth slider to 100m → Scene updates
→ Play time animation → Observe temporal evolution
→ Change colorbar palette to viridis → Scene re-renders
→ Set custom min/max on colorbar → Values applied
→ Rotate/zoom scene to inspect region of interest
```

### Journey 2 — Instrument Data Inspection

```
(Dataset loaded from Journey 1)
→ Enable Argo Float layer in instrument controls
→ Argo markers appear on the 3D scene
→ Click an Argo float marker
→ Profile panel opens with Temperature vs Depth chart
→ Switch profile variable to Salinity
→ Chart updates to salinity profile
→ Close panel
→ Enable Glider layer
→ Click glider marker → View glider profile
```

### Journey 3 — Forecaster Rapid Assessment

```
→ Load operational forecast model dataset
→ Select Temperature variable, surface depth (0m)
→ Observe surface temperature pattern
→ Navigate to 200m depth → Observe thermocline region
→ Enable Argo layer → Correlate float positions with model pattern
→ Click float in anomalous region → Inspect T/S profile
→ Return to time navigator → Step forward 24h → Compare
```

---

## 4. V1 Screens

| Screen                 | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| Main Application View  | Full-screen 3D visualization canvas with collapsible side panels            |
| Dataset Panel          | Left or top panel; dataset selector dropdown, observation selector dropdown |
| Controls Panel         | Right side panel; variable selector, depth slider, time controls            |
| Colorbar Panel         | Embedded in controls panel; palette picker, min/max inputs, optional log-scale toggle.   |
| Layer Panel            | Embedded in controls panel; model layer toggle + opacity, instrument toggles|
| Profile Panel          | Overlay or sidebar; instrument metadata + depth chart                       |
| Status Bar             | Bottom bar or header; active dataset, variable, depth, time, loading state  |

> V1 does NOT have separate pages, login screens, admin panels, or dashboard views.

---

## 5. V1 Supported Datasets

| Dataset Type             | Format      | Required for V1 | Notes                                    |
|--------------------------|-------------|-----------------|------------------------------------------|
| Ocean Model Output       | NetCDF      | Yes             | Regular lat/lon rectangular grid         |
| Argo Float Observations  | NetCDF      | Yes             |                                          |
| Argo Float Observations  | CSV         | Should Have     | Comma or tab delimited                   |
| Glider Observations      | NetCDF      | Yes             |                                          |
| Glider Observations      | CSV         | Should Have     |                                          |
| Delimited Text Model     | ASCII/CSV   | Should Have (P1)| If model data provided as ASCII; not a V1 blocker |
| CTD / BGC / ADCP         | Any         | No (FUTURE)     | Architecture allows future addition      |

---

## 6. V1 Supported Variables

| Variable          | Type        | V1 Status    | Notes                                                                             |
|-------------------|-------------|--------------|-----------------------------------------------------------------------------------|
| Temperature       | Scalar      | MUST HAVE    | Primary 3D depth-slice variable                                                   |
| Salinity          | Scalar      | MUST HAVE    | Primary 3D depth-slice variable                                                   |
| U-Current (East)  | Vector      | **MUST HAVE**| If present, must be visualized                                                    |
| V-Current (North) | Vector      | **MUST HAVE**| If present, must be visualized                                                   |
| Chlorophyll       | Scalar      | COULD HAVE   | Display if present in dataset; auto-discovered                                    |
| Other named vars  | Scalar      | Auto         | Any eligible scalar data variable in the dataset is automatically listed in the variable selector. Coordinate variables, dimensions, bounds, masks, and metadata-only variables are excluded   |

U/V variables are conditionally supported. Their absence from a dataset is not an error. If both required components are available, the current vector layer must be rendered.

For example:

If only one component of a vector pair is present, the vector layer is hidden and no backend/frontend error is raised.

> Variables are automatically discovered from the loaded dataset. Current vector variables (u/v) are conditionally required: if present in the dataset, they must be visualizable via MH-027. If absent, the vector layer is hidden without error.

---

## 7. V1 Supported Browsers

| Browser         | Minimum Version | WebGL Support Requirement |
|-----------------|-----------------|---------------------------|
| Google Chrome   | Latest stable   | WebGL 1.0 required        |
| Mozilla Firefox | Latest stable   | WebGL 1.0 required        |
| Microsoft Edge  | Latest stable   | WebGL 1.0 required        |
| Safari          | Not tested in V1 (FUTURE) | —                 |
| Mobile browsers | Not supported in V1 (FUTURE) | —              |

---

## 8. V1 Known Limitations

The following are known limitations of V1. They are accepted as part of the V1 scope and must be clearly communicated to stakeholders.

1. **Local Filesystem Only:** V1 loads datasets from a pre-configured server-side data directory. Datasets cannot be uploaded via the browser UI.
2. **Regular Grid Only:** The 3D visualization supports regular rectangular latitude/longitude grids. Curvilinear or unstructured grids are not supported.
3. **3D Depth-Slice Visualization (NOT Full Volumetric Rendering):** The V1 primary visualization mode is interactive 3D depth-slice rendering inside a WebGL scene. The entire scene is 3D with camera controls, vertical exaggeration, and instrument overlays. **Full volumetric rendering** (rendering the entire 3D scalar field with voxel transparency) is a separate advanced capability not included in V1.
4. **No Authentication:** V1 has no user authentication. It is intended for internal/prototype deployment only.
5. **Single User:** V1 is not designed for concurrent multi-user operation.
6. **Desktop Only:** V1 UI is designed for desktop browsers at 1920×1080 or similar resolution.
7. **Performance with Large Datasets:** Large NetCDF files (>1 GB) may experience slower slice extraction times. Caching mitigates repeated requests but is not optimized for very large files.
8. **No Real-Time Data:** V1 processes static, pre-placed datasets. Real-time streaming is not supported.
9. **Argo and Glider Only:** Instrument overlay supports only Argo floats and gliders in V1.
10. **Isosurface is P2/COULD HAVE:** Isosurface visualization is part of the project requirements but may not be present if P0/P1 core items are not yet complete.

---

## 9. V1 Acceptance Criteria

V1 is considered complete when ALL of the following criteria are met:

| ID     | Criterion                                                                                                                                                   |
|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| VAC-01 | Backend starts without errors and serves `GET /api/v1/datasets` with at least one sample model dataset listed                                                   |
| VAC-02 | Frontend renders a **3D scene** (Three.js WebGL canvas) showing a temperature depth-slice mesh rendered inside the 3D scene (not a flat 2D map)             |
| VAC-03 | Variable selector lists available variables; switching variables updates the 3D scene                                                                        |
| VAC-04 | Depth slider navigates between at least 3 depth levels; depth-slice mesh moves to the new depth position within the 3D scene                                |
| VAC-05 | Time navigation (step forward/back + play/pause) functions correctly with a multi-timestep dataset; timestamp display updates with each step                |
| VAC-06 | Colorbar is visible; palette can be changed to at least viridis, plasma, coolwarm, jet; 3D visualization re-renders with new palette                        |
| VAC-07 | Colorbar min/max can be manually set and visualization updates immediately                                                                                   |
| VAC-08 | Argo float markers are displayed in the 3D scene at correct geographic positions                                                                             |
| VAC-09 | Clicking an Argo float marker opens a profile panel with a 2D Temperature vs Depth chart (chart is supplementary, scene remains 3D)                         |
| VAC-10 | Glider markers are displayed and visually distinguishable from Argo markers                                                                                  |
| VAC-11 | Instrument layer (Argo / Glider) can be toggled on and off independently                                                                                    |
| VAC-12 | 3D camera can be rotated, zoomed, and panned via mouse; camera resets to default overview on demand; rotating confirms the depth-slice is a 3D object       |
| VAC-13 | A corrupted or invalid dataset file does not crash the backend; a user-readable error message appears in the frontend                                        |
| VAC-14 | Status bar correctly shows active dataset, variable, depth, and timestamp at all times                                                                       |
| VAC-15 | The application runs without unhandled JavaScript console errors in Chrome, Firefox, and Edge                                                                |
| VAC-16 | The profile panel displays instrument metadata (ID, type, lat, lon, measurement date if available)                                                           |
| VAC-17 | Missing variables in a dataset do not cause errors; they are absent from the variable selector                                                               |
| VAC-18 | **Adjusting vertical exaggeration changes only the scene's depth-axis scale. The latitude/longitude positions of the depth slice, Argo markers, Glider markers, and vector origins remain unchanged.**       |
| VAC-19 | **If dataset contains u/v current variables, current vector arrows are rendered in the 3D scene with correct orientation and magnitude-proportional length** |
| VAC-20 | **A known data value read from the raw NetCDF file (e.g., via `xarray` CLI or ncdump) matches the corresponding value returned by `GET /api/v1/datasets/{id}/data`, confirming data pipeline integrity** |

---

## 10. V1 Completion Checklist

> Use this checklist to track completion of V1 deliverables.

### Backend
- [ ] FastAPI application initialized and serves `/api/v1/*` routes
- [ ] NetCDF parser module implemented (xarray-based) with dimension name aliasing
- [ ] CSV/ASCII observation parser module implemented
- [ ] Dataset catalog builder scans the data directory at startup
- [ ] `GET /api/v1/datasets` endpoint operational
- [ ] `GET /api/v1/datasets/{id}` metadata endpoint operational
- [ ] `GET /api/v1/datasets/{id}/variables` endpoint operational
- [ ] `GET /api/v1/datasets/{id}/times` endpoint operational
- [ ] `GET /api/v1/datasets/{id}/depths` endpoint operational
- [ ] `GET /api/v1/datasets/{id}/data` slice endpoint operational
- [ ] `GET /api/v1/datasets/{id}/vectors` endpoint operational (returns 404 if no u/v)
- [ ] `GET /api/v1/observations` endpoint operational (returns dataset summaries with instrument counts)
- [ ] `GET /api/v1/observations/{dataset_id}/instruments` endpoint operational (returns instrument list)
- [ ] `GET /api/v1/observations/{dataset_id}/instruments/{instrument_id}` endpoint operational
- [ ] `GET /api/v1/observations/{dataset_id}/instruments/{instrument_id}/profile` endpoint operational
- [ ] Validation and error handling for invalid files implemented
- [ ] CORS configured for frontend origin (`CORS_ORIGIN` env var); GZip compression middleware enabled
- [ ] Missing variable graceful handling implemented
- [ ] Latitude canonical sort (South-to-North) applied in normalizer
- [ ] Longitude normalization to -180/+180 applied for both model and observation data
- [ ] Pressure-to-depth conversion applied for Argo/pressure-coordinate data

### Frontend
- [ ] React application initialized (Vite build tool)
- [ ] Three.js 3D canvas component implemented (genuine 3D WebGL scene, NOT a 2D map)
- [ ] Depth-slice mesh rendering implemented: colored `THREE.PlaneGeometry` positioned at depth in 3D scene
- [ ] **Vertical exaggeration** slider implemented; depth axis (Y) scales without affecting horizontal lat/lon
- [ ] Variable selector dropdown implemented
- [ ] Depth slider implemented; moves depth-slice mesh along depth axis in 3D scene
- [ ] Time controls (slider, play/pause, step, speed) implemented
- [ ] Colorbar widget with palette selector and min/max inputs implemented
- [ ] **Current vector layer** implemented (`THREE.ArrowHelper` instances on depth-slice plane)
- [ ] Argo marker rendering implemented (3D points in scene)
- [ ] Glider marker rendering implemented (distinctly styled 3D points)
- [ ] Instrument layer toggle controls implemented
- [ ] Instrument click → profile panel implemented (raycasting against 3D markers)
- [ ] Profile chart (Recharts) implemented as **2D supplementary panel**
- [ ] Camera controls (Three.js OrbitControls) implemented
- [ ] Camera reset button implemented
- [ ] Status bar implemented
- [ ] Error message display implemented
- [ ] Loading indicator implemented

### Testing and Validation
- [ ] Backend tested with at least one real NetCDF model dataset
- [ ] Backend tested with at least one Argo NetCDF dataset
- [ ] Backend tested with a corrupted file (confirms no crash)
- [ ] Backend tested with a non-CF dimension name dataset (e.g., `lev` instead of `depth`)
- [ ] Frontend verified in Chrome, Firefox, and Edge
- [ ] **Verified: depth-slice renders inside 3D scene (camera rotation confirms 3D, not 2D)** — VAC-02, VAC-12
- [ ] **Verified: vertical exaggeration changes depth axis without moving horizontal positions** — VAC-18
- [ ] **Verified: current vector arrows render in 3D scene with correct orientation** — VAC-19
- [ ] **Verified: known data value from raw NetCDF matches API response** — VAC-20
- [ ] All VAC-01 through VAC-20 criteria verified
- [ ] No unhandled JavaScript console errors in production build

### Documentation
- [ ] `docs/SRS.md` finalized
- [ ] `docs/V1_SCOPE.md` finalized
- [ ] `docs/ARCHITECTURE.md` finalized
- [ ] `README.md` (project root) finalized
- [ ] `backend/.env.example` created
- [ ] `frontend/.env.example` created

---

*End of V1 Scope Document — Version 1.0*
