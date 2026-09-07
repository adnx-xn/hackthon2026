import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from backend.parsers.terrain_parser import get_terrain_parser

router = APIRouter(prefix="/api/v1/geography", tags=["Geography"])

@router.get("/terrain")
async def get_terrain(max_dim: int = 512):
    """
    Returns the ETOPO terrain data as a binary Float32Array.
    Metadata is included in the X-Terrain-Metadata header.
    The PIL/numpy work runs in a threadpool via asyncio.to_thread so the
    event loop remains responsive to /api/v1/datasets and other endpoints.
    """
    parser = get_terrain_parser()
    try:
        data, metadata = await asyncio.to_thread(parser.load, max_dim)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Terrain data not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Convert numpy float32 array to binary bytes
    binary_data = data.tobytes()

    headers = {
        "X-Terrain-Metadata": json.dumps(metadata)
    }

    return Response(
        content=binary_data,
        media_type="application/octet-stream",
        headers=headers
    )
