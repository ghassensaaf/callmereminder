from pydantic import BaseModel, Field, field_validator, field_serializer
from datetime import datetime, timezone
from typing import Optional, List
from models import ReminderStatus
import re


class ReminderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=1000)
    phone_number: str = Field(..., min_length=10, max_length=20)
    scheduled_at: datetime
    timezone: str = Field(..., min_length=1, max_length=50)
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        # E.164 format: + followed by 1-15 digits
        pattern = r'^\+[1-9]\d{1,14}$'
        if not re.match(pattern, v):
            raise ValueError('Phone number must be in E.164 format (e.g., +14155552671)')
        return v


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    message: Optional[str] = Field(None, min_length=1, max_length=1000)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=20)
    scheduled_at: Optional[datetime] = None
    timezone: Optional[str] = Field(None, min_length=1, max_length=50)
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        pattern = r'^\+[1-9]\d{1,14}$'
        if not re.match(pattern, v):
            raise ValueError('Phone number must be in E.164 format (e.g., +14155552671)')
        return v


class ReminderResponse(ReminderBase):
    id: int
    status: ReminderStatus
    call_id: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
    
    @field_serializer('scheduled_at', 'created_at', 'updated_at')
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        """Ensure datetimes are serialized as ISO strings with UTC timezone (Z suffix)"""
        if dt is None:
            return None
        # If datetime is naive, assume it's UTC
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        # Convert to UTC and format with Z suffix
        return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


class ReminderListResponse(BaseModel):
    items: List[ReminderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
