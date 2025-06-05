from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(JSON, nullable=False)
    description = Column(String, nullable=True)
    is_system = Column(Boolean, default=False)  # System settings can't be deleted
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @classmethod
    def get_default_settings(cls):
        """Default system settings"""
        return [
            {
                "key": "ip_detection.ipv4_sources",
                "value": [
                    "https://api.ipify.org",
                    "https://ifconfig.me/ip",
                    "https://icanhazip.com",
                    "https://ident.me",
                    "https://checkip.amazonaws.com"
                ],
                "description": "List of IPv4 detection services",
                "is_system": True
            },
            {
                "key": "ip_detection.ipv6_sources", 
                "value": [
                    "https://api6.ipify.org",
                    "https://ifconfig.me/ip",
                    "https://icanhazip.com",
                    "https://ident.me"
                ],
                "description": "List of IPv6 detection services",
                "is_system": True
            },
            {
                "key": "scheduler.refresh_interval",
                "value": 300,  # 5 minutes in seconds
                "description": "DNS check interval in seconds",
                "is_system": True
            }
        ]