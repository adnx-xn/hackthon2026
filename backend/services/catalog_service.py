import os
import logging
import json
from typing import Dict, List, Optional, cast
from backend.models.schemas import DatasetRecord, ObsDatasetRecord
from backend.parsers.registry import parser_registry
from backend.parsers.base_parser import ModelParser, ObservationParser

logger = logging.getLogger(__name__)

class CatalogService:
    def __init__(self):
        self._model_datasets: Dict[str, DatasetRecord] = {}
        self._obs_datasets: Dict[str, ObsDatasetRecord] = {}

    def build_catalog(self, models_dir: str, obs_dir: str) -> None:
        """Scan directories and build the in-memory catalog."""
        logger.info(f"Building catalog from models_dir={models_dir}, obs_dir={obs_dir}")
        
        self._model_datasets.clear()
        self._obs_datasets.clear()
        
        # Parse local model files
        if os.path.exists(models_dir) and os.path.isdir(models_dir):
            for file_name in os.listdir(models_dir):
                if file_name.endswith('.nc'):
                    file_path = os.path.join(models_dir, file_name)
                    try:
                        parser_class = parser_registry.get_parser('netcdf')
                        parser = cast(ModelParser, parser_class())
                        record = parser.get_metadata(file_path, source_type='local')
                        self._model_datasets[record.id] = record
                        logger.info(f"Loaded local model dataset: {record.id}")
                    except Exception as e:
                        logger.error(f"Failed to load model dataset {file_path}: {e}")
                        
            # Parse OPeNDAP models
            opendap_file = os.path.join(models_dir, 'opendap_catalog.json')
            if os.path.exists(opendap_file):
                try:
                    with open(opendap_file, 'r', encoding='utf-8') as f:
                        catalog_data = json.load(f)
                    for ds_info in catalog_data.get('datasets', []):
                        if ds_info.get('source_type') == 'opendap':
                            source = ds_info.get('source', '')
                            if not source.startswith(('http://', 'https://')):
                                logger.error(f"Invalid OPeNDAP URL scheme for dataset {ds_info.get('id')}: {source}")
                                continue
                                
                            ds_format = ds_info.get('format', 'netcdf')
                            try:
                                parser_class = parser_registry.get_parser(ds_format)
                                parser = cast(ModelParser, parser_class())
                                record = parser.get_metadata(source, source_type='opendap')
                                # Override ID and name if specified in config
                                record.id = ds_info.get('id', record.id)
                                record.name = ds_info.get('name', record.name)
                                self._model_datasets[record.id] = record
                                logger.info(f"Loaded OPeNDAP model dataset: {record.id}")
                            except Exception as e:
                                logger.error(f"Failed to load OPeNDAP model dataset {source}: {e}")
                except Exception as e:
                    logger.error(f"Failed to parse OPeNDAP catalog {opendap_file}: {e}")
        else:
            logger.warning(f"Models directory does not exist or is not a directory: {models_dir}")
            
        # Parse local observation files
        if os.path.exists(obs_dir) and os.path.isdir(obs_dir):
            for root, dirs, files in os.walk(obs_dir):
                for file_name in files:
                    if file_name.endswith('.nc'):
                        file_path = os.path.join(root, file_name)
                        try:
                            # Infer parser type from directory name
                            parser_key = 'netcdf_obs'
                            lower_root = root.lower()
                            if 'ctd' in lower_root:
                                parser_key = 'netcdf_ctd'
                            elif 'bgc' in lower_root:
                                parser_key = 'netcdf_bgc'
                            elif 'mooring' in lower_root:
                                parser_key = 'netcdf_mooring'
                            elif 'adcp' in lower_root:
                                parser_key = 'netcdf_adcp'
                            elif 'hf_radar' in lower_root:
                                parser_key = 'netcdf_hf_radar'

                            parser_class = parser_registry.get_parser(parser_key)
                            parser = cast(ObservationParser, parser_class())
                            record = parser.get_metadata(file_path, source_type='local')
                            self._obs_datasets[record.id] = record
                            logger.info(f"Loaded local observation dataset: {record.id} with parser {parser_key}")
                        except Exception as e:
                            logger.error(f"Failed to load observation dataset {file_path}: {e}")
                        
            # Parse OPeNDAP observations
            opendap_file = os.path.join(obs_dir, 'opendap_catalog.json')
            if os.path.exists(opendap_file):
                try:
                    with open(opendap_file, 'r', encoding='utf-8') as f:
                        catalog_data = json.load(f)
                    for ds_info in catalog_data.get('datasets', []):
                        if ds_info.get('source_type') == 'opendap':
                            source = ds_info.get('source', '')
                            if not source.startswith(('http://', 'https://')):
                                logger.error(f"Invalid OPeNDAP URL scheme for dataset {ds_info.get('id')}: {source}")
                                continue
                                
                            ds_format = ds_info.get('format', 'netcdf_obs')
                            try:
                                parser_class = parser_registry.get_parser(ds_format)
                                parser = cast(ObservationParser, parser_class())
                                record = parser.get_metadata(source, source_type='opendap')
                                # Override ID and name if specified in config
                                record.id = ds_info.get('id', record.id)
                                record.name = ds_info.get('name', record.name)
                                self._obs_datasets[record.id] = record
                                logger.info(f"Loaded OPeNDAP observation dataset: {record.id}")
                            except Exception as e:
                                logger.error(f"Failed to load OPeNDAP observation dataset {source}: {e}")
                except Exception as e:
                    logger.error(f"Failed to parse OPeNDAP catalog {opendap_file}: {e}")
        else:
            logger.warning(f"Observations directory does not exist or is not a directory: {obs_dir}")

    def get_model_dataset(self, dataset_id: str) -> Optional[DatasetRecord]:
        return self._model_datasets.get(dataset_id)

    def get_obs_dataset(self, dataset_id: str) -> Optional[ObsDatasetRecord]:
        return self._obs_datasets.get(dataset_id)

    def list_model_datasets(self) -> List[DatasetRecord]:
        return list(self._model_datasets.values())

    def list_obs_datasets(self) -> List[ObsDatasetRecord]:
        return list(self._obs_datasets.values())

# Singleton instance
catalog_service = CatalogService()
