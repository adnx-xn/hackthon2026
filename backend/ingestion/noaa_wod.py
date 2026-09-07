import os
import logging
import urllib.request
import urllib.parse
from backend.ingestion.config import SourceConfig

logger = logging.getLogger(__name__)

def ingest_ctd(config: SourceConfig) -> None:
    if not config.enabled:
        logger.info("CTD ingestion is disabled.")
        return

    logger.info(f"Starting CTD ingestion from {config.source}")
    os.makedirs(config.destination, exist_ok=True)
    
    # Base ERDDAP URL for CTD
    # e.g., https://www.ncei.noaa.gov/erddap/tabledap/wod_ctd_obs.nc
    base_url = config.source
    
    # We want to limit by bounding box.
    if config.region:
        w = config.region.west
        e = config.region.east
        s = config.region.south
        n = config.region.north
        
        # Build query string
        # Limit to variables needed for CTDParser
        vars = "time,latitude,longitude,depth,Temperature,Salinity,platform_id"
        # Bounding box filter
        constraints = [
            f"latitude>={s}",
            f"latitude<={n}",
            f"longitude>={w}",
            f"longitude<={e}"
        ]
        query = f"{vars}&{'&'.join(constraints)}"
        # Add a time limit so we don't download the whole ocean's history
        query += "&time>=2020-01-01T00:00:00Z"
        
        url = f"{base_url}?{urllib.parse.quote(query, safe='&>=,')}"
    else:
        url = base_url
        
    filename = "wod_ctd_subset.nc"
    local_path = os.path.join(config.destination, filename)
    
    logger.info(f"Downloading CTD subset to {local_path}...")
    try:
        urllib.request.urlretrieve(url, local_path)
        logger.info(f"Successfully downloaded CTD subset.")
    except Exception as e:
        logger.error(f"Failed to download CTD subset from {url}: {e}")
