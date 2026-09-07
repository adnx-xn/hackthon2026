import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.main import app

client = TestClient(app)

def test_wcs_get_capabilities():
    response = client.get("/api/v1/ogc/wcs?SERVICE=WCS&REQUEST=GetCapabilities")
    assert response.status_code == 200
    assert "text/xml" in response.headers["content-type"]
    assert "version=\"2.0.1\"" in response.text

def test_wcs_describe_coverage_missing_id():
    response = client.get("/api/v1/ogc/wcs?SERVICE=WCS&REQUEST=DescribeCoverage")
    assert response.status_code == 400
    assert "COVERAGEID parameter is required" in response.text

def test_wcs_describe_coverage_not_found():
    response = client.get("/api/v1/ogc/wcs?SERVICE=WCS&REQUEST=DescribeCoverage&COVERAGEID=nonexistent")
    assert response.status_code == 400
    assert "Coverage nonexistent not found" in response.text

def test_wcs_get_coverage_missing_id():
    response = client.get("/api/v1/ogc/wcs?SERVICE=WCS&REQUEST=GetCoverage")
    assert response.status_code == 400
    assert "COVERAGEID parameter is required" in response.text

@patch("backend.services.dataset_service.DatasetService.get_wcs_coverage")
@patch("backend.services.catalog_service.CatalogService.get_model_dataset")
def test_wcs_get_coverage_success(mock_get_dataset, mock_get_wcs_coverage):
    mock_get_dataset.return_value = MagicMock(variables=["temp"])
    mock_get_wcs_coverage.return_value = b"fake_netcdf_bytes"
    
    response = client.get("/api/v1/ogc/wcs?SERVICE=WCS&REQUEST=GetCoverage&COVERAGEID=dummy")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/netcdf"
    assert response.content == b"fake_netcdf_bytes"
