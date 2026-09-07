# AGENTS.md — 3D Ocean Data Visualization System for INCOIS

> **Purpose:** This file governs the behaviour of all AI coding agents working in this repository.
> Read it completely before touching any file. It is not optional.
>
> **NOTE (August 2026):** The original restricted V1 constraints have been superseded by the Final INCOIS Client Requirements. Where previous constraints block the final requirements (e.g., banning volumetric rendering or new instruments), those constraints are now OBSOLETE. The system must support true volumetric visualization and a broader range of data sources/standards.

---

## 0. Project Identity

**Project name:** 3D Ocean Data Visualization System for INCOIS
**SIH 2026 project.**

This is a **scientific-data visualization system** — not a generic web app, not a dashboard, not a 2D map. Every implementation decision must respect that identity.

The system:
- parses ocean model NetCDF datasets and observational data (Argo / Glider)
- serves the data through a FastAPI REST API
- renders ocean variable depth slices as coloured **3D meshes** inside a Three.js WebGL scene
- overlays georeferenced Argo and Glider instrument markers in the same 3D scene
- displays supplementary 2D depth-profile charts for selected instruments
- supports interactive controls: variable selector, depth navigation, time animation, vertical exaggeration, colorbar, instrument panel

The primary visualization **is** a genuine interactive 3D WebGL ocean scene — not a flat 2D map.

---

## 1. Authoritative Documents — Priority Order

When any two specifications conflict, resolve the conflict using this priority order.
Do **not** casually reinterpret documents. If genuinely ambiguous, stop and report (see §10).

| Priority | Document | Location | Role |
|----------|----------|----------|------|
| 1 | **Architecture Review v1.1** | `arch_review_v1_1.md` (conversation artifact) | Supersedes the ARCHITECTURE.md sections it explicitly corrects |
| 2 | **ARCHITECTURE.md** | `docs/ARCHITECTURE.md` | Primary technical specification for all sections not corrected by v1.1 |
| 3 | **SRS.md** | `docs/SRS.md` | Functional and non-functional requirements; acceptance criteria |
| 4 | **V1_SCOPE.md** | `docs/V1_SCOPE.md` | Authoritative scope boundary; MoSCoW classification |
| 5 | **README.md** | `README.md` | Project overview; setup instructions |
| 6 | Existing implementation | Repository source files | Must not be changed unless directed |
| 7 | Agent assumptions | — | Lowest priority; never silently override documents |

**Architecture Review v1.1 supersedes ARCHITECTURE.md in these sections:**
§4.3 (instrument marker description), §5.4 (parser hierarchy), §5.5 (normalization pipeline steps),
§6.1 (Pydantic schemas — `file_path` exposure, `Optional[float]` types, `depth_from_pressure` field),
§7.1 step 8 (data-array reorder), §9.1–9.8 (coordinate system, geometry, colormap, markers, vectors, animation, downsampling, disposal), §11.1 (deployment host), §12.1 (security / path exposure).

**Before reading any section of ARCHITECTURE.md, check whether v1.1 explicitly supersedes it.**

---

## 2. Before You Write a Single Line of Code

Complete all of these steps — in order — before modifying any file.

1. **Read the relevant document sections.** Identify which architecture sections apply.
2. **Check Architecture Review v1.1** for corrections to those sections.
3. **Inspect the existing implementation** for the affected component.
4. **List the files you intend to change** and confirm they are within V1 scope.
5. **Identify the relevant acceptance criteria** (VAC-01 through VAC-20 in v1.1, §15).
6. **Identify any TBD / DECISION REQUIRED items** that might block implementation (see §10).

If steps 1–6 reveal unresolved decisions that affect scientific correctness, API contracts, or coordinate transformations, stop and report before coding.

---

## 3. Non-Negotiable Architecture Rules

Violating any rule in this section constitutes an architectural defect that must be corrected before code is merged.

### 3.1 Backend

| Rule | Specification source |
|------|---------------------|
| Backend API framework is FastAPI (no Flask, no Django) | ARCHITECTURE.md §2.2 |
| Scientific data processing uses xarray and NumPy | ARCHITECTURE.md §2.2 |
| Synchronous xarray/NumPy operations **must** run in `asyncio.to_thread()` — never directly in `async` route handlers | v1.1 §C-18, §11.3 |
| Dataset IDs resolve only through the in-memory catalog; arbitrary filesystem paths are **never** accepted from API input | v1.1 §12, ARCHITECTURE.md §12.1 |
| Absolute server filesystem paths are **never** included in any public API response | v1.1 §C-04, §9 |
| `DatasetRecord.file_path` is an internal field — never serialised to an API response schema | v1.1 §9 |
| Public API schemas and internal catalog models are **separate** classes | v1.1 §9 |
| One bad file in the catalog must not crash the entire backend startup | v1.1 §11.3 |

### 3.2 Parser Architecture

Use the corrected two-level interface from Architecture Review v1.1 §4.2. Do not bypass contracts.

```
BaseParser
├── ModelParser
│   ├── get_metadata(file_path) → DatasetRecord     [internal]
│   ├── get_slice(file_path, variable, depth_idx, time_idx) → DataSlice
│   └── get_vector_slice(file_path, depth_idx, time_idx) → VectorSlice
│
└── ObservationParser
    ├── get_metadata(file_path) → ObsDatasetRecord  [internal]
    └── get_profile(file_path, instrument_id) → ProfileData
```

Registered V1 parsers: `NetCDFModelParser`, `NetCDFObsParser`, `CSVObsParser` (P1).

Do not call `get_profile()` on a `ModelParser` or `get_slice()` on an `ObservationParser`. The contract is enforced through the class hierarchy — not duck typing.

### 3.3 Data Normalization Pipeline

The operation order below is **authoritative** (Architecture Review v1.1 §6). Execute steps in this exact sequence. Do not reorder.

```
 1.  Open dataset (lazy loading)
 2.  Detect dimension names via alias table
 3.  Validate required dimensions (lat, lon) — raise ValidationError if absent
 4.  Extract variable data array
 5.  Select depth/time by index (isel); squeeze singleton dimensions
 6.  Verify lat and lon are 1D arrays — raise error if 2D (curvilinear = unsupported V1)
 7.  Mask fill values and NaN
 8.  Apply unit conversion (e.g., K → °C for temperature)
 9.  Normalize longitude to −180..+180  ← lon_sort_idx = argsort(lon_norm)
10.  Reorder data columns: values[:, lon_sort_idx]    ← MANDATORY
11.  Sort latitude ascending (South→North)  ← lat_sort_idx = argsort(lat)
12.  Reorder data rows: values[lat_sort_idx, :]       ← MANDATORY
13.  Convert pressure to approximate depth if no true depth in metres exists
14.  Stride-based downsampling (isel with stride — NOT coarsen)
15.  Compute value_min / value_max (after masking, after downsampling)
16.  Convert NaN → None for JSON serialisation
17.  Construct the API schema object
```

**Steps 10 and 12 are not optional.** Sorting a coordinate array without applying the same permutation to the data array is a data-corruption bug that produces geographic misalignment in the 3D scene.

### 3.4 Downsampling

- Method: **stride-based `isel`** selection — NOT `xarray.coarsen()`.
- `coarsen()` aggregates (averages) values and changes scientific content. Do not use it for V1 visualization downsampling.
- Maximum total grid vertices sent to the frontend: **40,000** (default `MAX_GRID_POINTS = 200 × 200`).
- Compute stride: `stride = max(1, ceil(dim_size / max_dim))` independently per axis.
- Do not silently change `MAX_GRID_POINTS` without documenting why.

### 3.5 Coordinate System and Transforms

The authoritative coordinate mapping (v1.1 §5) is:

| Axis | Scene direction | Geographic meaning |
|------|----------------|--------------------|
| X | East (+) | Longitude |
| Y | Up (+) | Depth (inverted; multiplied by VE) |
| Z | North (+) | Latitude |

The coordinate transform functions **must** live in a single shared module: `src/utils/sceneCoords.js`.
All frontend components — mesh, markers, arrow origins — call these shared functions.
**Never duplicate the geographic-to-scene formula in multiple components.**

Vertical exaggeration is a **visualization transform only**. It is applied in `toSceneY()`.  
Physical depth values in the data and API responses are **never modified** by vertical exaggeration.

### 3.6 Three.js Depth-Slice Geometry

Do NOT use `THREE.PlaneGeometry` for the depth-slice mesh (v1.1 §C-01, §4.4).  
Use `THREE.BufferGeometry` with explicit position, color, and index buffers.

Grid geometry for an M×N data grid:
- Vertices: `M × N`
- Triangles: `2 × (M−1) × (N−1)`
- Index buffer: two triangles per quad cell

**Same grid dimensions** (variable/depth/time change, same dataset): update buffers in-place; set `needsUpdate = true`.  
**Different grid dimensions** (different dataset or different downsampling result): dispose old geometry and material; call the builder function again.

Attempting to update a geometry with a mismatched vertex count produces undefined behaviour.

### 3.7 Colormap

The corrected colormap specification (v1.1 §5) is authoritative. The implementation must:

- filter `null` / `undefined` / `NaN` values **before** calling the color function — missing values never reach the color calculation
- handle `max === min` without division by zero — return the midpoint palette color
- handle `Infinity` and `-Infinity` safely
- for log scale: require `min > 0` and `value > 0`; fall back to linear with a UI warning if either condition fails
- use a mathematically correct log normalization: `t = (log(value) − log(min)) / (log(max) − log(min))`
- clamp `t` to `[0, 1]` after normalization
- do **not** use the pseudo-log formula `Math.log10(value − min + 1) / Math.log10(max − min + 1)` — it is not a standard scientific normalization

### 3.8 Current Vectors

- U = eastward velocity → mapped to scene **+X**
- V = northward velocity → mapped to scene **+Z**
- Arrow direction: `new THREE.Vector3(u_val, 0, v_val).normalize()`
- Maximum arrows rendered: **500** (increase stride if exceeded — explicit adaptive stride formula required)
- Arrow Y-position: call `toSceneY(depth_m, verticalExaggeration)` — same function used by the mesh
- `THREE.Group` is used for **visibility toggling only** — it does **not** reduce draw calls
- Each `THREE.ArrowHelper` creates two `LineSegments` → two draw calls; 500 arrows ≈ 1,000 draw calls (documented V1 limitation)
- Do NOT claim that grouping ArrowHelpers in a `THREE.Group` makes them a single draw call — this is factually incorrect
- `THREE.InstancedMesh` arrow optimization is a **post-V1** item — do not introduce it as a V1 requirement
- Before rendering, check `speed_max`: if `speed_max < 1e-10`, skip rendering entirely (avoid division-by-zero producing NaN lengths)
- Dispose `arrow.line.geometry`, `arrow.line.material`, `arrow.cone.geometry`, `arrow.cone.material` during cleanup

### 3.9 Instrument Markers

- Use **`THREE.Points` + `THREE.BufferGeometry` + `THREE.PointsMaterial`**
- One `THREE.Points` object for all Argo markers; one for all Glider markers
- **Do not create** `THREE.SphereGeometry`, individual `THREE.Mesh`, or per-marker `THREE.Object3D` instances
- Raycasting: `raycaster.params.Points.threshold` **must be set explicitly** to a value appropriate for the scene scale — the default threshold (1 unit) is almost always wrong
- Use the intersection `.index` field to look up the `instrument_id` from a parallel array

### 3.10 Animation Lifecycle

AbortController alone is **not** sufficient. A fetch that completes before `.abort()` is called will still call `dispatch()` with stale data.

The required animation pattern (v1.1 §11.4):
1. Maintain a monotonically increasing `animFrameNonce` (ref, not state)
2. At the start of each frame: increment the nonce and capture its value
3. Snapshot current params **at request time** (not from closure)
4. After awaiting the fetch, compare nonce — if nonce has advanced, discard the result
5. Schedule next frame via `setTimeout` (not `setInterval`): only after the previous frame resolves
6. Stopping animation: set `isAnimatingRef.current = false` and increment nonce

Do **not** use `setInterval` for animation fetches. Do **not** allow overlapping fetches.

### 3.11 Three.js Resource Cleanup

The `OceanCanvas` React component owns all Three.js resources and is responsible for their disposal.

On component unmount **and** on dataset switch, dispose:
- `BufferGeometry` (mesh, points, arrow line, arrow cone)
- all materials
- `OrbitControls`
- `renderer` (on unmount only — do **not** re-create the renderer on dataset switch)

Stop the animation loop (`cancelAnimationFrame`) before disposing resources.  
Do not dispose shared resources that another component still holds a reference to.

---

## 4. API Contract

The API contract defined in Architecture Review v1.1 §8 is authoritative. Do not rename endpoints or change response schemas without explicit approval.

### 4.1 Model Dataset Endpoints

| Method | Endpoint | Required query params | Response schema |
|--------|----------|-----------------------|-----------------|
| GET | `/api/v1/datasets` | — | `Array<DatasetMetadataPublic>` |
| GET | `/api/v1/datasets/{id}` | — | `DatasetMetadataPublic` |
| GET | `/api/v1/datasets/{id}/variables` | — | `Array<{name, long_name, units}>` |
| GET | `/api/v1/datasets/{id}/depths` | — | `Array<{index, depth_m, depth_from_pressure}>` |
| GET | `/api/v1/datasets/{id}/times` | — | `Array<{index, timestamp}>` |
| GET | `/api/v1/datasets/{id}/data` | `variable`, `depth_idx`, `time_idx` | `DataSlice` |
| GET | `/api/v1/datasets/{id}/vectors` | `depth_idx`, `time_idx` | `VectorSlice` |

### 4.2 Observation Endpoints

| Method | Endpoint | Response schema |
|--------|----------|-----------------|
| GET | `/api/v1/observations` | `Array<ObsDatasetSummary>` |
| GET | `/api/v1/observations/{dataset_id}/instruments` | `Array<InstrumentRecord>` |
| GET | `/api/v1/observations/{dataset_id}/instruments/{instrument_id}` | `InstrumentRecord` |
| GET | `/api/v1/observations/{dataset_id}/instruments/{instrument_id}/profile` | `ProfileData` |

### 4.3 Error Responses

All 4xx/5xx responses use:
```json
{ "error": true, "code": "DATASET_NOT_FOUND|VARIABLE_NOT_FOUND|PARSE_ERROR|VALIDATION_ERROR|NO_UV_DATA|SERVER_ERROR", "message": "...", "detail": "omit in production if it exposes internals" }
```

HTTP codes: `200` success · `404` not found in catalog · `422` invalid query params · `500` server/parse error.

### 4.4 Schema Requirements

- `DataSlice.values` and `VectorSlice.u`, `.v` must be typed `List[List[Optional[float]]]` — NOT `List[List[float]]`
- `DataSlice`, `VectorSlice`, `ProfileData`, and the depths endpoint must include `depth_from_pressure: bool`
- `DatasetMetadataPublic` must **not** contain `file_path`

---

## 5. Security Rules

| Rule |
|------|
| Dataset IDs resolve against the internal catalog only. A missing ID → 404. No filesystem path logic. |
| `DatasetRecord.file_path` is never included in any API response schema. |
| `CORSMiddleware` allows only the configured `CORS_ORIGINS` env var — not `"*"` in production. |
| All query parameters validated by Pydantic with explicit types and range guards (`ge=0` for indices). |
| Stack traces, file paths, and server configuration are **never** included in API error responses sent to clients. |
| FastAPI binds to `127.0.0.1:8000` in production (behind Nginx/Caddy). |

---

## 6. Deployment Rules

| Environment | Frontend | Backend | API base URL |
|-------------|----------|---------|--------------|
| Development | Vite dev server (port 5173) | `uvicorn --reload --host 127.0.0.1 --port 8000` | `/api` proxied via `vite.config.js` |
| Production | React static build served by Nginx | `uvicorn --host 127.0.0.1 --port 8000` | Relative `/api/v1/...` (no hostname) |

- Do **not** hardcode `localhost` or any hostname in application logic.
- `VITE_API_BASE_URL` in production = `""` (empty string — use relative URLs).
- `apiClient.js` is the single place that constructs API URLs.
- No Docker, Kubernetes, or cloud infrastructure in V1.

---

## 7. V1 Scope Boundary

Agents work **inside V1 scope only** unless the user explicitly authorises a change.

### 7.1 MUST HAVE (P0) — Target Architecture Requirements

The final client requirement explicitly requires:
- True 3D volumetric visualization of ocean model fields (Temperature, Salinity, Current vectors)
- Depth-slice visualization
- Isosurface extraction
- Time-step animation
- Argo, Glider, CTD, BGC, Mooring, HF-Radar, and ADCP observation overlays
- Clickable instruments with depth-vs-variable profile charts
- NetCDF and ASCII/delimited text ingestion
- Modular/extensible parser architecture
- OPeNDAP support
- OGC WMS/WCS compatibility
- Customizable colorbars (linear/log), layer opacity, and vertical exaggeration
- Web-based browser-native 3D visualization (Three.js/WebGL)
- REST/API-based backend

**[OBSOLETE RULE]:** Previous restrictions limiting the system to "depth slices only" or "local NetCDF files only" are OBSOLETE. The target architecture is true volumetric rendering and OPeNDAP/OGC compliant.

### 7.2 CURRENT IMPLEMENTATION (V1 Prototype Status)

The system currently has working implementations for:
- FastAPI backend & React/Vite/Three.js frontend
- Spherical Earth base & Geographic coordinate conversion
- NetCDF/CSV parsing (BaseParser architecture)
- Depth navigation & Time animation
- Current vectors (U/V arrows)
- Argo & Glider 3D markers with profile charts
- Colormap controls, opacity, and vertical exaggeration
- Multiple depth-slice approximation ("curtain walls")

### 7.3 PLANNED FUTURE / NON-REQUIRED IDEAS (Post-Delivery)

Features that are truly out of scope for the final required delivery (e.g., User Authentication, Browser UI File Upload, Mobile UI, Multi-user sessions, ML-derived products, Kubernetes).

> Do not implement a FUTURE feature simply because it appeared in an architecture discussion.

---

## 8. V1 Technical Limitations — Documented, Not Bugs

The following are known, documented V1 limitations. Do not attempt to "fix" them by introducing out-of-scope infrastructure.

| Limitation | Correct V1 behaviour |
|------------|---------------------|
| Curvilinear / 2D lat-lon grids | Raise `PARSE_ERROR` with message "Curvilinear grids not supported in V1." |
| Dateline-crossing datasets | Log a WARNING; render with visible seam. Do not raise an error. |
| Pressure-to-depth conversion | Approximation only (`depth_m ≈ pressure_dbar × 0.9804`); set `depth_from_pressure: true` in response. |
| 500 arrow limit for vectors | Documented; increase stride to stay within 500. Post-V1: InstancedMesh. |
| ~1,000 draw calls for 500 arrows | Documented GPU cost. Acceptable for V1. |
| In-memory catalog only | No database; catalog rebuilt on restart. |
| Static dataset placement | No browser upload; datasets placed in data directory by operator. |

---

## 9. Unresolved TBD Items

These items are explicitly unresolved in the approved documentation. Do not silently invent a decision.

| ID | Item | Action required |
|----|------|----------------|
| TBD-01 | Argo GDAC format version (v2.x / v3.1 / BGC-Argo) | Ask project owner before implementing Argo NetCDF parser |
| TBD-03 | `MAX_GRID_POINTS` validated against actual INCOIS dataset resolutions | Benchmark with representative datasets; use default 200×200 until confirmed |
| TBD-06 | Exact pressure-to-depth formula (latitude-dependent vs. fixed 0.9804 coefficient) | Use 0.9804 approximation until project owner provides decision |
| TBD-07 | Software licence | Do not add a licence file without project owner decision |

---

## 10. When to Stop and Ask

**Stop and report** when:
- a specification item is marked DECISION REQUIRED, TBD, or FUTURE and implementation depends on it
- two authoritative documents conflict and v1.1 does not resolve the conflict
- the required change is outside V1 scope
- the change would modify a public API contract, data schema, or coordinate transform
- the change would alter scientific normalization behaviour
- there is genuine ambiguity about which document takes precedence

**Report format when stopping:**

```
BLOCKED: [brief title]

What is unclear: ...
Which document/section: ...
Why it affects implementation: ...
Decision required: ...
```

Do not guess. Do not silently adopt a convention.

---

## 11. Coding Workflow

### Before coding
1. Read relevant architecture sections (check v1.1 first).
2. Inspect affected existing files.
3. List all files you plan to change.
4. Confirm the change is inside V1 scope.
5. Identify relevant VAC acceptance criteria.
6. Identify any TBD blockers.

### While coding
- Make the smallest coherent change that satisfies the requirement.
- Do not rewrite unrelated code.
- Do not introduce dependencies not already in the stack.
- Keep scientific transformations explicit and documented.
- Maintain strict separation: backend processes data; frontend visualises it.
- Reuse shared utilities (especially `sceneCoords.js`). Do not duplicate formulas.
- Missing values propagate through the pipeline as `None` / `null`. They never become 0.

### After coding
1. Run available backend tests: `pytest tests/ -v`
2. Run frontend lint: `npm run lint`
3. Run frontend build: `npm run build` (catch import errors early)
4. Verify affected API endpoints manually with `curl` or the OpenAPI UI.
5. Check resource cleanup if Three.js objects were changed.
6. Check for architectural violations (file_path exposure, coordinate formula duplication, etc.).
7. Identify which VAC criteria are now satisfied, partially satisfied, or unverified.

**Never claim a test passed unless you actually ran it.**

---

## 12. Acceptance Criteria Reference

VAC-01 through VAC-20 are defined in Architecture Review v1.1 §15. They are the authoritative acceptance test set.

When implementing functionality covered by a VAC criterion:
- state which VAC ID(s) apply
- implement against them
- report actual pass/fail/unverified status after your implementation

Summary reference:

| VAC | Covers |
|-----|--------|
| VAC-01 | Dataset discovery endpoint |
| VAC-02 | Metadata correctness vs. ncdump |
| VAC-03 | Variable selection triggers re-fetch |
| VAC-04 | Depth slider moves mesh Y position |
| VAC-05 | Time animation play/pause |
| VAC-06 | Data values match raw NetCDF |
| VAC-07 | Latitude-reversed datasets render correctly |
| VAC-08 | 0–360 longitude normalizes to correct domain |
| VAC-09 | Fill/missing values → transparent vertices |
| VAC-10 | Pressure-depth flag shown in response and UI |
| VAC-11 | U/V arrows — correct orientation and scaling |
| VAC-12 | **3D edge-on camera test** — mesh is a horizontal plane at depth, not a screen overlay |
| VAC-13 | Argo marker click → correct profile |
| VAC-14 | Glider marker click → correct profile |
| VAC-15 | Profile chart renders variable vs. depth |
| VAC-16 | Dataset switch mid-animation → no stale data |
| VAC-17 | GPU memory does not grow across dataset switches |
| VAC-18 | Large-grid API response ≤ 40,000 points |
| VAC-19 | 404 and 422 error codes returned correctly |
| VAC-20 | Previous mesh absent from scene after dataset switch |

**VAC-12 is the primary 3D test.** If a camera rotation does not reveal a horizontal mesh at depth — if the visualization looks like a 2D map — the primary requirement has failed.

---

## 13. Change Discipline

Agents **must not**:
- redesign the architecture without explicit approval
- replace or remove FastAPI, xarray, NumPy, React, Three.js, or Recharts without approval
- introduce a database unless explicitly directed
- change public API endpoint paths or response schemas without approval
- implement FUTURE features during V1 work
- perform unrelated refactoring alongside targeted changes
- silence a scientific warning or remove a normalization step for convenience
- modify coordinate transform logic without documenting the reason and affected VAC

---

## 14. Task Report Format

After completing any implementation task, provide a report in this format:

```
### Changes
[Files changed and what was implemented — be specific]

### Architecture Compliance
[Architecture rules observed — reference AGENTS.md sections or v1.1 issue IDs]

### Validation
[Tests run, lint results, build results, API checks, VAC criteria verified]
[Be explicit: "pytest passed 12/12", "VAC-06 verified manually", "VAC-12 unverified — needs browser"]

### Remaining Issues
[Known failures, unverified items, TBD decisions blocking further work, decisions required from project owner]
```

Be honest. Do not mark items as verified if they were only visually inspected.

---

## 15. Key File Locations (Expected Structure)

```
SIH26/
├── AGENTS.md                  ← this file
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SRS.md
│   └── V1_SCOPE.md
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── datasets.py        ← /api/v1/datasets router
│   │   └── observations.py    ← /api/v1/observations router
│   ├── services/
│   │   ├── catalog_service.py
│   │   ├── dataset_service.py
│   │   └── observation_service.py
│   ├── parsers/
│   │   ├── base_parser.py     ← BaseParser, ModelParser, ObservationParser
│   │   ├── registry.py
│   │   ├── netcdf_model_parser.py
│   │   ├── netcdf_obs_parser.py
│   │   └── csv_obs_parser.py  ← P1
│   ├── normalizers/
│   │   └── data_normalizer.py ← 17-step pipeline from v1.1 §6
│   ├── validators/
│   │   └── data_validator.py
│   ├── models/
│   │   └── schemas.py         ← public API schemas only; internal models separate
│   ├── cache/
│   │   └── slice_cache.py     ← namespaced: slice:, vector:, profile:
│   ├── data/
│   │   ├── models/
│   │   └── observations/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── apiClient.js   ← single source of API URL construction
    │   ├── utils/
    │   │   └── sceneCoords.js ← single source of coordinate transforms
    │   ├── components/
    │   │   ├── OceanCanvas/   ← Three.js scene owner + cleanup
    │   │   ├── ControlPanel/
    │   │   ├── ColormapWidget/
    │   │   ├── ProfilePanel/
    │   │   ├── InstrumentPanel/
    │   │   ├── DatasetSelector/
    │   │   └── StatusBar/
    │   ├── context/
    │   │   └── AppContext.jsx  ← React Context + useReducer state
    │   ├── hooks/
    │   │   └── useAnimation.js ← animation lifecycle with nonce pattern
    │   └── utils/
    │       └── colormap.js     ← corrected colormap implementation
    ├── vite.config.js          ← /api proxy to 127.0.0.1:8000
    └── .env.example
```

---

*This document was established after the completion of all four foundational project documentation files and the Architecture Review v1.1. It is the operational ruleset for all coding agents working on the 3D Ocean Data Visualization System for INCOIS.*
