import os
import pytest
from backend.parsers.ctd_parser import CTDParser
from backend.parsers.bgc_parser import BGCParser
from backend.parsers.mooring_parser import MooringParser
from backend.parsers.adcp_parser import ADCPParser
from backend.parsers.hf_radar_parser import HFRadarParser

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "obs")

def test_ctd_parser():
    file_path = os.path.join(FIXTURES_DIR, "ctd_test.nc")
    parser = CTDParser()
    meta = parser.get_metadata(file_path)
    
    assert meta.instrument_type == "ctd"
    assert meta.instrument_count == 1
    assert meta.instruments[0].id == "CTD_001"
    assert "temperature" in meta.instruments[0].available_profile_vars
    assert "salinity" in meta.instruments[0].available_profile_vars
    
    profile = parser.get_profile(file_path, 'local', "CTD_001")
    assert profile.instrument_type == "ctd"
    assert len(profile.depths) == 4
    assert profile.depths == [0, 10, 50, 100]
    assert "temperature" in profile.profiles
    assert profile.profiles["temperature"][0] == 25.0

def test_bgc_parser():
    file_path = os.path.join(FIXTURES_DIR, "bgc_test.nc")
    parser = BGCParser()
    meta = parser.get_metadata(file_path)
    
    assert meta.instrument_type == "bgc"
    assert meta.instruments[0].id == "BGC_001"
    assert "chlorophyll" in meta.instruments[0].available_profile_vars
    
    profile = parser.get_profile(file_path, 'local', "BGC_001")
    assert profile.instrument_type == "bgc"
    assert len(profile.depths) == 3
    assert profile.profiles["chlorophyll"][0] == 0.5

def test_mooring_parser():
    file_path = os.path.join(FIXTURES_DIR, "mooring_test.nc")
    parser = MooringParser()
    meta = parser.get_metadata(file_path)
    
    assert meta.instrument_type == "mooring"
    assert meta.instruments[0].id == "MOORING_001"
    assert meta.instruments[0].lat == 8.0
    assert meta.instruments[0].lon == 75.0
    assert meta.instruments[0].depth == 10.0
    
    profile = parser.get_profile(file_path, 'local', "MOORING_001")
    assert profile.instrument_type == "mooring"
    # depth_list should have 1 item since mooring has fixed depth
    assert len(profile.depths) == 1
    assert profile.depths[0] == 10.0
    assert profile.profiles["temperature"][0] == 28.1  # The last time index

def test_adcp_parser():
    file_path = os.path.join(FIXTURES_DIR, "adcp_test.nc")
    parser = ADCPParser()
    meta = parser.get_metadata(file_path)
    
    assert meta.instrument_type == "adcp"
    assert meta.instruments[0].id == "ADCP_001"
    
    profile = parser.get_profile(file_path, 'local', "ADCP_001")
    assert profile.instrument_type == "adcp"
    assert len(profile.depths) == 4
    assert profile.depths == [5, 15, 25, 35]
    assert "u" in profile.profiles
    assert "v" in profile.profiles
    assert profile.profiles["u"][0] == 0.5

def test_hf_radar_parser():
    file_path = os.path.join(FIXTURES_DIR, "hf_radar_test.nc")
    parser = HFRadarParser()
    meta = parser.get_metadata(file_path)
    
    assert meta.instrument_type == "hf_radar"
    # Should create multiple instrument records for grid points (3x3 grid)
    # Total 9 points, but nan values might be skipped. We have 1 nan in U,V
    assert meta.instrument_count == 8
    
    # test one valid point
    valid_id = "HFR_0_0"
    profile = parser.get_profile(file_path, 'local', valid_id)
    assert profile.instrument_type == "hf_radar"
    assert profile.depths == [0.0]
    assert profile.profiles["u"][0] == 0.1
    assert profile.profiles["v"][0] == 0.0
