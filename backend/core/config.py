import os
from pathlib import Path
from typing import Dict, Any
import yaml
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = BASE_DIR / "configs"
STORAGE_DIR = BASE_DIR / "storage"

class Settings(BaseSettings):
    APP_NAME: str = "AI Industrial Billet Inspection Platform"
    APP_VERSION: str = "2.4.0-PROD"
    ENV: str = "production"
    DEBUG: bool = False
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'storage' / 'billet_inspection.db'}")
    
    # Storage Paths
    STORAGE_PATH: Path = STORAGE_DIR
    INSPECTION_IMAGES_PATH: Path = STORAGE_DIR / "inspection-images"
    DEFECT_CROPS_PATH: Path = STORAGE_DIR / "defect-crops"
    MASKS_PATH: Path = STORAGE_DIR / "masks"
    RAW_FRAMES_PATH: Path = STORAGE_DIR / "raw-frames"
    REPORTS_PATH: Path = STORAGE_DIR / "reports"
    EXPORTS_PATH: Path = STORAGE_DIR / "exports"
    
    # Config Files
    PLANT_CONFIG_PATH: Path = CONFIG_DIR / "plant.yaml"
    CAMERA_CONFIG_PATH: Path = CONFIG_DIR / "camera.yaml"
    TOLERANCES_CONFIG_PATH: Path = CONFIG_DIR / "tolerances.yaml"
    MODELS_CONFIG_PATH: Path = CONFIG_DIR / "models.yaml"
    ALERTS_CONFIG_PATH: Path = CONFIG_DIR / "alerts.yaml"

    def ensure_directories(self):
        for path in [
            self.STORAGE_PATH,
            self.INSPECTION_IMAGES_PATH,
            self.DEFECT_CROPS_PATH,
            self.MASKS_PATH,
            self.RAW_FRAMES_PATH,
            self.REPORTS_PATH,
            self.EXPORTS_PATH,
        ]:
            path.mkdir(parents=True, exist_ok=True)

    def load_yaml(self, path: Path) -> Dict[str, Any]:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        return {}

    @property
    def plant_config(self) -> Dict[str, Any]:
        return self.load_yaml(self.PLANT_CONFIG_PATH)

    @property
    def camera_config(self) -> Dict[str, Any]:
        return self.load_yaml(self.CAMERA_CONFIG_PATH)

    @property
    def tolerances_config(self) -> Dict[str, Any]:
        return self.load_yaml(self.TOLERANCES_CONFIG_PATH)

    @property
    def models_config(self) -> Dict[str, Any]:
        return self.load_yaml(self.MODELS_CONFIG_PATH)

    @property
    def alerts_config(self) -> Dict[str, Any]:
        return self.load_yaml(self.ALERTS_CONFIG_PATH)

settings = Settings()
settings.ensure_directories()
