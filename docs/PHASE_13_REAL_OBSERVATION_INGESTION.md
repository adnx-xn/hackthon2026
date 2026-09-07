# Phase 13: Real Observation Data Ingestion

This document details the ingestion architecture implemented to download bounded subsets of real observation data from authoritative sources and integrate them into the SIH26 / INCOIS system.

## Sources
- **Argo**: `ftp://ftp.ifremer.fr/ifremer/argo` (IFREMER Core-Argo GDAC)
- **Glider**: `ftp://ftp.ifremer.fr/ifremer/glider/v2/` (IFREMER Glider GDAC)
- **CTD**: `https://www.ncei.noaa.gov/erddap/tabledap/wod_ctd_obs.nc` (NOAA/NCEI World Ocean Database ERDDAP)

## Region
The default configured bounding box encompasses the Indian Ocean and surrounding regions:
- West: 35
- East: 120
- South: -30
- North: 40

## Acquisition Method
To prevent massive downloads, the ingestion subsystem bounds the data geographically and logically limits the number of files:
- **Argo**: Streams the `ar_index_global_prof.txt.gz` file, parses the CSV content, filters profiles falling within the bounding box, and downloads the `.nc` profile files over FTP up to `max_files`.
- **Glider**: Streams the `glider_prof_index.txt` from the Glider FTP, applies geographic filtering, and downloads the trajectory/profile NetCDF files over FTP up to `max_files`.
- **CTD**: Utilizes the NCEI ERDDAP API to programmatically request a targeted NetCDF file matching the exact bounding box and recent date bounds, downloading a single aggregated file.

## Local Storage
Downloaded raw source files are preserved exactly as provided by the sources and stored under `data/observations/` in specific subdirectories:
- `data/observations/argo/`
- `data/observations/glider/`
- `data/observations/ctd/`

## Parsers
The existing architecture natively parses these raw files seamlessly:
- The `NetCDFObsParser` (`backend/parsers/netcdf_obs_parser.py`) is used for Argo and Glider.
- The `CTDParser` (`backend/parsers/ctd_parser.py`) is used for CTD.

## Normalization
The `ObservationService` combined with the parsers automatically normalize the raw NetCDF structures into standard `InstrumentRecord` and `ProfileData` models used by the FastAPI backend, preserving actual timestamps, coordinates, and QC-flagged scientific values without manufacturing any fake data.

## Security
Arbitrary URLs cannot be downloaded through user requests. The `backend/ingestion` subsystem strictly reads from the controlled server-side configuration file (`config/observation_sources.json`), eliminating SSRF vulnerabilities. No API endpoint exists to trigger arbitrary downloads.

## Limits
Limits are explicitly controlled in `config/observation_sources.json` via the `max_files` parameter (defaults to 10 for FTP profiles and 1 aggregated ERDDAP request for CTD).

## Real Data Status
- **Actually Downloaded (READY)**: Once the ingestion CLI is run, Argo, Glider, and CTD data will populate the local storage and appear as enabled in the UI.
- **Parser-Supported but Not Yet Downloaded (COMING SOON)**: BGC, Mooring, HF-Radar, and ADCP have existing parsers but are not configured for automated download in this phase.

## Manual Execution
The ingestion process is intentionally uncoupled from the FastAPI server startup. Run it manually:
```bash
# Ingest all configured sources
python -m backend.ingestion.run_ingestion --source all

# Ingest specific source with optional overrides
python -m backend.ingestion.run_ingestion --source argo --max-files 5
```
