from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, AWSAccount, HostedZone
from app.services.route53 import Route53Service

router = APIRouter()

class HostedZoneResponse(BaseModel):
    id: str
    name: str
    comment: str
    is_private: bool
    record_count: int
    aws_account_id: int
    aws_account_name: str

class HostedZoneRefreshRequest(BaseModel):
    aws_account_id: int

@router.get("/", response_model=List[HostedZoneResponse])
async def list_hosted_zones(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get all hosted zones for the current user"""
    hosted_zones = db.query(HostedZone).join(AWSAccount).filter(
        AWSAccount.user_id == current_user.id
    ).all()
    
    return [
        HostedZoneResponse(
            id=zone.aws_zone_id,
            name=zone.name,
            comment=zone.comment or "",
            is_private=zone.is_private,
            record_count=zone.record_count,
            aws_account_id=zone.aws_account_id,
            aws_account_name=zone.aws_account.name
        )
        for zone in hosted_zones
    ]

@router.post("/refresh")
async def refresh_hosted_zones(
    request: HostedZoneRefreshRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Refresh hosted zones from AWS for a specific AWS account"""
    
    # Verify AWS account belongs to user
    aws_account = db.query(AWSAccount).filter(
        AWSAccount.id == request.aws_account_id,
        AWSAccount.user_id == current_user.id
    ).first()
    
    if not aws_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AWS account not found"
        )
    
    try:
        # Get hosted zones from AWS
        route53_service = Route53Service(aws_account)
        aws_zones = await route53_service.list_hosted_zones()
        
        # Update or create hosted zones in database
        for aws_zone in aws_zones:
            # Check if hosted zone already exists
            existing_zone = db.query(HostedZone).filter(
                HostedZone.aws_zone_id == aws_zone['id'],
                HostedZone.aws_account_id == aws_account.id
            ).first()
            
            if existing_zone:
                # Update existing zone
                existing_zone.name = aws_zone['name']
                existing_zone.comment = aws_zone['comment']
                existing_zone.is_private = aws_zone['is_private']
                existing_zone.record_count = aws_zone['record_count']
            else:
                # Create new zone
                new_zone = HostedZone(
                    aws_zone_id=aws_zone['id'],
                    name=aws_zone['name'],
                    comment=aws_zone['comment'],
                    is_private=aws_zone['is_private'],
                    record_count=aws_zone['record_count'],
                    aws_account_id=aws_account.id
                )
                db.add(new_zone)
        
        db.commit()
        
        return {"message": f"Refreshed {len(aws_zones)} hosted zones"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing hosted zones: {str(e)}"
        )