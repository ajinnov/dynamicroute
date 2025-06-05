from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class SlackAccount(Base):
    __tablename__ = "slack_accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    webhook_url = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    domains = relationship("Domain", back_populates="slack_account")