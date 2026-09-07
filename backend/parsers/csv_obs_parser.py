from backend.parsers.base_parser import ObservationParser
from backend.models.schemas import ObsDatasetRecord, ProfileData

class CSVObsParser(ObservationParser):
    """
    Parser for CSV/ASCII observation files.
    Implementation pending detailed CSV schema definition.
    """
    
    def get_metadata(self, source: str, source_type: str = 'local') -> ObsDatasetRecord:
        if source_type != 'local':
            raise ValueError('CSV parser does not support remote OPeNDAP datasets.')
        if not os.path.exists(source):
            raise FileNotFoundError(f"Dataset not found: {source}")
            
        dataset_id = os.path.basename(source).replace('.csv', '')
        raise NotImplementedError("Blocked: CSV Observation Format Unspecified")

    def get_profile(self, source: str, source_type: str, instrument_id: str) -> ProfileData:
        if source_type != 'local':
            raise ValueError('CSV parser does not support remote OPeNDAP datasets.')
        raise NotImplementedError("Blocked: CSV Observation Format Unspecified")
