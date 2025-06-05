import httpx
import asyncio
from typing import Optional, List
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models import Settings

class IPDetectionService:
    def __init__(self):
        # Default fallback URLs if settings not available
        self.default_ipv4_urls = [
            "https://api.ipify.org",
            "https://ifconfig.me/ip", 
            "https://icanhazip.com",
            "https://ident.me",
            "https://checkip.amazonaws.com"
        ]
        self.default_ipv6_urls = [
            "https://api6.ipify.org",
            "https://ifconfig.me/ip",
            "https://icanhazip.com", 
            "https://ident.me"
        ]

    def _get_urls_from_settings(self, setting_key: str, default_urls: List[str]) -> List[str]:
        """Get IP detection URLs from database settings"""
        db = SessionLocal()
        try:
            setting = db.query(Settings).filter(Settings.key == setting_key).first()
            if setting and isinstance(setting.value, list):
                return setting.value
            return default_urls
        except Exception:
            return default_urls
        finally:
            db.close()

    async def get_public_ipv4(self) -> Optional[str]:
        urls = self._get_urls_from_settings("ip_detection.ipv4_sources", self.default_ipv4_urls)
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            for url in urls:
                try:
                    response = await client.get(url)
                    if response.status_code == 200:
                        ip = response.text.strip()
                        if self._is_valid_ipv4(ip):
                            return ip
                except Exception:
                    continue
        return None

    async def get_public_ipv6(self) -> Optional[str]:
        urls = self._get_urls_from_settings("ip_detection.ipv6_sources", self.default_ipv6_urls)
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            for url in urls:
                try:
                    response = await client.get(url)
                    if response.status_code == 200:
                        ip = response.text.strip()
                        if self._is_valid_ipv6(ip):
                            return ip
                except Exception:
                    continue
        return None

    def _is_valid_ipv4(self, ip: str) -> bool:
        try:
            parts = ip.split('.')
            return len(parts) == 4 and all(0 <= int(part) <= 255 for part in parts)
        except:
            return False

    def _is_valid_ipv6(self, ip: str) -> bool:
        try:
            import ipaddress
            ipaddress.IPv6Address(ip)
            return True
        except:
            return False

ip_service = IPDetectionService()