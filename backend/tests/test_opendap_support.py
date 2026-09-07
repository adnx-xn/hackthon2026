import pytest
from unittest.mock import patch, MagicMock
from backend.parsers.netcdf_model_parser import NetCDFModelParser
from backend.models.schemas import DatasetRecord

def test_opendap_valid_url():
    parser = NetCDFModelParser()
    with patch("xarray.open_dataset") as mock_open:
        mock_ds = MagicMock()
        mock_ds.dims = {"depth": 1, "latitude": 1, "longitude": 1, "time": 1}
        mock_ds.variables = {"depth": [0], "latitude": [0], "longitude": [0], "time": [0]}
        mock_ds.coords = {"depth": [0], "latitude": [0], "longitude": [0], "time": [0]}
        # minimal mock for metadata
        mock_open.return_value.__enter__.return_value = mock_ds
        
        url = "http://test.opendap.org/ocean.nc"
        
        # Test just _open_dataset
        ds = parser._open_dataset(url, source_type="opendap")
        assert ds is not None
        mock_open.assert_called_with(url, decode_times=True)

def test_opendap_invalid_scheme():
    parser = NetCDFModelParser()
    with pytest.raises(ValueError, match="Invalid OPeNDAP URL scheme."):
        parser._open_dataset("file:///etc/passwd", source_type="opendap")
        
    with pytest.raises(ValueError, match="Invalid OPeNDAP URL scheme."):
        parser._open_dataset("ftp://test.org/ocean.nc", source_type="opendap")

def test_opendap_network_error():
    parser = NetCDFModelParser()
    with patch("xarray.open_dataset", side_effect=Exception("Connection Timeout")) as mock_open:
        url = "http://test.opendap.org/timeout.nc"
        with pytest.raises(ValueError, match="Failed to access remote OPeNDAP dataset."):
            parser._open_dataset(url, source_type="opendap")

def test_local_file_fallback_preservation():
    parser = NetCDFModelParser()
    with patch("os.path.exists", return_value=False):
        with pytest.raises(FileNotFoundError, match="Dataset not found"):
            parser._open_dataset("/nonexistent/file.nc", source_type="local")
