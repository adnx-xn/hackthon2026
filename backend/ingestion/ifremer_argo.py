import os
import logging
import urllib.request
import gzip
from ftplib import FTP
from typing import List
from backend.ingestion.config import SourceConfig

logger = logging.getLogger(__name__)

def ingest_argo(config: SourceConfig) -> None:
    if not config.enabled:
        logger.info("Argo ingestion is disabled.")
        return

    logger.info(f"Starting Argo ingestion from {config.source}")
    os.makedirs(config.destination, exist_ok=True)
    
    index_url = config.source.rstrip('/') + '/ar_index_global_prof.txt.gz'
    index_path = os.path.join(config.destination, 'ar_index_global_prof.txt.gz')
    
    # Download index if not present or just download it fresh
    if not os.path.exists(index_path):
        logger.info(f"Downloading Argo index from {index_url}...")
        try:
            urllib.request.urlretrieve(index_url, index_path)
        except Exception as e:
            logger.error(f"Failed to download Argo index: {e}")
            return
            
    # Parse index
    candidates = []
    logger.info("Parsing Argo index...")
    try:
        with gzip.open(index_path, 'rt', encoding='utf-8') as f:
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
        logger.error(f"Failed to parse Argo index: {e}")
        return
        
    logger.info(f"Found {len(candidates)} candidate files for region.")
    
    # Download candidate files via FTP
    # Parse FTP host from source
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
