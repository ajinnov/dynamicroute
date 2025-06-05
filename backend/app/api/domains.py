from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Domain, AWSAccount, SlackAccount, RecordType
from app.services.route53 import Route53Service
from app.services.ip_detection import ip_service
from app.services.slack_notification import SlackNotificationService

router = APIRouter()

class DomainCreate(BaseModel):
    name: str
    zone_id: str
    record_type: RecordType
    ttl: int = 300
    aws_account_id: int
    slack_account_id: Optional[int] = None

class DomainResponse(BaseModel):
    id: int
    name: str
    zone_id: str
    record_type: RecordType
    ttl: int
    current_ip: Optional[str]
    last_updated: Optional[datetime]
    is_active: bool
    aws_account_id: int
    slack_account_id: Optional[int]
    
    class Config:
        from_attributes = True

class DomainUpdate(BaseModel):
    name: Optional[str] = None
    zone_id: Optional[str] = None
    record_type: Optional[RecordType] = None
    ttl: Optional[int] = None
    aws_account_id: Optional[int] = None
    slack_account_id: Optional[int] = None
    is_active: Optional[bool] = None

@router.post("/", response_model=DomainResponse)
async def create_domain(
    domain: DomainCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    aws_account = db.query(AWSAccount).filter(
        AWSAccount.id == domain.aws_account_id,
        AWSAccount.user_id == current_user.id
    ).first()
    
    if not aws_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AWS account not found"
        )
    
    # Vérifier le compte Slack si fourni
    if domain.slack_account_id:
        slack_account = db.query(SlackAccount).filter(
            SlackAccount.id == domain.slack_account_id,
            SlackAccount.user_id == current_user.id,
            SlackAccount.is_active == True
        ).first()
        
        if not slack_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Compte Slack introuvable ou inactif"
            )
    
    db_domain = Domain(
        name=domain.name,
        zone_id=domain.zone_id,
        record_type=domain.record_type,
        ttl=domain.ttl,
        aws_account_id=domain.aws_account_id,
        slack_account_id=domain.slack_account_id,
        user_id=current_user.id
    )
    db.add(db_domain)
    db.commit()
    db.refresh(db_domain)
    
    return db_domain

@router.get("/", response_model=List[DomainResponse])
async def list_domains(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    domains = db.query(Domain).filter(Domain.user_id == current_user.id).all()
    return domains

@router.put("/{domain_id}", response_model=DomainResponse)
async def update_domain(
    domain_id: int,
    domain_data: DomainUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un domaine"""
    domain = db.query(Domain).filter(
        Domain.id == domain_id,
        Domain.user_id == current_user.id
    ).first()
    
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found"
        )
    
    # Valider le compte AWS si changé
    if domain_data.aws_account_id and domain_data.aws_account_id != domain.aws_account_id:
        aws_account = db.query(AWSAccount).filter(
            AWSAccount.id == domain_data.aws_account_id,
            AWSAccount.user_id == current_user.id
        ).first()
        
        if not aws_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AWS account not found"
            )
    
    # Valider le compte Slack si changé
    if domain_data.slack_account_id and domain_data.slack_account_id != domain.slack_account_id:
        slack_account = db.query(SlackAccount).filter(
            SlackAccount.id == domain_data.slack_account_id,
            SlackAccount.user_id == current_user.id,
            SlackAccount.is_active == True
        ).first()
        
        if not slack_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Compte Slack introuvable ou inactif"
            )
    
    # Si le type d'enregistrement change, réinitialiser l'IP
    if domain_data.record_type and domain_data.record_type != domain.record_type:
        domain.current_ip = None
        domain.last_updated = None
    
    # Mettre à jour les champs
    if domain_data.name is not None:
        domain.name = domain_data.name
    if domain_data.zone_id is not None:
        domain.zone_id = domain_data.zone_id
    if domain_data.record_type is not None:
        domain.record_type = domain_data.record_type
    if domain_data.ttl is not None:
        domain.ttl = domain_data.ttl
    if domain_data.aws_account_id is not None:
        domain.aws_account_id = domain_data.aws_account_id
    if domain_data.slack_account_id is not None:
        domain.slack_account_id = domain_data.slack_account_id
    elif domain_data.slack_account_id == 0:  # Permet de désactiver Slack
        domain.slack_account_id = None
    if domain_data.is_active is not None:
        domain.is_active = domain_data.is_active
    
    db.commit()
    db.refresh(domain)
    return domain

@router.put("/{domain_id}/update-ip")
async def update_domain_ip(
    domain_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    domain = db.query(Domain).filter(
        Domain.id == domain_id,
        Domain.user_id == current_user.id
    ).first()
    
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found"
        )
    
    if domain.record_type == RecordType.A:
        new_ip = await ip_service.get_public_ipv4()
    else:
        new_ip = await ip_service.get_public_ipv6()
    
    if not new_ip:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not detect public IP"
        )
    
    old_ip = domain.current_ip
    
    if domain.current_ip == new_ip:
        return {"message": "IP unchanged", "current_ip": new_ip}
    
    route53_service = Route53Service(domain.aws_account)
    success = await route53_service.update_record(domain, new_ip)
    
    if success:
        domain.current_ip = new_ip
        domain.last_updated = datetime.utcnow()
        db.commit()
        
        # Envoyer la notification Slack si configurée
        if domain.slack_account and domain.slack_account.is_active:
            try:
                slack_service = SlackNotificationService(domain.slack_account)
                await slack_service.send_ip_change_notification(domain, old_ip, new_ip)
            except Exception as e:
                print(f"Erreur notification Slack pour {domain.name}: {e}")
        
        return {"message": "IP updated successfully", "new_ip": new_ip}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update DNS record"
        )

@router.delete("/{domain_id}")
async def delete_domain(
    domain_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    domain = db.query(Domain).filter(
        Domain.id == domain_id,
        Domain.user_id == current_user.id
    ).first()
    
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found"
        )
    
    db.delete(domain)
    db.commit()
    return {"message": "Domain deleted successfully"}