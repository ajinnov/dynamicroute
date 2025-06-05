from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Domain, AWSAccount
from app.services.ip_detection import ip_service

router = APIRouter()

class DashboardStats(BaseModel):
    total_domains: int
    active_domains: int
    total_aws_accounts: int
    current_ipv4: Optional[str] = None
    current_ipv6: Optional[str] = None

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_domains = db.query(Domain).filter(Domain.user_id == current_user.id).count()
    active_domains = db.query(Domain).filter(
        Domain.user_id == current_user.id,
        Domain.is_active == True
    ).count()
    total_aws_accounts = db.query(AWSAccount).filter(AWSAccount.user_id == current_user.id).count()
    
    current_ipv4 = await ip_service.get_public_ipv4()
    current_ipv6 = await ip_service.get_public_ipv6()
    
    return DashboardStats(
        total_domains=total_domains,
        active_domains=active_domains,
        total_aws_accounts=total_aws_accounts,
        current_ipv4=current_ipv4,
        current_ipv6=current_ipv6
    )