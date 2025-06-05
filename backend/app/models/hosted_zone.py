from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(Integer, primary_key=True, index=True)
    aws_zone_id = Column(String, unique=True, index=True, nullable=False)  # Z1D633PJN98FT9
    name = Column(String, nullable=False)  # example.com.
    comment = Column(String)
    is_private = Column(Boolean, default=False)
    record_count = Column(Integer, default=0)
    
    # Relations
    aws_account_id = Column(Integer, ForeignKey("aws_accounts.id"), nullable=False)
    aws_account = relationship("AWSAccount", back_populates="hosted_zones")
    domains = relationship("Domain", back_populates="hosted_zone")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())