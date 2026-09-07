import os
import pytest
from unittest.mock import patch, MagicMock
from backend.services.catalog_service import CatalogService
from backend.models.schemas import DatasetRecord, ObsDatasetRecord

@pytest.fixture
def catalog_service():
    return CatalogService()

@patch('backend.services.catalog_service.os.listdir')
@patch('backend.services.catalog_service.os.path.isdir')
@patch('backend.services.catalog_service.os.path.exists')
@patch('backend.services.catalog_service.parser_registry')
def test_build_catalog_success(mock_registry, mock_exists, mock_isdir, mock_listdir, catalog_service):
    mock_exists.return_value = True
    mock_isdir.return_value = True
    
    # Setup mock files
    def listdir_side_effect(path):
        if 'models' in path:
            return ['model1.nc']
        if 'observations' in path:
            return ['obs1.nc']
        return []
    
    mock_listdir.side_effect = listdir_side_effect
    
    # Mock parser
    mock_model_parser_cls = MagicMock()
    mock_model_parser = mock_model_parser_cls.return_value
    mock_model_parser.get_metadata.return_value = DatasetRecord(
        id='model1', name='model1.nc', source='/dummy/models/model1.nc', source_type='local',
        format='netcdf', dataset_type='model', variables=['temp'],
        has_u_v=False, u_var_name=None, v_var_name=None, depth_levels=[0.0],
        depth_from_pressure=False, time_steps=['2026-01-01'],
        lat_min=-10, lat_max=10, lon_min=40, lon_max=60
    )
    
    mock_obs_parser_cls = MagicMock()
    mock_obs_parser = mock_obs_parser_cls.return_value
    mock_obs_parser.get_metadata.return_value = ObsDatasetRecord(
        id='obs1', name='obs1.nc', source='/dummy/observations/obs1.nc', source_type='local',
        format='netcdf_obs', dataset_type='observation', instrument_type='argo',
        lat_min=-10, lat_max=10, lon_min=40, lon_max=60,
        time_min='2026-01-01', time_max='2026-01-02',
        variables=['temp'], instruments=[], instrument_count=0
    )
    
    def get_parser_side_effect(format_name):
        if format_name == 'netcdf':
            return mock_model_parser_cls
        if format_name == 'netcdf_obs':
            return mock_obs_parser_cls
            
    mock_registry.get_parser.side_effect = get_parser_side_effect
    
    catalog_service.build_catalog('/dummy/models', '/dummy/observations')
    
    assert len(catalog_service.list_model_datasets()) == 1
    assert catalog_service.get_model_dataset('model1') is not None
    assert len(catalog_service.list_obs_datasets()) == 1
    assert catalog_service.get_obs_dataset('obs1') is not None

@patch('backend.services.catalog_service.os.listdir')
@patch('backend.services.catalog_service.os.path.isdir')
@patch('backend.services.catalog_service.os.path.exists')
@patch('backend.services.catalog_service.parser_registry')
def test_build_catalog_corrupt_file(mock_registry, mock_exists, mock_isdir, mock_listdir, catalog_service):
    mock_exists.return_value = True
    mock_isdir.return_value = True
    
    def listdir_side_effect(path):
        if 'models' in path:
            return ['bad.nc', 'good.nc']
        return []
    
    mock_listdir.side_effect = listdir_side_effect
    
    mock_model_parser_cls = MagicMock()
    mock_model_parser = mock_model_parser_cls.return_value
    
    def get_metadata_side_effect(source, source_type='local'):
        if 'bad.nc' in source:
            raise Exception("Corrupt file")
        return DatasetRecord(
            id='good', name='good.nc', source='/dummy/models/good.nc', source_type='local',
            format='netcdf', dataset_type='model', variables=['temp'],
            has_u_v=False, u_var_name=None, v_var_name=None, depth_levels=[0.0],
            depth_from_pressure=False, time_steps=['2026-01-01'],
            lat_min=0, lat_max=0, lon_min=0, lon_max=0
        )
        
    mock_model_parser.get_metadata.side_effect = get_metadata_side_effect
    mock_registry.get_parser.return_value = mock_model_parser_cls
    
    # Should not crash on bad.nc
    catalog_service.build_catalog('/dummy/models', '/dummy/observations')
    
    assert len(catalog_service.list_model_datasets()) == 1
    assert catalog_service.get_model_dataset('good') is not None
    assert catalog_service.get_model_dataset('bad') is None
