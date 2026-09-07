# Software Requirements Specification (SRS)

## 3D Ocean Data Visualization System for INCOIS

| Field        | Value                                                      |
|--------------|------------------------------------------------------------|
| Document ID  | SRS-INCOIS-3DVIZ-001                                       |
| Version      | 2.0                                                        |
| Status       | Target SRS for Final Client Delivery                       |
| Prepared For | INCOIS / SIH 2026 Project Team                             |
| Date         | 2026-08-31                                                 |

> **NOTE (August 2026):** This document has been updated to reflect the Final INCOIS Client Requirements. Previous restrictions preventing volumetric rendering and limiting the system to V1 constraints are now OBSOLETE.

---

## Table of Contents

1. Introduction
2. Product Overview
3. Stakeholders
4. Functional Requirements
5. Non-Functional Requirements
6. User Stories
7. Use Cases
8. Data Requirements
9. UI Requirements
10. Integration Requirements
11. Acceptance Criteria
12. Out of Scope
13. Acronyms
14. Dataset Links

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for Version 1 (V1) of the **3D Ocean Data Visualization System** developed for the Indian National Centre for Ocean Information Services (INCOIS).

The document serves as the authoritative reference for all design, development, testing, and validation activities. It is written to be actionable by both human developers and AI coding agents.

### 1.2 Scope

This SRS covers the V1 web-based application that:

- Ingests ocean model output datasets (NetCDF, delimited text/ASCII)
- Visualizes ocean state variables (temperature, salinity, current vectors, chlorophyll) in an interactive browser-based 3D environment
- Displays observational instrument data (Argo profiling floats and Underwater Gliders) as georeferenced markers
- Allows users to inspect depth-resolved observational profiles from selected instruments
- Provides interactive controls for variable selection, depth navigation, time navigation, colorbar customization, and vertical exaggeration

This SRS does **not** cover features explicitly listed in Section 12 (Out of Scope).

### 1.3 Intended Audience

| Audience                  | Purpose                                                         |
|---------------------------|-----------------------------------------------------------------|
| Project Developers        | Implementation reference                                        |
| AI Coding Agent           | Machine-actionable specification for code generation            |
| INCOIS Technical Staff    | Validation of requirements alignment                            |
| QA / Testers              | Basis for test case design                                      |
| Project Managers          | Scope control and milestone planning                            |
| Future Maintainers        | Understanding system design intent                              |

### 1.4 Definitions and Terminology

| Term                       | Definition                                                                                                   |
|----------------------------|--------------------------------------------------------------------------------------------------------------|
| Ocean Model Output         | Gridded numerical model data representing ocean state variables at defined spatial/temporal resolution        |
| 3D Ocean Scene             | An interactive WebGL scene in the browser in which the ocean domain is rendered in three dimensions, allowing the user to rotate, zoom, and pan the camera, navigate depth levels, and observe time animation |
| Depth Slice                | A 2D horizontal cross-section of a 3D variable at a specific depth level. **A depth slice is rendered as a colored mesh positioned at the correct depth within the 3D ocean scene.** |
| 3D Visualization           | The primary visualization mode: rendering interactive 3D volumetric fields, depth slices, isosurfaces, and instrument overlays. |
| Full Volumetric Rendering  | An advanced visualization mode in which the entire 3D scalar field volume is rendered simultaneously with transparency/opacity transfer functions. Required by Final Client Mandate. |
| Isosurface                 | A 3D surface connecting all points in a scalar field sharing a common value. Required by Final Client Mandate. |
| Profile                    | A vertical series of measurements at a single geographic location, varying with depth. Displayed as a **2D chart** (variable vs. depth) in the instrument profile panel. This 2D chart is a supplementary panel and does not replace the primary 3D visualization. |
| Argo Float                 | An autonomous profiling float that measures T/S/depth profiles from surface to ~2000 m                       |
| Glider                     | An autonomous underwater vehicle that profiles ocean variables along a transect path                         |
| Variable                   | A named measurable quantity in a dataset (e.g., temperature, salinity)                                        |
| Time Step                  | A single instant in model time for which model output is available                                            |
| Depth Level                | A discrete depth coordinate in the model grid                                                                 |
| Vertical Exaggeration      | A user-controlled multiplicative factor applied to the depth axis in the 3D scene so that ocean depth structure is visually amplified. Horizontal lat/lon positions are not affected. Compulsory for V1 per project requirements. |
| Colorbar                   | A visual legend mapping variable values to display colors                                                     |
| Color Palette              | A named set of colors used to represent a continuous scalar range                                             |
| Normalized Data            | Data converted from raw dataset format into the system's internal representation                             |
| REST API                   | Representational State Transfer Application Programming Interface                                             |
| CF Conventions             | Climate and Forecast metadata conventions for NetCDF datasets                                                 |
| V1                         | Version 1 of the system — the first working, demonstrable prototype                                          |
| P0                         | Mandatory for V1 — system is incomplete without this                                                         |
| P1                         | Important for V1 — should be present in all but exceptional circumstances                                    |
| P2                         | Nice to have — can be deferred if time is constrained; must not block V1 completion                          |
| FUTURE                     | Not part of V1 — must not block V1 completion                                                                |

---

## 2. Product Overview

### 2.1 Background

India's Exclusive Economic Zone (EEZ) encompasses approximately 2.37 million km² of ocean area. INCOIS continuously generates high-resolution ocean model outputs covering temperature, salinity, current vectors, chlorophyll, and other three-dimensional ocean state variables. Simultaneously, INCOIS receives real-time and delayed-mode observational data from Argo profiling floats and underwater gliders operating in the Indian Ocean region.

These datasets are scientifically valuable but presently distributed across multiple software systems that are either desktop-bound, limited to 2D views, or incapable of simultaneously rendering model fields and in-situ observations.

### 2.2 Problem Statement

There is no integrated web-based platform that allows operational oceanographers and forecasters to simultaneously:

1. Visualize 3D ocean model fields in a browser without installing specialized scientific software
2. View georeferenced observational data from Argo floats and gliders alongside model fields
3. Inspect depth-resolved observational profiles correlated with model output
4. Navigate across depth levels and time steps interactively
5. Customize color scaling and visualization parameters

The absence of such a platform forces oceanographers to switch between multiple tools, increasing operational overhead and reducing the speed of scientific analysis.

### 2.3 Proposed Solution

Develop a browser-native, web-based 3D Ocean Data Visualization System that:

- Runs entirely in a modern web browser (no desktop installation required)
- Provides a REST API backend that ingests and normalizes multi-format scientific datasets
- Renders ocean model variables as interactive 3D depth-sliced visualizations using WebGL
- Overlays georeferenced Argo and Glider instrument markers on the 3D scene
- Displays depth-resolved observational profiles in a sidebar panel
- Provides full interactive controls for variable selection, depth, time, colorbar, and opacity
- Is modular enough to extend to additional instruments and variables without rewriting core components

### 2.4 Goals

1. Deliver a working V1 prototype suitable for demonstration and scientific evaluation
2. Establish an extensible architecture that future development can build upon
3. Eliminate the need for desktop scientific visualization tools for basic operational analysis
4. Support both operational oceanographic workflows and public science communication

### 2.5 Objectives

- Implement 3D depth-slice visualization of at least temperature and salinity from NetCDF model output in V1
- Implement Argo and Glider instrument overlay with interactive profile inspection in V1
- Implement variable selector, depth navigator, time navigator, and colorbar controls in V1
- Design backend with modular adapters so future data sources can be added with minimal core changes
- Ensure the system runs acceptably in modern Chrome, Firefox, and Edge browsers

---

## 3. Stakeholders

### 3.1 Primary Users (Operational)

| Stakeholder                 | Role                                                    | Primary Interaction                                      |
|-----------------------------|---------------------------------------------------------|----------------------------------------------------------|
| Ocean Forecasters           | Use model output to produce ocean forecasts             | Variable selection, time navigation, depth navigation    |
| Physical Oceanographers     | Research spatial patterns in model and observed data    | 3D visualization, profile inspection, correlation        |
| Data Analysts               | Quality control and validation of model vs. observation | Profile comparison, colorbar control, data export (FUTURE)|
| INCOIS Technical Staff      | Maintain and extend the platform                        | Dataset upload, configuration, administration            |

### 3.2 Secondary Users (Outreach)

| Stakeholder                 | Role                                                    | Primary Interaction                                      |
|-----------------------------|---------------------------------------------------------|----------------------------------------------------------|
| Students / Researchers      | Learn about ocean structure using visualizations        | Basic 3D visualization, profile viewing                  |
| Teachers / Educators        | Use as teaching aid for oceanography concepts           | Basic visualization, color scale understanding           |
| General Public              | Awareness of ocean data through accessible visuals      | Browse ocean scenes, observe color-coded data            |
| Policymakers                | Informed by ocean state during briefings                | Overview visualization with labeled variables            |

### 3.3 System Stakeholders

| Stakeholder                 | Role                                                    |
|-----------------------------|---------------------------------------------------------|
| INCOIS Institution          | System owner and primary deployer                       |
| Development Team / Agent    | Implements and maintains the system                     |
| QA Team                     | Validates requirements against implementation           |

---

## 4. Functional Requirements

> Every requirement is assigned a unique ID, a priority level (P0/P1/P2/FUTURE), and measurable acceptance criteria.

> **CRITICAL 3D REQUIREMENT NOTICE:** The V1 system is a **genuine interactive 3D WebGL visualization application**. The primary ocean model visualization is a 3D ocean scene (Three.js + WebGL) with full camera controls (rotate, zoom, pan), depth-positioned layers, vertical exaggeration, instrument overlays, and time animation. The term "depth slice" describes the shape of the model data cross-section (a horizontal plane at a given depth) — it does NOT mean the application is 2D. A depth slice is rendered **inside** the 3D scene at the correct depth coordinate. The distinction between V1 visualization modes is:
> - **3D interactive depth-slice visualization** — MUST HAVE in V1 (P0): colored mesh planes rendered at depth within the 3D scene
> - **Current vector overlay in the 3D scene** — MUST HAVE in V1 (P0): U/V arrows positioned in 3D space on the depth-slice plane
> - **Full volumetric rendering** (entire 3D field with transparency transfer functions) — Advanced/Future capability, NOT required for V1
> - **Isosurface extraction and rendering** — P2/COULD HAVE; must not block V1 completion
> - **2D instrument profile chart** — supplementary panel only; main visualization remains 3D

---

### FR-001 — Dataset Loading

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-001                                                                                   |
| **Name**           | Dataset Loading                                                                          |
| **Priority**       | P0                                                                                       |
| **Description**    | The backend must accept and load ocean model datasets stored on the server filesystem. For V1, dataset files are pre-placed in the designated data directory. The system must parse NetCDF model files (P0). Delimited text/ASCII is a secondary format for model data (P1 — parse if encountered, but not a V1 blocker). Observation data CSV/ASCII ingestion is also P1. |
| **Preconditions**  | Dataset file exists at the configured data directory path. File is a valid NetCDF file or valid delimited text. |
| **Expected Behavior** | When the frontend requests the dataset list, the backend scans the data directory, identifies valid dataset files, extracts metadata (variable names, depth levels, time steps, spatial extent), and returns a structured catalog response. |
| **Acceptance Criteria** | AC-001-1: Backend returns a list of available datasets with metadata when `GET /api/v1/datasets` is called. AC-001-2: A valid NetCDF file placed in the data directory appears in the dataset list. AC-001-3: A valid CSV/ASCII observation file placed in the observations directory appears in the observation list. AC-001-4: Invalid or corrupted files do not crash the backend; an error entry is logged and the file is skipped. |

---

### FR-002 — Interactive 3D Depth-Slice Visualization

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-002                                                                                   |
| **Name**           | Interactive 3D Depth-Slice Visualization of Ocean Model Variables                        |
| **Priority**       | P0                                                                                       |
| **Description**    | The system must render selected ocean model variables (temperature, salinity, and any other scalar variable present in the dataset) as color-mapped horizontal mesh layers positioned at the correct depth within an **interactive 3D WebGL ocean scene**. The depth-slice layer is a 3D object in the scene — it occupies a position on the depth axis, can be viewed from any camera angle, and moves along the depth axis as the user navigates. This is a **3D visualization**, not a standalone 2D map. The primary visualization technology is Three.js WebGL. Do NOT implement this as a flat 2D map; the scene must be a true 3D environment with camera rotation, zoom, and pan. |
| **Preconditions**  | A dataset has been loaded (FR-001). The user has selected a variable and a depth level. The 3D WebGL scene (FR-012) is initialized. |
| **Expected Behavior** | The backend extracts the scalar field for the selected variable, depth level, and time step, returning a grid of (lat, lon, value) data points. The frontend constructs a `THREE.PlaneGeometry` mesh with vertex colors derived from the active colormap. The mesh is positioned at the correct depth coordinate in 3D scene space (Y-axis, scaled by vertical exaggeration factor from FR-011). The user can rotate, zoom, and pan around the mesh using the 3D camera (FR-012). The depth-slice mesh updates when the user changes variable, depth level, or time step. Missing/NaN values are rendered as transparent vertices. |
| **Acceptance Criteria** | AC-002-1: Temperature and salinity depth slices are rendered as 3D objects in the WebGL scene for at least one NetCDF model dataset. AC-002-2: The rendered mesh occupies the correct geographic lat/lon bounding box within the 3D scene. AC-002-3: Vertex colors correspond to variable values as defined by the active colorbar palette. AC-002-4: Rotating the camera (FR-012) reveals the mesh from oblique and side angles — confirming it exists in 3D space. AC-002-5: Visualization updates when depth level or time step is changed. AC-002-6: The depth-slice mesh is NOT rendered as a separate 2D map; it is an object inside the Three.js scene. |

---

### FR-003 — Variable Selection

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-003                                                                                   |
| **Name**           | Model Variable Selection                                                                 |
| **Priority**       | P0                                                                                       |
| **Description**    | The user must be able to select which ocean model variable is displayed in the 3D scene from the list of variables available in the loaded dataset. |
| **Preconditions**  | A dataset is loaded with at least one scalar variable. |
| **Expected Behavior** | A dropdown or selector in the UI lists available variables by name. On selection, the visualization updates to show the newly selected variable. The colorbar updates to reflect the new variable's value range. |
| **Acceptance Criteria** | AC-003-1: All variables present in the loaded NetCDF dataset are listed in the variable selector. AC-003-2: Switching variable updates the rendered scene without requiring a page reload. AC-003-3: The colorbar min/max updates to reflect the selected variable's data range. |

---

### FR-004 — Depth Navigation

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-004                                                                                   |
| **Name**           | Depth Level Navigation                                                                   |
| **Priority**       | P0                                                                                       |
| **Description**    | The user must be able to navigate through available depth levels in the dataset and update the visualization to show the selected depth level. |
| **Preconditions**  | A dataset with multiple depth levels is loaded. |
| **Expected Behavior** | A depth selector (slider or dropdown) displays available depth levels in **meters** (the backend converts pressure/dbar to meters before delivering data; the frontend always receives and displays meters). Selecting a depth level requests the corresponding data slice from the backend and re-renders the visualization. The current depth is always displayed in the UI with the unit label "m". |
| **Acceptance Criteria** | AC-004-1: All available depth levels are presented in the depth control. AC-004-2: Selecting a depth level updates the 3D scene with the correct data slice. AC-004-3: The currently displayed depth value is shown clearly in the UI. |

---

### FR-005 — Time Navigation

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-005                                                                                   |
| **Name**           | Time Step Navigation                                                                     |
| **Priority**       | P0                                                                                       |
| **Description**    | The user must be able to navigate between model time steps and animate the visualization forward through time. |
| **Preconditions**  | A dataset with multiple time steps is loaded. |
| **Expected Behavior** | A time control panel shows available time steps. The user can select a specific time step, step forward/backward, or play an automatic animation. The current timestamp is clearly displayed. Animation speed is configurable. |
| **Acceptance Criteria** | AC-005-1: All available time steps from the dataset are listed or accessible via slider. AC-005-2: Play/Pause button starts and stops time animation. AC-005-3: Forward/Backward step buttons advance or retreat by one time step. AC-005-4: The displayed timestamp matches the currently rendered time step. AC-005-5 (P1): Animation speed can be adjusted by the user (user-adjustable speed control is SHOULD HAVE / P1 — the core play/pause/step navigation is P0). |

---

### FR-006 — Current Vector Visualization

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-006                                                                                   |
| **Name**           | Current Vector (U/V) Visualization in 3D Scene                                           |
| **Priority**       | **P0** *(promoted from P1 — current vectors are explicitly listed as a core project requirement)* |
| **Description**    | When u and v current component variables are present in the loaded dataset, the system must visualize them as directional arrows positioned in the 3D scene on the depth-slice plane. Current vectors are an explicit part of the project's required 3D ocean variable visualization alongside temperature and salinity. |
| **Preconditions**  | Dataset contains u and v current component variables that have been positively identified as geographic eastward/northward velocity (see U/V detection rules in §8.1). The 3D scene (FR-002, FR-012) is initialized. |
| **Expected Behavior** | The backend extracts u and v component grids for the selected depth level and time step. The frontend renders `THREE.ArrowHelper` instances (or equivalent) at a subsampled set of grid points within the 3D scene, positioned on the same horizontal plane as the depth-slice mesh. Arrow direction encodes current flow direction in geographic coordinates (u = eastward/+X, v = northward/+Z in scene coordinates) — **this interpretation is valid only when the variables are confirmed as geographic eastward/northward velocity components**. Arrow length encodes current speed magnitude, scaled relative to the maximum speed in the slice. Arrow density is configurable (every Nth grid point) to avoid visual clutter. The vector layer can be toggled on/off independently of the scalar color layer. If u/v speed_max is zero or all values are masked, the vector layer is left empty without error. |
| **Acceptance Criteria** | AC-006-1: If u and v variables are present in the dataset, a "Current Vectors" toggle appears in the layer controls and is enabled by default. AC-006-2: Vector arrows are rendered with correct geographic orientation (u = eastward, v = northward). AC-006-3: Arrow length visually reflects current speed relative to the maximum in the slice. AC-006-4: If u/v variables are absent from the dataset, the vector toggle is hidden or disabled without causing an error. AC-006-5: Current vector arrows are visible in the 3D scene and rotate with the camera (they are 3D objects, not screen-space overlays). |

---

### FR-007 — Instrument Data Overlay

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-007                                                                                   |
| **Name**           | Instrument Overlay (Argo / Glider)                                                       |
| **Priority**       | P0                                                                                       |
| **Description**    | The system must display Argo float and Glider instrument positions as georeferenced markers in the 3D scene, overlaid on the model visualization. |
| **Preconditions**  | An observation dataset (Argo or Glider) is available on the backend. The instrument overlay is toggled on. |
| **Expected Behavior** | Instrument positions (lat/lon) are displayed as 3D markers (e.g., colored points or icons) at the ocean surface or at their last known position. Marker appearance distinguishes Argo floats from gliders. Markers are positioned at geographically accurate lat/lon coordinates. |
| **Acceptance Criteria** | AC-007-1: Argo float positions appear as markers in the 3D scene when data is loaded. AC-007-2: Glider positions appear as distinctly styled markers. AC-007-3: Markers are positioned at correct lat/lon within the visible ocean domain. AC-007-4: A toggle control shows/hides the instrument layer. AC-007-5: Instrument markers that fall outside the model dataset's bounding box are still rendered at their correct geographic position in scene space (the user can pan the camera to see them); no error is raised. |

---

### FR-008 — Instrument Selection and Profile View

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-008                                                                                   |
| **Name**           | Instrument Selection and Depth Profile Inspection                                        |
| **Priority**       | P0                                                                                       |
| **Description**    | The user must be able to click on an instrument marker and view its observational depth profile in a dedicated panel. |
| **Preconditions**  | Instrument markers are displayed (FR-007). User clicks on a marker. |
| **Expected Behavior** | Clicking an instrument marker opens a profile panel. The panel shows a 2D chart of a selected variable (e.g., temperature) plotted against depth. The user can switch the profile variable (e.g., between temperature, salinity, chlorophyll where available). The panel displays the instrument ID, type, location, and date of measurement. |
| **Acceptance Criteria** | AC-008-1: Clicking an Argo float marker opens the profile panel with its data. AC-008-2: The profile chart correctly plots variable value vs. depth (depth on Y-axis, increasing downward). AC-008-3: Profile variable can be changed within the panel. AC-008-4: Instrument metadata (ID, type, lat, lon, date) is displayed. AC-008-5: The profile panel can be closed. |

---

### FR-009 — Colorbar Controls

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-009                                                                                   |
| **Name**           | Colorbar Customization                                                                   |
| **Priority**       | P0                                                                                       |
| **Description**    | The system must display a colorbar showing the mapping between color and variable values, and allow the user to customize the color palette, value range, and scale type. |
| **Preconditions**  | A model variable is being visualized. |
| **Expected Behavior** | A colorbar widget shows the current color palette with labeled min and max values. The user can select from a set of predefined color palettes (e.g., viridis, plasma, coolwarm, jet). The user can manually set minimum and maximum values. The user can toggle between linear and logarithmic scale for variables where log scale is appropriate. The 3D visualization updates immediately when colorbar settings change. |
| **Acceptance Criteria** | AC-009-1: Colorbar is visible whenever a model variable is displayed. AC-009-2: At least 4 named color palettes are available for selection. AC-009-3: User-specified min/max values are applied to the color mapping and reflected in the visualization. AC-009-4: Log scale toggle is available and functional for applicable variables. AC-009-5: The colorbar updates without requiring a full data reload. |

---

### FR-010 — Layer Opacity Control

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-010                                                                                   |
| **Name**           | Layer Opacity Control                                                                    |
| **Priority**       | P1                                                                                       |
| **Description**    | The user must be able to control the opacity of the model visualization layer to allow visual comparison with instrument overlays beneath or above it. |
| **Preconditions**  | A model layer is displayed. |
| **Expected Behavior** | A slider in the layer controls panel adjusts the opacity of the active model layer from 0% (transparent) to 100% (fully opaque). Changes apply in real time without reloading data. |
| **Acceptance Criteria** | AC-010-1: A slider is present in the UI for opacity control. AC-010-2: Moving the slider from 100% to 0% makes the model layer transparent. AC-010-3: Instrument markers remain visible at all model layer opacity levels. |

---

### FR-011 — Vertical Exaggeration

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-011                                                                                   |
| **Name**           | Vertical Exaggeration of the 3D Ocean Scene                                              |
| **Priority**       | **P0** *(promoted from P1 — vertical exaggeration is explicitly required by the project description as part of the expected 3D solution)* |
| **Description**    | The user must be able to apply a vertical exaggeration factor to the 3D ocean scene so that depth structure is visually amplified. Without vertical exaggeration, the ocean's depth (~3000–5000 m typical) is negligible compared to the horizontal extent (hundreds to thousands of km), making depth structure invisible. Vertical exaggeration is a scientifically standard technique for visualizing ocean data and is compulsory for this system. |
| **Preconditions**  | The 3D ocean scene (FR-002, FR-012) is initialized with at least one depth level. |
| **Expected Behavior** | A slider or numerical input allows the user to set a vertical exaggeration factor (e.g., 1× to 100×). Increasing the factor expands the depth axis (Y-axis in scene coordinates) relative to the horizontal axes (X = longitude, Z = latitude) in the 3D scene. Geographic lat/lon positions of all rendered elements (depth slices, instrument markers, current vectors) are NOT altered by the exaggeration. The factor applies uniformly to all depth-positioned elements in the scene so that relative depth relationships between elements are preserved. The current exaggeration factor is displayed numerically. When the exaggeration factor changes, the scene updates immediately without re-fetching data from the backend. |
| **Acceptance Criteria** | AC-011-1: A vertical exaggeration slider or input control is present in the UI. AC-011-2: Setting exaggeration to 1× renders the scene with true geographic proportions (depth negligible vs. horizontal). AC-011-3: Increasing the exaggeration factor visually expands the depth axis, making depth-level separations clearly visible. AC-011-4: Horizontal geographic lat/lon positions of all scene elements remain correct and unchanged at any exaggeration level. AC-011-5: The exaggeration applies to the depth-slice mesh, current vector arrows, and instrument marker depth positions simultaneously. AC-011-6: The current exaggeration value is displayed in the UI. |

---

### FR-012 — 3D Camera Controls

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-012                                                                                   |
| **Name**           | Interactive 3D Camera Controls                                                           |
| **Priority**       | P0                                                                                       |
| **Description**    | The user must be able to rotate, pan, and zoom the 3D ocean scene using standard mouse/touch interactions. |
| **Preconditions**  | The 3D visualization canvas is rendered. |
| **Expected Behavior** | Left-click drag: rotates the scene around the center. Right-click drag or scroll: zooms in/out. Middle-click drag or two-finger drag: pans the scene. A "Reset Camera" button returns the view to the default orientation. |
| **Acceptance Criteria** | AC-012-1: Mouse drag rotates the 3D view. AC-012-2: Scroll wheel zooms in and out. AC-012-3: Pan gesture moves the view laterally. AC-012-4: A reset camera control restores the default view. |

---

### FR-013 — Dataset Validation and Error Handling

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-013                                                                                   |
| **Name**           | Dataset Validation and Error Handling                                                    |
| **Priority**       | P0                                                                                       |
| **Description**    | The backend must validate ingested datasets and return structured error responses when datasets are missing, corrupted, or in unsupported formats. The frontend must display informative error messages. |
| **Preconditions**  | A dataset file has been submitted for loading. |
| **Expected Behavior** | If a file cannot be parsed (corrupted, wrong format, missing required dimensions), the backend logs the error and returns a structured JSON error response. The frontend displays an appropriate error message indicating the nature of the problem. The system does not crash or enter an undefined state on invalid input. |
| **Acceptance Criteria** | AC-013-1: Corrupted NetCDF files produce a JSON error response, not a server crash. AC-013-2: Missing required coordinate dimensions (lat/lon) produce a descriptive error. AC-013-3: The frontend displays the error message to the user. AC-013-4: The system remains usable after an error (other datasets can still be loaded). |

---

### FR-014 — Isosurface Visualization

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-014                                                                                   |
| **Name**           | Isosurface Extraction and Rendering                                                      |
| **Priority**       | P2 — COULD HAVE (must not block V1 completion)                                           |
| **Description**    | The system should allow the user to extract and render an isosurface for a selected variable threshold value, showing the 3D surface where that value occurs throughout the water column. This is an advanced 3D visualization capability that builds upon the primary depth-slice visualization (FR-002). **Isosurface rendering must not be confused with full volumetric rendering.** An isosurface is a single surface at one threshold value; full volumetric rendering would show the entire scalar field with transparency, which is a separate and more advanced future capability. |
| **Preconditions**  | A model dataset with at least 3 depth levels is loaded. The P0/P1 core V1 features are complete. |
| **Expected Behavior** | The user specifies a target variable value (threshold). The backend, using multiple depth-level slices, computes the approximate isosurface geometry (e.g., via marching squares/cubes or interpolation). The frontend renders the resulting 3D surface mesh within the 3D ocean scene. The isosurface can be toggled on/off independently. |
| **Acceptance Criteria** | AC-014-1: An isosurface threshold input is available in the UI (implemented only if P0/P1 are complete). AC-014-2: The rendered isosurface surface is visible in the 3D scene at positions consistent with the threshold value in the data. AC-014-3: Isosurface can be toggled on and off. |

> **Note:** FR-014 is P2/COULD HAVE. It is explicitly part of the project requirements as a 3D visualization capability but must not delay delivery of P0 and P1 features. Full volumetric rendering with transparency transfer functions is a separate FUTURE capability beyond the isosurface.

---

### FR-015 — Status and Information Display

| Field              | Value                                                                                    |
|--------------------|------------------------------------------------------------------------------------------|
| **ID**             | FR-015                                                                                   |
| **Name**           | System Status and Metadata Display                                                       |
| **Priority**       | **P0** *(elevated from P1 — the status display is minimal-cost and scientifically essential; without it, users cannot confirm which variable/depth/time is displayed)* |
| **Description**    | The UI must display the currently loaded dataset name, active variable, active depth, active time step, and system loading status at all times. |
| **Preconditions**  | Any dataset has been loaded. |
| **Expected Behavior** | A status bar or header area shows: active dataset name, selected variable, current depth level in meters, current timestamp, and a loading indicator when data is being fetched. |
| **Acceptance Criteria** | AC-015-1: Active dataset name is visible in the UI after loading. AC-015-2: Active variable, depth (in meters), and time are displayed. AC-015-3: A visual loading indicator is shown when the system is fetching or processing data. AC-015-4: The indicator disappears when loading is complete. |

---

## 5. Non-Functional Requirements

### NFR-001 — Browser Compatibility

| Field        | Value                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------|
| **ID**       | NFR-001                                                                                       |
| **Name**     | Browser Compatibility                                                                         |
| **Priority** | P0                                                                                            |
| **Requirement** | The application must function correctly in the latest stable releases of Google Chrome, Mozilla Firefox, and Microsoft Edge. WebGL 1.0 support is the minimum browser requirement for 3D rendering. |
| **Rationale**  | Operational users will use standard government/institutional desktop browsers.               |
| **Verification** | Manual testing on each browser after V1 implementation. |

### NFR-002 — Performance

| Field        | Value                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------|
| **ID**       | NFR-002                                                                                       |
| **Name**     | Visualization Performance                                                                     |
| **Priority** | P0                                                                                            |
| **Requirement** | The system must minimize unnecessary data transfer between backend and frontend. The backend must return only the requested subset of data (single variable, single depth level, single time step) rather than the entire NetCDF file. The frontend must maintain a frame rate adequate for smooth interaction. Target frame rate is TBD based on hardware; the system must not cause the browser tab to freeze during normal operations. |
| **Rationale**  | NetCDF files may be large (100s of MB to GB). Sending full files to the browser would be impractical. |
| **Verification** | Load testing with representative dataset sizes. Browser DevTools performance profiling. |

### NFR-003 — Scalability

| Field        | Value                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------|
| **ID**       | NFR-003                                                                                       |
| **Name**     | Data Scalability                                                                              |
| **Priority** | P1                                                                                            |
| **Requirement** | The backend architecture must support future addition of larger datasets, additional variables, and additional observation sources without rewriting the core API or visualization pipeline. Number of concurrent users in V1 is TBD pending deployment decisions. |
| **Rationale**  | V1 is a prototype; the architecture must support growth.                                    |
| **Verification** | Architecture review; code-level modularity assessment. |

### NFR-004 — Usability

| Field        | Value                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------|
| **ID**       | NFR-004                                                                                       |
| **Name**     | Usability                                                                                     |
| **Priority** | P1                                                                                            |
| **Requirement** | A user with ocean science domain knowledge but no programming experience must be able to load a dataset, select a variable, navigate depth and time, and view an instrument profile without reading a manual. UI labels must use clear oceanographic terminology. |
| **Rationale**  | Operational oceanographers are domain experts, not necessarily software specialists.        |
| **Verification** | Usability review with at least one domain expert tester after V1 delivery. |

### NFR-005 — Maintainability

| Field        | Value                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------|
| **ID**       | NFR-005                                                                                       |
| **Name**     | Code Maintainability                                                                          |
| **Priority** | P1                                                                                            |
| **Requirement** | Backend source code must be organized into clearly separated modules: API layer, data-processing layer, parser modules, and normalization modules. Frontend source code must be organized into clearly separated React components. A new data parser can be added without modifying any existing parser or API route. |
| **Rationale**  | The system will be extended by future developers and agents.                                |
| **Verification** | Code review against module boundaries. |

### NFR-006 — Reliability

| Field        | Value                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------|
| **ID**       | NFR-006                                                                                       |
| **Name**     | Reliability                                                                                   |
| **Priority** | P1                                                                                            |
| **Requirement** | The backend must handle missing variables in a dataset gracefully without crashing. Variables not present in a dataset must simply be excluded from the variable list rather than causing errors. Invalid API requests must return structured error responses. |
| **Rationale**  | Not every dataset contains every variable.                                                  |
| **Verification** | Test with datasets that have missing variables. Test with invalid API calls. |

### NFR-007 — Security

| Field        | Value                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------|
| **ID**       | NFR-007                                                                                       |
| **Name**     | Basic Security                                                                                |
| **Priority** | P1                                                                                            |
| **Requirement** | The backend API must not allow arbitrary filesystem access (no path traversal). Dataset identifiers must be validated against an allowed list. CORS must be configured to allow only the frontend origin. No authentication system is required in V1 for internal use, but the architecture must not prevent authentication from being added later. |
| **Rationale**  | V1 is a prototype but should not introduce obvious security vulnerabilities.                |
| **Verification** | Path traversal test cases. CORS header inspection. |

### NFR-008 — Accessibility

| Field        | Value                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------|
| **ID**       | NFR-008                                                                                       |
| **Name**     | Accessibility                                                                                 |
| **Priority** | P2                                                                                            |
| **Requirement** | UI text elements must have sufficient color contrast. Interactive controls must have accessible labels. Full WCAG 2.1 compliance is a FUTURE requirement; V1 must not deliberately block accessibility improvements. |
| **Rationale**  | Inclusive design supports broader outreach goals.                                           |
| **Verification** | WCAG contrast check on UI controls. |

### NFR-009 — Data Integrity

| Field        | Value                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------|
| **ID**       | NFR-009                                                                                       |
| **Name**     | Data Integrity                                                                                |
| **Priority** | P0                                                                                            |
| **Requirement** | The data pipeline must not alter scientific values during parsing, normalization, or transmission. Missing data values (e.g., NaN, fill values as defined in CF conventions) must be preserved and handled appropriately in the visualization (e.g., rendered transparent or masked). |
| **Rationale**  | Incorrect data values would undermine scientific credibility of the system.                 |
| **Verification** | Verify a known data value from raw NetCDF appears correctly in the rendered visualization. |

### NFR-010 — Extensibility

| Field        | Value                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------|
| **ID**       | NFR-010                                                                                       |
| **Name**     | Extensibility                                                                                 |
| **Priority** | P1                                                                                            |
| **Requirement** | Adding a new instrument adapter (e.g., CTD, Mooring) must require only: (1) creating a new parser module, (2) registering it in the parser registry, and (3) no changes to the core API, frontend visualization engine, or other existing parsers. Similarly, new model variables must be automatically available once present in the dataset, without code changes. |
| **Rationale**  | INCOIS will integrate additional sensors in future phases.                                  |
| **Verification** | Architecture review. Demonstration of adding a mock CTD adapter in isolation. |

---

## 6. User Stories

### Dataset and Model Visualization

| ID     | User Story                                                                                                                         |
|--------|------------------------------------------------------------------------------------------------------------------------------------|
| US-001 | As an ocean forecaster, I want to load a NetCDF model dataset so that I can begin visualizing ocean state variables.               |
| US-002 | As an ocean forecaster, I want to select the temperature variable so that I can inspect its 3D spatial distribution.               |
| US-003 | As an ocean forecaster, I want to navigate to a specific depth level so that I can examine model conditions at that depth.         |
| US-004 | As an ocean forecaster, I want to play a time animation so that I can observe how the temperature field evolves over time.         |
| US-005 | As an oceanographer, I want to visualize current vectors overlaid on the temperature field so that I can understand heat transport. |
| US-006 | As an oceanographer, I want to change the color palette so that I can distinguish values more clearly for my use case.             |
| US-007 | As an oceanographer, I want to set a custom min/max range on the colorbar so that I can focus on a specific value range.           |
| US-008 | As an oceanographer, I want to apply vertical exaggeration so that the depth structure of the ocean is easier to interpret.        |

### Instrument Data

| ID     | User Story                                                                                                                                    |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| US-009 | As an oceanographer, I want to see Argo float positions overlaid on the model visualization so that I can identify where observations exist.  |
| US-010 | As an oceanographer, I want to click on an Argo float so that I can view its temperature vs depth profile.                                    |
| US-011 | As an oceanographer, I want to switch the profile variable from temperature to salinity so that I can compare both profiles.                   |
| US-012 | As a forecaster, I want to compare the model temperature at an Argo float location with the Argo-observed profile so that I can validate the model. |

### UI and System

| ID     | User Story                                                                                                                                    |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| US-013 | As a user, I want to see the current timestamp displayed at all times so that I always know which model time step is shown.                   |
| US-014 | As a user, I want to see a loading indicator while data is being fetched so that I know the system is working.                                |
| US-015 | As a user, I want to reset the camera to the default orientation so that I can return to a standard overview.                                 |
| US-016 | As a new user with no training, I want clear UI labels and controls so that I can navigate the tool without reading documentation.            |

---

## 7. Use Cases

### UC-001 — Inspect Ocean Temperature Distribution

**Actor:** Ocean Forecaster  
**Goal:** Understand temperature distribution at a specific depth and time step  
**Preconditions:** Backend is running. Temperature dataset is available.  
**Main Flow:**
1. User opens the application in a browser.
2. System displays the dataset selector populated with available datasets.
3. User selects a model dataset.
4. System loads metadata and displays the 3D scene with the default variable and depth.
5. User selects "Temperature" in the variable selector.
6. System fetches the temperature depth slice and renders it with the default colorbar.
7. User adjusts depth using the depth slider.
8. System updates the visualization to the selected depth level.
9. User advances to the next time step.
10. System fetches and renders the temperature data for the new time step.  
**Postconditions:** User has inspected temperature at chosen depth and time.

---

### UC-002 — Inspect Argo Float Observational Profile

**Actor:** Physical Oceanographer  
**Goal:** View a depth profile from an Argo float and compare with model output  
**Preconditions:** Model dataset and Argo observation dataset are both available.  
**Main Flow:**
1. User loads a model dataset (UC-001).
2. User activates the Argo instrument layer via the instrument controls.
3. System displays Argo float markers at their geographic positions.
4. User clicks on an Argo float marker.
5. System opens the profile panel showing the instrument ID, location, and date.
6. The panel displays a Temperature vs Depth chart.
7. User switches the profile variable to Salinity.
8. System updates the chart with the salinity profile.
9. User closes the profile panel.  
**Postconditions:** User has inspected the Argo profile and compared it with the overlaid model field.

---

### UC-003 — Customize Colorbar for Scientific Analysis

**Actor:** Data Analyst  
**Goal:** Adjust colorbar to highlight specific value range  
**Preconditions:** A model variable is being displayed.  
**Main Flow:**
1. User locates the colorbar panel.
2. User selects a color palette (e.g., "viridis").
3. System re-renders the visualization with the new palette.
4. User sets custom minimum (e.g., 20°C) and maximum (e.g., 30°C) values.
5. System re-renders with values outside the range rendered as the palette extremes.
6. User toggles logarithmic scale if appropriate.  
**Postconditions:** Visualization uses the user-specified colorbar configuration.

---

### UC-004 — Animate Time Evolution

**Actor:** Ocean Forecaster  
**Goal:** View how a model field evolves over forecast time  
**Preconditions:** Multi-timestep model dataset is loaded.  
**Main Flow:**
1. User opens the time controls panel.
2. User clicks the Play button.
3. System sequentially loads and renders each time step in order.
4. The timestamp display updates with each step.
5. User clicks Pause to stop the animation.
6. User sets animation speed to a higher rate.
7. User resumes playback.  
**Postconditions:** User has observed temporal evolution of the selected variable.

---

## 8. Data Requirements

### 8.1 Model Data

- **Formats:** NetCDF (primary, **P0** — must be supported in V1). Delimited text/ASCII for model data (secondary, **P1** — parse if provided but not a V1 blocker). See §8.2 for observation CSV/ASCII (also P1).
- **Required Dimensions:** latitude, longitude
- **Optional Dimensions:** depth/pressure, time
- **Variables:** Any combination of: temperature, salinity, u-current, v-current, chlorophyll, and other named scientific variables
- **Grid Types:** Regular rectangular latitude/longitude grids are required for V1. Curvilinear grids are FUTURE.
- **Fill Values:** Fill/missing values must be identified and masked in visualization
- **Metadata:** CF Conventions naming of dimensions and variables is preferred but not strictly required; variables without CF names are still accepted and listed by their raw variable name
- **Dimension Name Aliasing:** Real ocean model datasets use many different dimension names for the same concept. The backend normalizer MUST support aliasing. Minimum required aliases: latitude (`lat`, `latitude`, `y`, `nav_lat`), longitude (`lon`, `longitude`, `x`, `nav_lon`), depth (`depth`, `lev`, `level`, `z`, `depth_m`), time (`time`, `time_counter`, `ocean_time`, `T`). The alias resolution order is configurable in `config.py`. Datasets that use none of the listed aliases for a required dimension are logged as warnings and the relevant feature (depth, time) is disabled for that dataset.
- **U/V Variable Detection:** The backend identifies current component variables by checking CF `standard_name` attributes first (`eastward_sea_water_velocity` / `northward_sea_water_velocity`). Only when CF `standard_name` is absent does it fall back to name-based aliases. Ambiguous short names such as `u` or `v` MUST NOT be assumed to be geographic east/north velocity components unless CF metadata or dataset-specific configuration confirms this. If valid eastward/northward components cannot be positively identified, `has_u_v` is set to `false` and current vector visualization is disabled without error.
- **Size:** No hard limit for V1; performance is optimized by serving subsets, not full files

### 8.2 Observation Data (Argo and Glider)

- **Formats:** NetCDF, CSV/delimited text
- **Required Fields:** instrument ID, latitude, longitude, depth or pressure (array), at least one profile variable (temperature, salinity, or chlorophyll)
- **Optional Fields:** timestamp, platform type, mission ID
- **Profile Structure:** Each instrument provides one or more vertical profiles (depth-indexed arrays)
- **Missing Variables:** If a profile variable is missing (e.g., chlorophyll not measured), it must be excluded from the profile variable list for that instrument without causing an error
- **Argo GDAC NetCDF Format:** Standard Argo GDAC files use `N_PROF` (number of profiles) × `N_LEVELS` (depth levels per profile) dimensions. The `NetCDFObsParser` MUST support this structure. Key variables: `LATITUDE`, `LONGITUDE`, `JULD` (Julian date), `PRES` (pressure), `TEMP`, `PSAL`, and their QC flag arrays (`TEMP_QC`, `PSAL_QC`). Quality flags with value ≥ 3 (bad data) MUST be masked as missing. TBD: exact Argo format version — PROJECT OWNER DECISION REQUIRED (TBD-01).
- **Quality Flags:** Observation data may include per-measurement quality flags. Values flagged as bad or questionable MUST be masked/excluded from profile display.

### 8.3 Coordinate Conventions

- Latitude: decimal degrees, -90 to +90 (positive = North). The normalizer MUST sort latitude arrays to canonical ascending order (South-to-North, lat[0] = southernmost) before sending data to the frontend. **When the latitude array is sorted, the corresponding data dimensions MUST be reordered in the same order so that coordinate/value associations are preserved.** Sorting the coordinate array without reordering the data array is a data corruption error.
- Longitude: decimal degrees. The normalizer MUST convert all longitudes to the -180 to +180 range regardless of source convention (0–360 or -180–180). This normalization applies to **both** model and observation data so that instrument markers are geographically consistent with the depth-slice mesh. **When longitude values are reordered or wrapped, the corresponding data dimensions MUST be reordered identically to preserve coordinate/value association.**
- Depth: positive values downward in meters. When a true depth coordinate in meters is available (CF `standard_name: depth`, units `m`), it MUST be used directly without conversion. Only when no true depth coordinate exists and the dataset provides a pressure coordinate (units `dbar` or `decibars`) should the normalizer apply a pressure-to-depth approximation: `depth_m ≈ pressure_dbar × 0.9804`. This is an approximation only; the exact methodology is TBD-06 (PROJECT OWNER DECISION REQUIRED). The frontend always receives and displays values labelled as depth in meters, with a note in the metadata indicating when an approximation was used.
- Time: ISO 8601 format or NetCDF time with units attribute (decoded by xarray `decode_times=True`)

### 8.4 Dataset Catalog

- The backend maintains a catalog of available datasets and observations discovered from the data directory
- Catalog entries include: ID, name, format, variables, time range, depth range, bounding box
- The catalog is populated at backend startup. **In V1, a catalog refresh requires restarting the backend.** A live-refresh admin endpoint is a post-V1 feature and must not be implemented in V1. (See ARCHITECTURE.md §5.3)

---

## 9. UI Requirements

### 9.1 Required UI Areas

| Area                    | Description                                                                                                                         | Priority |
|-------------------------|-------------------------------------------------------------------------------------------------------------------------------------|----------|
| 3D Visualization Canvas | Primary WebGL canvas (Three.js scene) occupying the dominant screen area; renders the interactive 3D ocean scene with depth slices, instrument markers, and current vectors | P0       |
| Dataset Selector Panel  | Dropdown or list for selecting the active model dataset and observation dataset                                                      | P0       |
| Variable Selector       | Dropdown listing scalar variables available in the active dataset                                                                   | P0       |
| Depth Control           | Slider or stepped selector for depth level navigation; moves depth-slice through the 3D water column; current depth displayed       | P0       |
| Time Control            | Slider + Play/Pause/Step buttons + current timestamp display (P0). Animation speed control (P1 — SHOULD HAVE)                       | P0       |
| Colorbar Widget         | Vertical or horizontal colorbar with value labels, palette selector, min/max inputs (P0). Log scale toggle (P1 — SHOULD HAVE)       | P0       |
| Layer Controls          | Toggle switches for model color layer and current vector layer; opacity slider for model layer                                      | P1       |
| Instrument Controls     | Toggle for Argo and Glider layers; instrument type legend                                                                           | P0       |
| Profile Panel           | Side panel displaying instrument metadata + **2D** depth-profile chart (variable vs. depth). This panel is supplementary; the main visualization remains the 3D scene. | P0       |
| Vertical Exaggeration   | Slider with numerical display for vertical exaggeration factor (P0 — required for 3D depth visualization to be meaningful)         | **P0**   |
| Status / Info Bar       | Persistent display of: active dataset, variable, depth (in meters), time, and loading state                                         | **P0**   |
| Camera Reset Button     | Single button that resets the 3D camera to default overview orientation                                                             | P1       |

### 9.2 UI Design Principles

- Controls must use clear oceanographic terminology (e.g., "Depth Level" not "Z-axis value")
- Color-blind-friendly palettes must be available as options (e.g., viridis, plasma)
- The 3D canvas must remain the dominant UI element; controls should not obstruct the scene
- Panel layout must be responsive enough to function on a standard 1920×1080 desktop display
- Mobile support is FUTURE; V1 targets desktop browsers only

---

## 10. Integration Requirements

### 10.1 REST API (V1 — Required)

The frontend communicates with the backend exclusively through a versioned JSON REST API. All data exchange is stateless. Detailed endpoint specification is in ARCHITECTURE.md.

### 10.2 OPeNDAP (FUTURE)

OPeNDAP is an open protocol for remote access to scientific datasets. The backend architecture should not preclude future integration with an OPeNDAP server (e.g., Hyrax, THREDDS). In V1, data is loaded from the local filesystem only.

### 10.3 OGC WMS / WCS (FUTURE)

OGC WMS and WCS standards allow geospatial data to be served over the web in standardized ways. These standards are architecture-ready but not implemented in V1. The API design must not structurally prevent future WMS/WCS endpoint addition.

### 10.4 CF Conventions (Architecture-Ready)

The backend should preferentially use CF-compliant naming conventions for dimension and variable identification. Non-CF datasets are also supported, but CF naming is used where present to improve auto-detection of standard variables (e.g., identifying temperature as `sea_water_temperature`).

---

## 11. Acceptance Criteria Summary

| Requirement | Acceptance Criteria IDs                                              | Priority | Change from Initial Draft          |
|-------------|----------------------------------------------------------------------|----------|------------------------------------|
| FR-001      | AC-001-1, AC-001-2, AC-001-3, AC-001-4                               | P0       | Unchanged                          |
| FR-002      | AC-002-1, AC-002-2, AC-002-3, AC-002-4, AC-002-5, AC-002-6          | P0       | AC-002-6 added (3D scene required) |
| FR-003      | AC-003-1, AC-003-2, AC-003-3                                         | P0       | Unchanged                          |
| FR-004      | AC-004-1, AC-004-2, AC-004-3                                         | P0       | Unchanged                          |
| FR-005      | AC-005-1, AC-005-2, AC-005-3, AC-005-4, AC-005-5                    | P0       | Unchanged                          |
| FR-006      | AC-006-1, AC-006-2, AC-006-3, AC-006-4, AC-006-5                    | **P0**   | **Promoted P1 → P0**               |
| FR-007      | AC-007-1, AC-007-2, AC-007-3, AC-007-4                               | P0       | Unchanged                          |
| FR-008      | AC-008-1, AC-008-2, AC-008-3, AC-008-4, AC-008-5                    | P0       | Unchanged                          |
| FR-009      | AC-009-1, AC-009-2, AC-009-3, AC-009-4, AC-009-5                    | P0       | Unchanged                          |
| FR-010      | AC-010-1, AC-010-2, AC-010-3                                         | P1       | Unchanged (layer opacity remains P1)|
| FR-011      | AC-011-1, AC-011-2, AC-011-3, AC-011-4, AC-011-5, AC-011-6          | **P0**   | **Promoted P1 → P0**               |
| FR-012      | AC-012-1, AC-012-2, AC-012-3, AC-012-4                               | P0       | Unchanged                          |
| FR-013      | AC-013-1, AC-013-2, AC-013-3, AC-013-4                               | P0       | Unchanged                          |
| FR-014      | AC-014-1, AC-014-2, AC-014-3                                         | P2       | Unchanged (isosurface remains P2)  |
| FR-015      | AC-015-1, AC-015-2, AC-015-3, AC-015-4                               | **P0**   | **Promoted P1 → P0** (review finding IMPORTANT-12) |
| NFR-009     | AC-009-data-integrity (see VAC-20 in V1_SCOPE)                       | P0       | VAC-20 added (review finding IMPORTANT-11) |

---

## 12. Out of Scope for Version 1

The following features are excluded from V1 implementation. They must not be implemented or partially implemented in V1. Documenting future architecture boundaries (e.g., extension points, OGC-ready response formats) is permitted and does not constitute implementation.

| Feature                                              | Rationale for Exclusion                                                                        |
|------------------------------------------------------|------------------------------------------------------------------------------------------------|
| User authentication and access control               | V1 is an internal prototype; not required until deployment                                     |
| OGC WMS / WCS endpoint implementation                | Architecture-ready; not required for prototype demonstration                                   |
| OPeNDAP remote data access                           | V1 loads local files only                                                                      |
| CTD, BGC, Mooring, HF Radar, ADCP overlays          | Architecture allows future addition; V1 focuses on Argo and Glider                            |
| Curvilinear / unstructured model grids               | Regular rectangular grids sufficient for V1                                                    |
| **Full volumetric rendering with transparency**      | Advanced future visualization mode; requires per-voxel transparency transfer functions. Distinct from and more complex than the V1 depth-slice 3D visualization. Not required for V1. |
| Data upload via browser UI                           | V1 uses server-side data directory; UI upload is future                                        |
| Data export / download from UI                       | Not required for V1 operational demonstration                                                  |
| Mobile / tablet responsive UI                        | V1 targets desktop browsers only                                                               |
| Multi-user concurrent session management             | V1 is single-user prototype deployment                                                         |
| ML-derived ocean products                            | No ML integration in V1                                                                        |
| Advanced educational / outreach modules              | Scientific visualization is the V1 focus                                                       |
| Social / sharing features                            | Not required                                                                                   |
| Payment, subscription, or identity systems           | Not applicable                                                                                 |
| Kubernetes / container orchestration                 | V1 deployment is a single-server Python + Node.js setup                                        |
| Real-time streaming data ingestion                   | V1 processes static pre-placed datasets                                                        |
| Automated INCOIS data pipeline integration           | V1 manual dataset placement only; TBD for future INCOIS integration                            |

> **Note:** Isosurface visualization (FR-014) is **NOT** out of scope — it is P2/COULD HAVE. Full volumetric rendering is what is excluded from V1.

---

## 13. Acronyms

| Acronym  | Meaning                                                          |
|----------|------------------------------------------------------------------|
| INCOIS   | Indian National Centre for Ocean Information Services            |
| EEZ      | Exclusive Economic Zone                                          |
| NetCDF   | Network Common Data Form                                         |
| API      | Application Programming Interface                                |
| REST     | Representational State Transfer                                  |
| JSON     | JavaScript Object Notation                                       |
| OGC      | Open Geospatial Consortium                                       |
| WMS      | Web Map Service                                                  |
| WCS      | Web Coverage Service                                             |
| CF       | Climate and Forecast (CF Metadata Conventions for NetCDF)        |
| CTD      | Conductivity, Temperature, Depth                                  |
| BGC      | Biogeochemical                                                   |
| ADCP     | Acoustic Doppler Current Profiler                                 |
| HF       | High Frequency                                                   |
| WebGL    | Web Graphics Library                                             |
| UI       | User Interface                                                   |
| UX       | User Experience                                                  |
| SRS      | Software Requirements Specification                              |
| V1       | Version 1                                                        |
| T/S      | Temperature / Salinity                                           |
| P0/P1/P2 | Requirement priority levels (P0 = Mandatory, P1 = Important, P2 = Nice-to-have) |
| CORS     | Cross-Origin Resource Sharing                                    |
| WCAG     | Web Content Accessibility Guidelines                             |
| dbar     | Decibar (unit of pressure used in oceanography)                  |
| NaN      | Not a Number (representation for missing values)                 |
| THREDDS  | Thematic Real-time Environmental Distributed Data Services       |

---

## 14. Dataset Links

> **Important:** No real INCOIS dataset URLs are available at time of writing. All source links are marked TBD. Do not fabricate URLs.

| Dataset                  | Description                                      | Format      | Source / Link | Status   |
|--------------------------|--------------------------------------------------|-------------|---------------|----------|
| Ocean Model Sample       | Sample model output for development and testing  | NetCDF      | TBD           | Required |
| Argo Float Sample        | Sample Argo profiling float data                 | NetCDF/CSV  | TBD           | Required |
| Glider Sample            | Sample glider track and profile data             | NetCDF/CSV  | TBD           | Required |
| INCOIS Model Output      | Operational model output from INCOIS             | NetCDF      | TBD           | Future   |
| Argo Global Program Data | Public Argo data (Coriolis/GDAC)                 | NetCDF      | TBD           | Optional |

---

*End of SRS — Version 1.0*
