from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from database import SessionLocal
from models import Reminder, ReminderStatus
from vapi_service import vapi_service
import logging
import asyncio

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def process_due_reminders():
    """
    Check for reminders that are due and trigger calls for them.
    """
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        # Find all scheduled reminders that are due
        due_reminders = db.query(Reminder).filter(
            Reminder.status == ReminderStatus.SCHEDULED,
            Reminder.scheduled_at <= now
        ).all()
        
        if due_reminders:
            logger.info(f"Found {len(due_reminders)} due reminders to process")
        
        for reminder in due_reminders:
            # Mark as in progress
            reminder.status = ReminderStatus.IN_PROGRESS
            db.commit()
            
            logger.info(f"Processing reminder {reminder.id}: {reminder.title}")
            
            # Make the call
            success, call_id, error_message = await vapi_service.make_call(
                to_phone_number=reminder.phone_number,
                message=reminder.message,
                reminder_title=reminder.title
            )
            
            if success:
                reminder.status = ReminderStatus.COMPLETED
                reminder.call_id = call_id
                logger.info(f"Reminder {reminder.id} completed successfully. Call ID: {call_id}")
            else:
                reminder.status = ReminderStatus.FAILED
                reminder.error_message = error_message
                logger.error(f"Reminder {reminder.id} failed: {error_message}")
            
            db.commit()
            
    except Exception as e:
        logger.error(f"Error processing reminders: {str(e)}")
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """
    Start the background scheduler that checks for due reminders.
    """
    # Check for due reminders every 15 seconds
    scheduler.add_job(
        process_due_reminders,
        trigger=IntervalTrigger(seconds=15),
        id="process_due_reminders",
        name="Process due reminders",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started - checking for due reminders every 15 seconds")


def shutdown_scheduler():
    """
    Shutdown the scheduler gracefully.
    """
    scheduler.shutdown(wait=False)
    logger.info("Scheduler shutdown")
