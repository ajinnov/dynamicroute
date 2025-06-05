from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str = "postgresql://user:password@db:5432/dynamicroute53"
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    ip_check_urls: list[str] = [
        "https://ipv4.icanhazip.com",
        "https://api.ipify.org",
        "https://checkip.amazonaws.com"
    ]
    
    ipv6_check_urls: list[str] = [
        "https://ipv6.icanhazip.com",
        "https://api6.ipify.org"
    ]
    
    update_interval_minutes: int = 5
    
    class Config:
        env_file = ".env"

settings = Settings()