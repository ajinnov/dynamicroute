from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, SlackAccount
from app.services.slack_notification import SlackNotificationService

router = APIRouter()

class SlackAccountCreate(BaseModel):
    name: str
    webhook_url: HttpUrl

class SlackAccountResponse(BaseModel):
    id: int
    name: str
    webhook_url: str
    is_active: bool
    
    class Config:
        from_attributes = True

class SlackAccountUpdate(BaseModel):
    name: str = None
    webhook_url: HttpUrl = None
    is_active: bool = None

@router.post("/", response_model=SlackAccountResponse)
async def create_slack_account(
    account: SlackAccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un compte Slack"""
    # Créer le compte temporaire pour tester
    test_account = SlackAccount(
        name=account.name,
        webhook_url=str(account.webhook_url),
        user_id=current_user.id
    )
    
    # Tester le webhook
    slack_service = SlackNotificationService(test_account)
    test_result = await slack_service.test_webhook()
    
    if not test_result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de se connecter au webhook Slack. Vérifiez l'URL."
        )
    
    # Créer le compte en base
    db_account = SlackAccount(
        name=account.name,
        webhook_url=str(account.webhook_url),
        user_id=current_user.id
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    return db_account

@router.get("/", response_model=List[SlackAccountResponse])
async def list_slack_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lister les comptes Slack"""
    accounts = db.query(SlackAccount).filter(SlackAccount.user_id == current_user.id).all()
    return accounts

@router.put("/{account_id}", response_model=SlackAccountResponse)
async def update_slack_account(
    account_id: int,
    account_data: SlackAccountUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un compte Slack"""
    account = db.query(SlackAccount).filter(
        SlackAccount.id == account_id,
        SlackAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compte Slack introuvable"
        )
    
    # Tester le nouveau webhook si l'URL change
    if account_data.webhook_url and str(account_data.webhook_url) != account.webhook_url:
        test_account = SlackAccount(
            name=account_data.name or account.name,
            webhook_url=str(account_data.webhook_url),
            user_id=current_user.id
        )
        slack_service = SlackNotificationService(test_account)
        test_result = await slack_service.test_webhook()
        
        if not test_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de se connecter au nouveau webhook Slack"
            )
    
    # Mettre à jour les champs
    if account_data.name is not None:
        account.name = account_data.name
    if account_data.webhook_url is not None:
        account.webhook_url = str(account_data.webhook_url)
    if account_data.is_active is not None:
        account.is_active = account_data.is_active
    
    db.commit()
    db.refresh(account)
    return account

@router.post("/{account_id}/test")
async def test_slack_webhook(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tester un webhook Slack"""
    account = db.query(SlackAccount).filter(
        SlackAccount.id == account_id,
        SlackAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compte Slack introuvable"
        )
    
    slack_service = SlackNotificationService(account)
    test_result = await slack_service.test_webhook()
    
    if not test_result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Échec du test webhook Slack"
        )
    
    return {"message": "Test webhook réussi !"}

@router.delete("/{account_id}")
async def delete_slack_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un compte Slack"""
    account = db.query(SlackAccount).filter(
        SlackAccount.id == account_id,
        SlackAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compte Slack introuvable"
        )
    
    db.delete(account)
    db.commit()
    return {"message": "Compte Slack supprimé avec succès"}