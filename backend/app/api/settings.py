from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Union
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Settings

router = APIRouter()

class SettingUpdate(BaseModel):
    value: Union[List[str], int, str, Dict[str, Any]]

class SettingResponse(BaseModel):
    key: str
    value: Union[List[str], int, str, Dict[str, Any]]
    description: str
    is_system: bool
    
    class Config:
        from_attributes = True

@router.get("/", response_model=Dict[str, Any])
async def get_all_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all settings as a flat dictionary"""
    settings = db.query(Settings).all()
    
    result = {}
    for setting in settings:
        result[setting.key] = {
            "value": setting.value,
            "description": setting.description,
            "is_system": setting.is_system
        }
    
    return result

@router.get("/{setting_key}", response_model=SettingResponse)
async def get_setting(
    setting_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific setting by key"""
    setting = db.query(Settings).filter(Settings.key == setting_key).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setting not found"
        )
    
    return setting

@router.put("/{setting_key}", response_model=SettingResponse)
async def update_setting(
    setting_key: str,
    setting_data: SettingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a setting value"""
    setting = db.query(Settings).filter(Settings.key == setting_key).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setting not found"
        )
    
    # Validate setting-specific constraints
    if setting_key == "scheduler.refresh_interval":
        if not isinstance(setting_data.value, int) or setting_data.value < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh interval must be a positive integer (seconds)"
            )
    
    elif setting_key in ["ip_detection.ipv4_sources", "ip_detection.ipv6_sources"]:
        if not isinstance(setting_data.value, list) or len(setting_data.value) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="IP sources must be a non-empty list of URLs"
            )
        
        # Validate URLs
        for url in setting_data.value:
            if not isinstance(url, str) or not url.startswith(('http://', 'https://')):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid URL: {url}"
                )
    
    setting.value = setting_data.value
    db.commit()
    db.refresh(setting)
    
    # Restart scheduler if refresh interval was changed
    if setting_key == "scheduler.refresh_interval":
        try:
            from app.services.scheduler import scheduler
            scheduler.restart_with_new_interval()
        except Exception as e:
            print(f"Warning: Could not restart scheduler: {e}")
    
    return setting

@router.post("/reset/{setting_key}", response_model=SettingResponse)
async def reset_setting_to_default(
    setting_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset a setting to its default value"""
    setting = db.query(Settings).filter(Settings.key == setting_key).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setting not found"
        )
    
    # Get default value
    defaults = Settings.get_default_settings()
    default_setting = next((s for s in defaults if s["key"] == setting_key), None)
    
    if not default_setting:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No default value available for this setting"
        )
    
    setting.value = default_setting["value"]
    db.commit()
    db.refresh(setting)
    
    # Restart scheduler if refresh interval was reset
    if setting_key == "scheduler.refresh_interval":
        try:
            from app.services.scheduler import scheduler
            scheduler.restart_with_new_interval()
        except Exception as e:
            print(f"Warning: Could not restart scheduler: {e}")
    
    return setting