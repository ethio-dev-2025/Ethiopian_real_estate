from sqlalchemy.orm import Session
from ..models import Notification
import json

def create_notification(db: Session, user_id: int, type: str, title: str, message: str, link: str = None, icon: str = None, extra_data: dict = None):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
        icon=icon,
        extra_data=json.dumps(extra_data) if extra_data else None
    )
    db.add(notification)
    db.commit()
    return notification

def notify_new_message(db: Session, receiver_id: int, sender_name: str):
    """Notify user about new message"""
    return create_notification(
        db=db,
        user_id=receiver_id,
        type="message",
        title="New Message",
        message=f"You have a new message from {sender_name}",
        link="/messages",
        icon="MessageSquare"
    )

def notify_listing_approved(db: Session, user_id: int, listing_title: str):
    """Notify seller about listing approval"""
    return create_notification(
        db=db,
        user_id=user_id,
        type="listing",
        title="Listing Approved",
        message=f"Your property '{listing_title}' has been approved",
        link="/dashboard",
        icon="Home"
    )

def notify_verification_complete(db: Session, user_id: int):
    """Notify user about verification completion"""
    return create_notification(
        db=db,
        user_id=user_id,
        type="verification",
        title="Verification Complete",
        message="Your account has been successfully verified",
        link="/dashboard",
        icon="CheckCircle"
    )

def notify_payment_received(db: Session, user_id: int, amount: float):
    """Notify user about payment received"""
    return create_notification(
        db=db,
        user_id=user_id,
        type="payment",
        title="Payment Received",
        message=f"Payment of ${amount} has been received successfully",
        link="/subscription",
        icon="CreditCard"
    )
