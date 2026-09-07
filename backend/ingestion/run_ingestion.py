import argparse
import logging
import sys

from backend.ingestion.config import load_config
from backend.ingestion.ifremer_argo import ingest_argo
from backend.ingestion.ifremer_glider import ingest_glider
from backend.ingestion.noaa_wod import ingest_ctd

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Ingest observation data for SIH26")
    parser.add_argument('--source', type=str, choices=['argo', 'glider', 'ctd', 'all'], required=True,
                        help="Source to ingest")
    parser.add_argument('--west', type=float, help="Western longitude bound")
    parser.add_argument('--east', type=float, help="Eastern longitude bound")
    parser.add_argument('--south', type=float, help="Southern latitude bound")
    parser.add_argument('--north', type=float, help="Northern latitude bound")
    parser.add_argument('--max-files', type=int, help="Maximum number of files to download")
    
    args = parser.parse_args()
    
    try:
        config_map = load_config()
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        sys.exit(1)
        
    def override_config(cfg):
        if args.west is not None and cfg.region:
            cfg.region.west = args.west
        if args.east is not None and cfg.region:
            cfg.region.east = args.east
        if args.south is not None and cfg.region:
            cfg.region.south = args.south
        if args.north is not None and cfg.region:
            cfg.region.north = args.north
        if args.max_files is not None:
            cfg.max_files = args.max_files
        return cfg

    sources_to_run = ['argo', 'glider', 'ctd'] if args.source == 'all' else [args.source]
    
    for src in sources_to_run:
        if src not in config_map:
            logger.warning(f"Source {src} not configured.")
            continue
            
        cfg = override_config(config_map[src])
        if src == 'argo':
            ingest_argo(cfg)
        elif src == 'glider':
            ingest_glider(cfg)
        elif src == 'ctd':
            ingest_ctd(cfg)

if __name__ == "__main__":
    main()
