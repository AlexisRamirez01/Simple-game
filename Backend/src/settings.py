"""Defines project settings"""

import os
from enum import Enum
from pydantic import IPvAnyAddress, PositiveInt
from pydantic_settings import BaseSettings

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  
DB_PATH = os.path.join(BASE_DIR, "deathOnTheCards.db")

class LoggingEnum(str, Enum):
    """Logging configuration Enum."""

    critical = "CRITICAL"
    error = "ERROR"
    warning = "WARNING"
    info = "INFO"
    debug = "DEBUG"


class Settings(BaseSettings):
    """Project settings definition"""

    ROOT_PATH: str = ""
    LOGLEVEL: LoggingEnum = "DEBUG"
    HOST: IPvAnyAddress = "0.0.0.0"
    PORT: PositiveInt = 8000
    DEBUG_MODE: bool = True
    DB_FILENAME: str = f"sqlite:///{DB_PATH}"

    # Timezone
    DEFAULT_TIMEZONE: str = "Etc/UTC"


settings = Settings()