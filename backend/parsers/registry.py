from typing import Dict, Type
from backend.parsers.base_parser import BaseParser

class ParserRegistry:
    """Registry for managing and resolving dataset parsers."""
    
    def __init__(self):
        self._parsers: Dict[str, Type[BaseParser]] = {}

    def register(self, format_name: str, parser_class: Type[BaseParser]) -> None:
        """Register a parser class for a given format name."""
        self._parsers[format_name] = parser_class

    def get_parser(self, format_name: str) -> Type[BaseParser]:
        """Get the parser class for a given format name."""
        if format_name not in self._parsers:
            raise ValueError(f"No parser registered for format: {format_name}")
        return self._parsers[format_name]

# Global singleton registry
parser_registry = ParserRegistry()

# Register parsers
from backend.parsers.netcdf_model_parser import NetCDFModelParser
from backend.parsers.netcdf_obs_parser import NetCDFObsParser
from backend.parsers.csv_obs_parser import CSVObsParser
from backend.parsers.ctd_parser import CTDParser
from backend.parsers.bgc_parser import BGCParser
from backend.parsers.mooring_parser import MooringParser
from backend.parsers.adcp_parser import ADCPParser
from backend.parsers.hf_radar_parser import HFRadarParser

parser_registry.register('netcdf', NetCDFModelParser)
parser_registry.register('netcdf_obs', NetCDFObsParser)
parser_registry.register('csv', CSVObsParser)
parser_registry.register('netcdf_ctd', CTDParser)
parser_registry.register('netcdf_bgc', BGCParser)
parser_registry.register('netcdf_mooring', MooringParser)
parser_registry.register('netcdf_adcp', ADCPParser)
parser_registry.register('netcdf_hf_radar', HFRadarParser)
