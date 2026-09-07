from fastapi import APIRouter, Query, Path
from fastapi.responses import Response
import json

from backend.services.dataset_service import dataset_service
from backend.models.schemas import VolumeSlice

router = APIRouter(prefix="/api/v1/datasets", tags=["volume"])

@router.get("/{id}/volume")
async def get_volume(
    id: str = Path(...),
    variable: str = Query(...),
    time_idx: int = Query(..., ge=0)
):
    volume_slice: VolumeSlice = await dataset_service.get_volume(id, variable, time_idx)
    
    metadata_json = volume_slice.metadata.model_dump_json()
    
    headers = {
        "X-Volume-Metadata": metadata_json
    }
    
    return Response(
        content=volume_slice.binary_data,
        media_type="application/octet-stream",
        headers=headers
    )
