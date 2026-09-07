import os
import json
from dataclasses import dataclass
from typing import Dict, Any, Optional

@dataclass
class Region:
    west: float
    east: float
    south: float
    north: float
    
    def contains(self, lat: float, lon: float) -> bool:
        # Wrap lon to -180..180
        lon = (lon + 180) % 360 - 180
        if not (self.south <= lat <= self.north):
            return False
        if self.west <= self.east:
            return self.west <= lon <= self.east
        else:
            return lon >= self.west or lon <= self.east

@dataclass
class SourceConfig:
    enabled: bool
    source: str
    destination: str
    region: Optional[Region]
    max_files: int

def load_config(config_path: str = 'config/observation_sources.json') -> Dict[str, SourceConfig]:
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found: {config_path}")
        
    with open(config_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    configs = {}
    for key, val in data.items():
        region_data = val.get('region')
        region = None
        if region_data:
            region = Region(
                west=float(region_data['west']),
                east=float(region_data['east']),
                south=float(region_data['south']),
                north=float(region_data['north'])
            )
        
        configs[key] = SourceConfig(
            enabled=val.get('enabled', False),
            source=val.get('source', ''),
            destination=val.get('destination', ''),
            region=region,
            max_files=val.get('max_files', 10)
        )
    return configs
