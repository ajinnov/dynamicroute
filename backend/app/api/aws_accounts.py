from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, AWSAccount
from app.services.route53 import Route53Service

router = APIRouter()

class AWSAccountCreate(BaseModel):
    name: str
    access_key_id: str
    secret_access_key: str
    region: str = "eu-west-3"

class AWSAccountResponse(BaseModel):
    id: int
    name: str
    access_key_id: str
    region: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=AWSAccountResponse)
async def create_aws_account(
    account: AWSAccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        test_account = AWSAccount(
            name="test",
            access_key_id=account.access_key_id,
            secret_access_key=account.secret_access_key,
            region=account.region,
            user_id=current_user.id
        )
        route53_service = Route53Service(test_account)
        zones = await route53_service.list_hosted_zones()
        
        if not zones:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot access Route53 with provided credentials"
            )
        
        db_account = AWSAccount(
            name=account.name,
            access_key_id=account.access_key_id,
            secret_access_key=account.secret_access_key,
            region=account.region,
            user_id=current_user.id
        )
        db.add(db_account)
        db.commit()
        db.refresh(db_account)
        
        return db_account
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error validating AWS credentials: {str(e)}"
        )

@router.get("/", response_model=List[AWSAccountResponse])
async def list_aws_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    accounts = db.query(AWSAccount).filter(AWSAccount.user_id == current_user.id).all()
    return accounts

@router.delete("/{account_id}")
async def delete_aws_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(AWSAccount).filter(
        AWSAccount.id == account_id,
        AWSAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AWS account not found"
        )
    
    db.delete(account)
    db.commit()
    return {"message": "AWS account deleted successfully"}