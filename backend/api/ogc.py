from fastapi import APIRouter, Request, Query, Response
from backend.services.catalog_service import catalog_service
from backend.services.dataset_service import dataset_service

router = APIRouter(prefix="/api/v1/ogc", tags=["ogc"])

class OGCException(Exception):
    def __init__(self, message: str, code: str = "InvalidRequest"):
        self.message = message
        self.code = code

@router.get("/wms")
async def wms_endpoint(
    request: Request,
    service: str = Query(None, alias="SERVICE"),
    req: str = Query(None, alias="REQUEST"),
    version: str = Query(None, alias="VERSION"),
    layers: str = Query(None, alias="LAYERS"),
    styles: str = Query(None, alias="STYLES"),
    crs: str = Query(None, alias="CRS"),
    bbox: str = Query(None, alias="BBOX"),
    width: int = Query(None, alias="WIDTH"),
    height: int = Query(None, alias="HEIGHT"),
    format: str = Query(None, alias="FORMAT"),
    time: str = Query(None, alias="TIME"),
    elevation: float = Query(None, alias="ELEVATION"),
    transparent: str = Query("false", alias="TRANSPARENT"),
):
    if not service or service.upper() != "WMS":
        raise OGCException("SERVICE must be WMS", "InvalidParameterValue")
        
    req = req.upper() if req else ""
    if req == "GETCAPABILITIES":
        return wms_get_capabilities()
    elif req == "GETMAP":
        if not layers:
            raise OGCException("LAYERS parameter is required", "MissingParameterValue")
        if crs and crs.upper() != "EPSG:4326":
            raise OGCException("Unsupported CRS. Only EPSG:4326 is supported.", "InvalidCRS")
        if not bbox:
            raise OGCException("BBOX parameter is required", "MissingParameterValue")
        if not width or not height or width <= 0 or height <= 0:
            raise OGCException("WIDTH and HEIGHT must be positive integers", "InvalidParameterValue")
        if width > 4096 or height > 4096:
            raise OGCException("WIDTH or HEIGHT exceeds maximum allowed size (4096)", "InvalidParameterValue")
            
        try:
            min_lat, min_lon, max_lat, max_lon = map(float, bbox.split(","))
        except ValueError:
            raise OGCException("Invalid BBOX format. Expected min_lat,min_lon,max_lat,max_lon for EPSG:4326", "InvalidParameterValue")
            
        bbox_dict = {"min_lat": min_lat, "min_lon": min_lon, "max_lat": max_lat, "max_lon": max_lon}
        
        var = request.query_params.get("VARIABLE")
        
        dataset_id = layers
        record = catalog_service.get_model_dataset(dataset_id)
        if not record:
            raise OGCException(f"Layer {layers} not found.", "LayerNotDefined")
            
        if not var:
            var = record.variables[0] if record.variables else ""
            
        # Parse time index. Defaults to -1 (latest).
        time_idx = -1
        if time:
            try:
                time_idx = record.time_steps.index(time)
            except ValueError:
                raise OGCException(f"Invalid TIME {time}", "InvalidParameterValue")
                
        # Parse depth index. Defaults to 0 (surface).
        depth_idx = 0
        if elevation is not None:
            if record.depth_levels:
                depth_idx = min(range(len(record.depth_levels)), key=lambda i: abs(record.depth_levels[i] - elevation))
                
        cmap = request.query_params.get("CMAP", "viridis")
        is_log = request.query_params.get("LOG", "false").lower() == "true"
        
        try:
            png_bytes = await dataset_service.get_wms_map(
                dataset_id, var, bbox_dict, width, height, time_idx, depth_idx, cmap, is_log
            )
            return Response(content=png_bytes, media_type="image/png")
        except ValueError as e:
            raise OGCException(str(e), "InvalidParameterValue")
        except Exception as e:
            raise OGCException("Internal Server Error", "NoApplicableCode")
            
    else:
        raise OGCException("Unsupported REQUEST", "OperationNotSupported")

def wms_get_capabilities():
    records = catalog_service.list_model_datasets()
    layers_xml = ""
    for r in records:
        layers_xml += f"""
        <Layer queryable="1">
            <Name>{r.id}</Name>
            <Title>{r.name}</Title>
            <Abstract>{r.dataset_type} dataset with variables: {', '.join(r.variables)}</Abstract>
            <CRS>EPSG:4326</CRS>
            <EX_GeographicBoundingBox>
                <westBoundLongitude>{r.lon_min}</westBoundLongitude>
                <eastBoundLongitude>{r.lon_max}</eastBoundLongitude>
                <southBoundLatitude>{r.lat_min}</southBoundLatitude>
                <northBoundLatitude>{r.lat_max}</northBoundLatitude>
            </EX_GeographicBoundingBox>
            <BoundingBox CRS="EPSG:4326" minx="{r.lat_min}" miny="{r.lon_min}" maxx="{r.lat_max}" maxy="{r.lon_max}" />
        </Layer>
        """
        
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms">
    <Service>
        <Name>WMS</Name>
        <Title>INCOIS WMS Service</Title>
    </Service>
    <Capability>
        <Request>
            <GetCapabilities>
                <Format>text/xml</Format>
            </GetCapabilities>
            <GetMap>
                <Format>image/png</Format>
            </GetMap>
        </Request>
        <Layer>
            <Title>INCOIS Ocean Datasets</Title>
            <CRS>EPSG:4326</CRS>
            {layers_xml}
        </Layer>
    </Capability>
</WMS_Capabilities>"""
    return Response(content=xml, media_type="text/xml")


@router.get("/wcs")
async def wcs_endpoint(
    request: Request,
    service: str = Query(None, alias="SERVICE"),
    req: str = Query(None, alias="REQUEST"),
    coverage_id: str = Query(None, alias="COVERAGEID"),
):
    if not service or service.upper() != "WCS":
        raise OGCException("SERVICE must be WCS", "InvalidParameterValue")
        
    req = req.upper() if req else ""
    if req == "GETCAPABILITIES":
        return wcs_get_capabilities()
    elif req == "DESCRIBECOVERAGE":
        if not coverage_id:
            raise OGCException("COVERAGEID parameter is required", "MissingParameterValue")
        return wcs_describe_coverage(coverage_id)
    elif req == "GETCOVERAGE":
        if not coverage_id:
            raise OGCException("COVERAGEID parameter is required", "MissingParameterValue")
            
        var = request.query_params.get("VARIABLE")
        record = catalog_service.get_model_dataset(coverage_id)
        if not record:
            raise OGCException(f"Coverage {coverage_id} not found.", "NoSuchCoverage")
            
        if not var:
            var = record.variables[0] if record.variables else ""
            
        subsets = request.query_params.getlist("SUBSET")
        bbox_str = request.query_params.get("BBOX")
        min_lat, max_lat, min_lon, max_lon = -90, 90, -180, 180
        if bbox_str:
            try:
                min_lat, min_lon, max_lat, max_lon = map(float, bbox_str.split(","))
            except:
                raise OGCException("Invalid BBOX", "InvalidParameterValue")
                
        time_slice = (None, None)
        depth_slice = (None, None)
        
        for sub in subsets:
            if sub.startswith("lat("):
                try:
                    inner = sub[4:-1].split(",")
                    min_lat, max_lat = map(float, inner)
                except:
                    pass
            elif sub.startswith("lon("):
                try:
                    inner = sub[4:-1].split(",")
                    min_lon, max_lon = map(float, inner)
                except:
                    pass
            elif sub.startswith("time("):
                inner = sub[5:-1].split(",")
                time_slice = (inner[0], inner[1] if len(inner)>1 else inner[0])
            elif sub.startswith("depth("):
                try:
                    inner = sub[6:-1].split(",")
                    depth_slice = (float(inner[0]), float(inner[1]) if len(inner)>1 else float(inner[0]))
                except:
                    pass
                    
        bbox_dict = {"min_lat": min_lat, "min_lon": min_lon, "max_lat": max_lat, "max_lon": max_lon}
        
        try:
            nc_bytes = await dataset_service.get_wcs_coverage(
                coverage_id, var, bbox_dict, time_slice, depth_slice
            )
            return Response(content=nc_bytes, media_type="application/netcdf")
        except ValueError as e:
            raise OGCException(str(e), "InvalidParameterValue")
        except Exception as e:
            raise OGCException("Internal Server Error", "NoApplicableCode")
            
    else:
        raise OGCException("Unsupported REQUEST", "OperationNotSupported")

def wcs_get_capabilities():
    records = catalog_service.list_model_datasets()
    coverages_xml = ""
    for r in records:
        coverages_xml += f"""
        <wcs:CoverageSummary>
            <wcs:CoverageId>{r.id}</wcs:CoverageId>
        </wcs:CoverageSummary>
        """
        
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities version="2.0.1" xmlns:wcs="http://www.opengis.net/wcs/2.0">
    <ows:ServiceIdentification xmlns:ows="http://www.opengis.net/ows/2.0">
        <ows:Title>INCOIS WCS Service</ows:Title>
        <ows:ServiceType>OGC WCS</ows:ServiceType>
        <ows:ServiceTypeVersion>2.0.1</ows:ServiceTypeVersion>
    </ows:ServiceIdentification>
    <wcs:Contents>
        {coverages_xml}
    </wcs:Contents>
</wcs:Capabilities>"""
    return Response(content=xml, media_type="text/xml")

def wcs_describe_coverage(coverage_id: str):
    record = catalog_service.get_model_dataset(coverage_id)
    if not record:
        raise OGCException(f"Coverage {coverage_id} not found.", "NoSuchCoverage")
        
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<wcs:CoverageDescriptions version="2.0.1" xmlns:wcs="http://www.opengis.net/wcs/2.0">
    <wcs:CoverageDescription>
        <wcs:CoverageId>{record.id}</wcs:CoverageId>
        <gml:domainSet xmlns:gml="http://www.opengis.net/gml/3.2">
            <gml:Envelope srsName="http://www.opengis.net/def/crs/EPSG/0/4326">
                <gml:lowerCorner>{record.lat_min} {record.lon_min}</gml:lowerCorner>
                <gml:upperCorner>{record.lat_max} {record.lon_max}</gml:upperCorner>
            </gml:Envelope>
        </gml:domainSet>
    </wcs:CoverageDescription>
</wcs:CoverageDescriptions>"""
    return Response(content=xml, media_type="text/xml")
