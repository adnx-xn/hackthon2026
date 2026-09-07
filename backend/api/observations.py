from fastapi import APIRouter, Path
from typing import List
from backend.services.observation_service import observation_service, ObservationDatasetNotFoundError, InstrumentNotFoundError
from backend.models.schemas import ObsDatasetSummary, InstrumentRecord, ProfileData

router = APIRouter(prefix="/api/v1/observations", tags=["observations"])

@router.get("", response_model=List[ObsDatasetSummary])
async def list_observations():
    return observation_service.list_datasets()

@router.get("/{dataset_id}/instruments", response_model=List[InstrumentRecord])
async def get_instruments(dataset_id: str = Path(...)):
    return observation_service.get_instruments(dataset_id)

@router.get("/{dataset_id}/instruments/{instrument_id}", response_model=InstrumentRecord)
async def get_instrument(
    dataset_id: str = Path(...),
    instrument_id: str = Path(...)
):
    return observation_service.get_instrument(dataset_id, instrument_id)

@router.get("/{dataset_id}/instruments/{instrument_id}/profile", response_model=ProfileData)
async def get_profile(
    dataset_id: str = Path(...),
    instrument_id: str = Path(...)
):
    return await observation_service.get_profile(dataset_id, instrument_id)
