import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    DATA_DIR: str = os.getenv("DATA_DIR", str(BASE_DIR / "data"))
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "true").lower() in ("true", "1", "t")
    MAX_GRID_POINTS: int = int(os.getenv("MAX_GRID_POINTS", "40000"))

settings = Settings()
