import os
import logging
import urllib.request
from ftplib import FTP
from typing import List
from backend.ingestion.config import SourceConfig

logger = logging.getLogger(__name__)

def ingest_glider(config: SourceConfig) -> None:
    if not config.enabled:
        logger.info("Glider ingestion is disabled.")
        return

    logger.info(f"Starting Glider ingestion from {config.source}")
    os.makedirs(config.destination, exist_ok=True)
    
    index_url = config.source.rstrip('/') + '/glider_prof_index.txt'
    index_path = os.path.join(config.destination, 'glider_prof_index.txt')
    
    # Download index if not present
    if not os.path.exists(index_path):
        logger.info(f"Downloading Glider index from {index_url}...")
        try:
            urllib.request.urlretrieve(index_url, index_path)
        except Exception as e:
            logger.error(f"Failed to download Glider index: {e}")
            return
            
    # Parse index
    candidates = []
    logger.info("Parsing Glider index...")
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith('#') or line.startswith('file'):
                    continue
                parts = line.strip().split(',')
                if len(parts) >= 4:
                    file_path = parts[0]
                    lat_str = parts[2]
                    lon_str = parts[3]
                    
                    if not lat_str or not lon_str:
                        continue
                        
                    try:
                        lat = float(lat_str)
                        lon = float(lon_str)
                    except ValueError:
                        continue
                        
                    if config.region and not config.region.contains(lat, lon):
                        continue
                        
                    candidates.append(file_path)
                    if len(candidates) >= config.max_files:
                        break
    except Exception as e:
        logger.error(f"Failed to parse Glider index: {e}")
        return
        
    logger.info(f"Found {len(candidates)} candidate files for region.")
    
    # Download candidate files via FTP
    ftp_host = config.source.replace('ftp://', '').split('/')[0]
    base_dir = '/' + '/'.join(config.source.replace('ftp://', '').split('/')[1:])
    
    try:
        ftp = FTP(ftp_host)
        ftp.login()
        for file_path in candidates:
            filename = os.path.basename(file_path)
            local_path = os.path.join(config.destination, filename)
            
            if os.path.exists(local_path):
                logger.info(f"Skipping already downloaded file: {filename}")
                continue
                
            remote_path = f"{base_dir}/{file_path}"
            logger.info(f"Downloading {remote_path} to {local_path}...")
            
            try:
                with open(local_path, 'wb') as f:
                    ftp.retrbinary(f"RETR {remote_path}", f.write)
            except Exception as e:
                logger.error(f"Failed to download {remote_path}: {e}")
                if os.path.exists(local_path):
                    os.remove(local_path)
        ftp.quit()
    except Exception as e:
        logger.error(f"FTP connection failed: {e}")
