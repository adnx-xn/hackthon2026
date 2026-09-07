import pytest
from backend.ingestion.config import Region, SourceConfig, load_config
import os
import json

def test_region_contains():
    r = Region(west=35, east=120, south=-30, north=40)
    assert r.contains(0, 50) == True
    assert r.contains(0, 30) == False
    assert r.contains(0, 130) == False
    assert r.contains(-40, 50) == False
    assert r.contains(50, 50) == False
    
    # Test wrapping
    r_dateline = Region(west=170, east=-170, south=-10, north=10)
    assert r_dateline.contains(0, 175) == True
    assert r_dateline.contains(0, -175) == True
    assert r_dateline.contains(0, 0) == False

def test_load_config(tmp_path):
    config_file = tmp_path / "test_sources.json"
    data = {
        "argo": {
            "enabled": True,
            "source": "ftp://test",
            "destination": "dest",
            "region": {"west": 1, "east": 2, "south": 3, "north": 4},
            "max_files": 5
        }
    }
    with open(config_file, "w") as f:
        json.dump(data, f)
        
    configs = load_config(str(config_file))
    assert 'argo' in configs
    assert configs['argo'].enabled == True
    assert configs['argo'].region.west == 1.0
    assert configs['argo'].max_files == 5
