import asyncio
from typing import List, Dict, Any, Optional, cast
from backend.services.catalog_service import catalog_service
from backend.parsers.registry import parser_registry
from backend.parsers.base_parser import ModelParser
from backend.models.schemas import DatasetMetadataPublic, DataSlice, VectorSlice, VolumeSlice

class DatasetNotFoundError(Exception):
    pass

class DatasetService:
    @staticmethod
    def list_datasets() -> List[DatasetMetadataPublic]:
        records = catalog_service.list_model_datasets()
        return [
            DatasetMetadataPublic(
                id=r.id,
                name=r.name,
                format=r.format,
                dataset_type=r.dataset_type,
                variables=r.variables,
                has_u_v=r.has_u_v,
                depth_levels=r.depth_levels,
                depth_from_pressure=r.depth_from_pressure,
                time_steps=r.time_steps,
                lat_min=r.lat_min,
                lat_max=r.lat_max,
                lon_min=r.lon_min,
                lon_max=r.lon_max
            ) for r in records
        ]

    @staticmethod
    def get_dataset(dataset_id: str) -> DatasetMetadataPublic:
        record = catalog_service.get_model_dataset(dataset_id)
        if not record:
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found in catalog")
        
        return DatasetMetadataPublic(
            id=record.id,
            name=record.name,
            format=record.format,
            dataset_type=record.dataset_type,
            variables=record.variables,
            has_u_v=record.has_u_v,
            depth_levels=record.depth_levels,
            depth_from_pressure=record.depth_from_pressure,
            time_steps=record.time_steps,
            lat_min=record.lat_min,
            lat_max=record.lat_max,
            lon_min=record.lon_min,
            lon_max=record.lon_max
        )

    @staticmethod
    def get_variables(dataset_id: str) -> List[Dict[str, str]]:
        record = catalog_service.get_model_dataset(dataset_id)
        if not record:
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found in catalog")
        
        # We don't have long_name or units in DatasetRecord for variables,
        # return basic structure as per API contract
        return [{"name": v, "long_name": v, "units": ""} for v in record.variables]

    @staticmethod
    def get_depths(dataset_id: str) -> List[Dict[str, Any]]:
        record = catalog_service.get_model_dataset(dataset_id)
        if not record:
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found in catalog")
        
        return [
            {
                "index": i,
                "depth_m": d,
                "depth_from_pressure": record.depth_from_pressure
            }
            for i, d in enumerate(record.depth_levels)
        ]

    @staticmethod
    def get_times(dataset_id: str) -> List[Dict[str, Any]]:
        record = catalog_service.get_model_dataset(dataset_id)
        if not record:
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found in catalog")
        
        return [
            {
                "index": i,
                "timestamp": t
            }
            for i, t in enumerate(record.time_steps)
        ]

    @staticmethod
    async def get_data_slice(dataset_id: str, variable: str, depth_idx: int, time_idx: int) -> DataSlice:
        record = catalog_service.get_model_dataset(dataset_id)
        if not record:
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found in catalog")
            
        parser_class = parser_registry.get_parser(record.format)
        parser = cast(ModelParser, parser_class())
        
        # Run parsing in thread to avoid blocking asyncio loop
        data_slice = await asyncio.to_thread(
            parser.get_slice,
            record.source,
            record.source_type,
            variable,
            depth_idx,
            time_idx
        )
        return data_slice

    @staticmethod
    async def get_vector_slice(dataset_id: str, depth_idx: int, time_idx: int) -> VectorSlice:
        record = catalog_service.get_model_dataset(dataset_id)
        if not record:
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found in catalog")
            
        parser_class = parser_registry.get_parser(record.format)
        parser = cast(ModelParser, parser_class())
        
        # Run parsing in thread to avoid blocking asyncio loop
        vector_slice = await asyncio.to_thread(
            parser.get_vector_slice,
            record.source,
            record.source_type,
            depth_idx,
            time_idx
        )
        return vector_slice

    @staticmethod
    async def get_volume(dataset_id: str, variable: str, time_idx: int) -> VolumeSlice:
        record = catalog_service.get_model_dataset(dataset_id)
        if not record:
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found in catalog")
            
        parser_class = parser_registry.get_parser(record.format)
        parser = cast(ModelParser, parser_class())
        
        volume_slice = await asyncio.to_thread(
            parser.get_volume,
            record.source,
            record.source_type,
            variable,
            time_idx
        )
        return volume_slice

    @staticmethod
    async def get_wms_map(dataset_id: str, variable: str, bbox: dict, width: int, height: int, 
                          time_idx: int, depth_idx: int, cmap_name: str, is_log: bool) -> bytes:
        record = catalog_service.get_model_dataset(dataset_id)
        if not record:
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found in catalog")
            
        parser_class = parser_registry.get_parser(record.format)
        parser = cast(ModelParser, parser_class())
        
        return await asyncio.to_thread(
            parser.get_wms_map,
            record.source,
            record.source_type,
            variable,
            bbox,
            width,
            height,
            time_idx,
            depth_idx,
            cmap_name,
            is_log
        )

    @staticmethod
    async def get_wcs_coverage(dataset_id: str, variable: str, bbox: dict, time_slice: tuple, depth_slice: tuple) -> bytes:
        record = catalog_service.get_model_dataset(dataset_id)
        if not record:
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found in catalog")
            
        parser_class = parser_registry.get_parser(record.format)
        parser = cast(ModelParser, parser_class())
        
        return await asyncio.to_thread(
            parser.get_wcs_coverage,
            record.source,
            record.source_type,
            variable,
            bbox,
            time_slice,
            depth_slice
        )

dataset_service = DatasetService()

