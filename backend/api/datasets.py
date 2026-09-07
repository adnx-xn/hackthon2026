from fastapi import APIRouter, Query, Path
from typing import List, Dict, Any
from backend.services.dataset_service import dataset_service, DatasetNotFoundError
from backend.models.schemas import DatasetMetadataPublic, DataSlice, VectorSlice

router = APIRouter(prefix="/api/v1/datasets", tags=["datasets"])

@router.get("", response_model=List[DatasetMetadataPublic])
async def list_datasets():
    return dataset_service.list_datasets()

@router.get("/{id}", response_model=DatasetMetadataPublic)
async def get_dataset(id: str = Path(...)):
    return dataset_service.get_dataset(id)

@router.get("/{id}/variables")
async def get_variables(id: str = Path(...)):
    return dataset_service.get_variables(id)

@router.get("/{id}/depths")
async def get_depths(id: str = Path(...)):
    return dataset_service.get_depths(id)

@router.get("/{id}/times")
async def get_times(id: str = Path(...)):
    return dataset_service.get_times(id)

@router.get("/{id}/data", response_model=DataSlice)
async def get_data(
    id: str = Path(...),
    variable: str = Query(...),
    depth_idx: int = Query(..., ge=0),
    time_idx: int = Query(..., ge=0)
):
    return await dataset_service.get_data_slice(id, variable, depth_idx, time_idx)

@router.get("/{id}/vectors", response_model=VectorSlice)
async def get_vectors(
    id: str = Path(...),
    depth_idx: int = Query(..., ge=0),
    time_idx: int = Query(..., ge=0)
):
    return await dataset_service.get_vector_slice(id, depth_idx, time_idx)
