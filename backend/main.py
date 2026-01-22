from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import datetime, timezone
from contextlib import asynccontextmanager
import logging
import pytz

from database import engine, get_db, Base
from models import Reminder, ReminderStatus
from schemas import (
    ReminderCreate,
    ReminderUpdate,
    ReminderResponse,
    ReminderListResponse
)
from scheduler import start_scheduler, shutdown_scheduler
from config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    yield
    # Shutdown
    logger.info("Shutting down...")
    shutdown_scheduler()


app = FastAPI(
    title="CallMe Reminder API",
    description="API for managing phone call reminders",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "CallMe Reminder API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


def convert_to_utc(naive_dt: datetime, tz_name: str) -> datetime:
    """
    Convert a naive datetime (interpreted as being in tz_name timezone) to UTC.
    """
    try:
        # Get the timezone object
        tz = pytz.timezone(tz_name)
        # Localize the naive datetime to the specified timezone
        # This interprets the datetime as being in that timezone
        local_dt = tz.localize(naive_dt)
        # Convert to UTC
        utc_dt = local_dt.astimezone(pytz.UTC)
        return utc_dt
    except Exception as e:
        logger.error(f"Error converting timezone: {e}")
        # Fallback: treat as UTC
        return naive_dt.replace(tzinfo=timezone.utc)


@app.post("/api/reminders", response_model=ReminderResponse, status_code=201)
async def create_reminder(
    reminder_data: ReminderCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new reminder.
    """
    # Convert the scheduled time from user's timezone to UTC
    # The frontend sends a naive datetime (e.g., "2024-01-21T15:30:00")
    # along with the timezone it should be interpreted in
    naive_dt = reminder_data.scheduled_at.replace(tzinfo=None) if reminder_data.scheduled_at.tzinfo else reminder_data.scheduled_at
    scheduled_utc = convert_to_utc(naive_dt, reminder_data.timezone)
    
    # Validate that the scheduled time is in the future
    now = datetime.now(timezone.utc)
    
    logger.info(f"Creating reminder: naive_dt={naive_dt}, timezone={reminder_data.timezone}, scheduled_utc={scheduled_utc}, now={now}")
    
    if scheduled_utc <= now:
        raise HTTPException(
            status_code=400,
            detail="Scheduled time must be in the future"
        )
    
    reminder = Reminder(
        title=reminder_data.title,
        message=reminder_data.message,
        phone_number=reminder_data.phone_number,
        scheduled_at=scheduled_utc,
        timezone=reminder_data.timezone,
        status=ReminderStatus.SCHEDULED
    )
    
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    
    logger.info(f"Created reminder {reminder.id}: {reminder.title} scheduled for {scheduled_utc}")
    
    return reminder


@app.get("/api/reminders", response_model=ReminderListResponse)
async def list_reminders(
    status: Optional[ReminderStatus] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    List reminders with optional filtering and pagination.
    """
    query = db.query(Reminder)
    
    # Filter by status
    if status:
        query = query.filter(Reminder.status == status)
    
    # Search by title or message
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Reminder.title.ilike(search_term),
                Reminder.message.ilike(search_term)
            )
        )
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Order by scheduled_at (soonest first)
    reminders = query.order_by(Reminder.scheduled_at.asc()).offset(offset).limit(page_size).all()
    
    return ReminderListResponse(
        items=reminders,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@app.get("/api/reminders/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific reminder by ID.
    """
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return reminder


@app.put("/api/reminders/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: int,
    reminder_data: ReminderUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing reminder.
    """
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    # Can only update scheduled reminders
    if reminder.status != ReminderStatus.SCHEDULED:
        raise HTTPException(
            status_code=400,
            detail="Can only update scheduled reminders"
        )
    
    # Update fields
    update_data = reminder_data.model_dump(exclude_unset=True)
    
    if 'scheduled_at' in update_data and update_data['scheduled_at']:
        # Get the timezone (use updated timezone if provided, otherwise use existing)
        tz_name = update_data.get('timezone', reminder.timezone)
        
        # Convert the scheduled time from user's timezone to UTC
        naive_dt = update_data['scheduled_at'].replace(tzinfo=None) if update_data['scheduled_at'].tzinfo else update_data['scheduled_at']
        scheduled_utc = convert_to_utc(naive_dt, tz_name)
        
        now = datetime.now(timezone.utc)
        if scheduled_utc <= now:
            raise HTTPException(
                status_code=400,
                detail="Scheduled time must be in the future"
            )
        update_data['scheduled_at'] = scheduled_utc
    
    for field, value in update_data.items():
        setattr(reminder, field, value)
    
    db.commit()
    db.refresh(reminder)
    
    logger.info(f"Updated reminder {reminder.id}")
    
    return reminder


@app.delete("/api/reminders/{reminder_id}", status_code=204)
async def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a reminder.
    """
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    db.delete(reminder)
    db.commit()
    
    logger.info(f"Deleted reminder {reminder_id}")
    
    return None


@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """
    Get reminder statistics.
    """
    total = db.query(Reminder).count()
    scheduled = db.query(Reminder).filter(Reminder.status == ReminderStatus.SCHEDULED).count()
    completed = db.query(Reminder).filter(Reminder.status == ReminderStatus.COMPLETED).count()
    failed = db.query(Reminder).filter(Reminder.status == ReminderStatus.FAILED).count()
    in_progress = db.query(Reminder).filter(Reminder.status == ReminderStatus.IN_PROGRESS).count()
    
    return {
        "total": total,
        "scheduled": scheduled,
        "completed": completed,
        "failed": failed,
        "in_progress": in_progress
    }


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
