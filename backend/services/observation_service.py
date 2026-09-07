import asyncio
from typing import List, cast
from backend.services.catalog_service import catalog_service
from backend.parsers.registry import parser_registry
from backend.parsers.base_parser import ObservationParser
from backend.models.schemas import ObsDatasetSummary, InstrumentRecord, ProfileData

class ObservationDatasetNotFoundError(Exception):
    pass

class InstrumentNotFoundError(Exception):
    pass

class ObservationService:
    @staticmethod
    def list_datasets() -> List[ObsDatasetSummary]:
        records = catalog_service.list_obs_datasets()
        return [
            ObsDatasetSummary(
                id=r.id,
                name=r.name,
                instrument_type=r.instrument_type,
                instrument_count=r.instrument_count,
                lat_min=r.lat_min,
                lat_max=r.lat_max,
                lon_min=r.lon_min,
                lon_max=r.lon_max
            ) for r in records
        ]

    @staticmethod
    def get_instruments(dataset_id: str) -> List[InstrumentRecord]:
        record = catalog_service.get_obs_dataset(dataset_id)
        if not record:
            raise ObservationDatasetNotFoundError(f"Observation dataset {dataset_id} not found in catalog")
        
        return record.instruments

    @staticmethod
    def get_instrument(dataset_id: str, instrument_id: str) -> InstrumentRecord:
        record = catalog_service.get_obs_dataset(dataset_id)
        if not record:
            raise ObservationDatasetNotFoundError(f"Observation dataset {dataset_id} not found in catalog")
            
        for inst in record.instruments:
            if inst.id == instrument_id:
                return inst
                
        raise InstrumentNotFoundError(f"Instrument {instrument_id} not found in dataset {dataset_id}")

    @staticmethod
    async def get_profile(dataset_id: str, instrument_id: str) -> ProfileData:
        record = catalog_service.get_obs_dataset(dataset_id)
        if not record:
            raise ObservationDatasetNotFoundError(f"Observation dataset {dataset_id} not found in catalog")
            
        # Verify instrument exists before trying to parse
        found = any(inst.id == instrument_id for inst in record.instruments)
        if not found:
            raise InstrumentNotFoundError(f"Instrument {instrument_id} not found in dataset {dataset_id}")
            
        parser_key = "netcdf_obs" if record.format == "netcdf" else record.format
        parser_class = parser_registry.get_parser(parser_key)
        parser = cast(ObservationParser, parser_class())
        
        profile_data = await asyncio.to_thread(
            parser.get_profile,
            record.source,
            record.source_type,
            instrument_id
        )
        return profile_data

observation_service = ObservationService()
