import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from backend.config import settings

from backend.services.catalog_service import catalog_service
from backend.api import datasets, observations, volume, geography
from backend.services.dataset_service import DatasetNotFoundError
from backend.services.observation_service import ObservationDatasetNotFoundError, InstrumentNotFoundError
from backend.validators.data_validator import ValidationError
from backend.api.ogc import OGCException, router as ogc_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    models_dir = os.path.join(settings.DATA_DIR, "models")
    obs_dir = os.path.join(settings.DATA_DIR, "observations")
    catalog_service.build_catalog(models_dir, obs_dir)
    yield

app = FastAPI(
    title="3D Ocean Data Visualization System API",
    version="1.0.0",
    description="Backend API for the INCOIS V1 3D Ocean Data Visualization System",
    lifespan=lifespan
)

# GZip middleware for compressing responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check() -> dict:
    """Basic health check endpoint."""
    return {"status": "ok"}

@app.exception_handler(DatasetNotFoundError)
@app.exception_handler(ObservationDatasetNotFoundError)
@app.exception_handler(InstrumentNotFoundError)
async def not_found_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=404,
        content={"error": True, "code": "DATASET_NOT_FOUND", "message": str(exc)}
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": True, "code": "VALIDATION_ERROR", "message": str(exc)}
    )

@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    with open("error_log.txt", "a") as f:
        f.write(f"422 on {request.url}: {exc.errors()}\n")
    return JSONResponse(
        status_code=422,
        content={"error": True, "code": "VALIDATION_ERROR", "message": "Invalid query parameters"}
    )

@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError):
    with open("error_log.txt", "a") as f:
        f.write(f"422 (ValueError) on {request.url}: {exc}\n")
    msg = str(exc)
    code = "VALIDATION_ERROR"
    if "not found in dataset" in msg.lower() and "variable" in msg.lower():
        code = "VARIABLE_NOT_FOUND"
    elif "u and v" in msg.lower():
        code = "NO_UV_DATA"
    return JSONResponse(
        status_code=422,
        content={"error": True, "code": code, "message": msg}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": True, "code": "SERVER_ERROR", "message": "An internal server error occurred."}
    )

@app.exception_handler(OGCException)
async def ogc_exception_handler(request: Request, exc: OGCException):
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<ServiceExceptionReport version="1.3.0" xmlns="http://www.opengis.net/ogc">
    <ServiceException code="{exc.code}">
        {exc.message}
    </ServiceException>
</ServiceExceptionReport>"""
    from fastapi import Response
    return Response(content=xml, media_type="text/xml", status_code=400)

app.include_router(datasets.router)
app.include_router(volume.router)
app.include_router(observations.router)
app.include_router(geography.router)
app.include_router(ogc_router)
