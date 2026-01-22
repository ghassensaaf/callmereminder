from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from database import Base
import enum


class ReminderStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    FAILED = "failed"
    IN_PROGRESS = "in_progress"


class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(String(1000), nullable=False)
    phone_number = Column(String(20), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String(50), nullable=False)
    status = Column(
        SQLEnum(ReminderStatus),
        default=ReminderStatus.SCHEDULED,
        nullable=False
    )
    call_id = Column(String(255), nullable=True)  # Vapi call ID
    error_message = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
