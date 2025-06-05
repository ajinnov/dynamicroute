from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class RecordType(enum.Enum):
    A = "A"
    AAAA = "AAAA"

class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    zone_id = Column(String, nullable=False)
    record_type = Column(Enum(RecordType), nullable=False)
    ttl = Column(Integer, default=300)
    current_ip = Column(String)
    last_updated = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    aws_account_id = Column(Integer, ForeignKey("aws_accounts.id"))
    slack_account_id = Column(Integer, ForeignKey("slack_accounts.id"), nullable=True)
    hosted_zone_id = Column(Integer, ForeignKey("hosted_zones.id"), nullable=True)  # Optional for backward compatibility
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    aws_account = relationship("AWSAccount", back_populates="domains")
    slack_account = relationship("SlackAccount", back_populates="domains")
    hosted_zone = relationship("HostedZone", back_populates="domains")
    user = relationship("User")