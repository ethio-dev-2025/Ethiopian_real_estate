# backend/app/services/subscription_service.py
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..models import User
from ..database import SessionLocal
from .email_service import email_service
import asyncio

class SubscriptionService:
    """Service to check and notify users about subscription expirations"""
    
    def __init__(self):
        self.notification_days = [30, 15, 7, 3, 1]  # Notify at these days before expiry
    
    async def check_expired_subscriptions(self, db: Session):
        """Check for expired subscriptions and deactivate users"""
        now = datetime.utcnow()
        
        # Find expired subscriptions that are still marked active
        expired_users = db.query(User).filter(
            User.has_active_subscription == True,
            User.subscription_end_date < now,
            User.role_type != 'admin'
        ).all()
        
        expired_count = 0
        for user in expired_users:
            print(f"⏰ Expired subscription for user {user.email}")
            user.has_active_subscription = False
            user.can_create_listings = False
            expired_count += 1
            
            # Send expiration email
            await self.send_expiration_email(user)
        
        if expired_count > 0:
            db.commit()
            print(f"✅ Deactivated {expired_count} expired subscriptions")
        
        return expired_count
    
    async def check_expiring_soon(self, db: Session):
        """Check for subscriptions expiring soon and send notifications"""
        now = datetime.utcnow()
        
        for days in self.notification_days:
            # Find users expiring in exactly 'days' days
            target_date = now + timedelta(days=days)
            target_date_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            target_date_end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            expiring_users = db.query(User).filter(
                User.has_active_subscription == True,
                User.subscription_end_date.between(target_date_start, target_date_end),
                User.role_type != 'admin'
            ).all()
            
            for user in expiring_users:
                # Check if already notified (you may want a notification log table)
                days_remaining = (user.subscription_end_date - now).days
                print(f"⚠️ User {user.email} subscription expires in {days_remaining} days")
                
                # Send notification email
                await self.send_expiration_warning_email(user, days_remaining)
        
        return True
    
    async def send_expiration_email(self, user: User):
        """Send email when subscription expires"""
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head><title>Subscription Expired</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #ef4444;">⚠️ Your Subscription Has Expired</h2>
                <p>Hello <strong>{user.full_name or user.username}</strong>,</p>
                <p>Your subscription expired on <strong>{user.subscription_end_date.strftime('%B %d, %Y')}</strong>.</p>
                <p>You can no longer create new listings. To continue listing properties, please renew your subscription.</p>
                <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>Expired Plan:</strong> {user.subscription_plan or 'N/A'}</p>
                    <p><strong>Expired On:</strong> {user.subscription_end_date.strftime('%B %d, %Y')}</p>
                </div>
                <a href="http://localhost:5173/dashboard/subscription" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renew Subscription</a>
                <hr>
                <p style="color: #666; font-size: 12px;">EstateHub Real Estate</p>
            </body>
            </html>
            """
            
            await email_service.send_email(
                to_email=user.email,
                subject="⚠️ Your EstateHub Subscription Has Expired",
                html_content=html_content,
                text_content=f"Your subscription expired on {user.subscription_end_date.strftime('%B %d, %Y')}. Please renew to continue creating listings."
            )
            print(f"📧 Expiration email sent to {user.email}")
        except Exception as e:
            print(f"❌ Failed to send expiration email: {e}")
    
    async def send_expiration_warning_email(self, user: User, days_remaining: int):
        """Send warning email before subscription expires"""
        try:
            if days_remaining == 1:
                subject = "⚠️ Your Subscription Expires TOMORROW!"
                color = "#ef4444"
                urgency = "URGENT: "
            elif days_remaining <= 7:
                subject = f"⚠️ Your Subscription Expires in {days_remaining} Days"
                color = "#f59e0b"
                urgency = ""
            else:
                subject = f"Reminder: Your Subscription Expires in {days_remaining} Days"
                color = "#3b82f6"
                urgency = ""
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head><title>{subject}</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: {color};">{urgency}Subscription Expiring Soon</h2>
                <p>Hello <strong>{user.full_name or user.username}</strong>,</p>
                <p>Your EstateHub subscription will expire in <strong>{days_remaining} days</strong> on <strong>{user.subscription_end_date.strftime('%B %d, %Y')}</strong>.</p>
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>Current Plan:</strong> {user.subscription_plan or 'N/A'}</p>
                    <p><strong>Expiration Date:</strong> {user.subscription_end_date.strftime('%B %d, %Y')}</p>
                    <p><strong>Days Remaining:</strong> {days_remaining}</p>
                </div>
                <p>After expiration, you won't be able to create new listings. Renew now to avoid interruption.</p>
                <a href="http://localhost:5173/dashboard/subscription" style="background: {color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renew Subscription</a>
                <hr>
                <p style="color: #666; font-size: 12px;">EstateHub Real Estate</p>
            </body>
            </html>
            """
            
            await email_service.send_email(
                to_email=user.email,
                subject=subject,
                html_content=html_content,
                text_content=f"Your subscription expires in {days_remaining} days on {user.subscription_end_date.strftime('%B %d, %Y')}. Please renew to continue creating listings."
            )
            print(f"📧 Warning email sent to {user.email} ({days_remaining} days left)")
        except Exception as e:
            print(f"❌ Failed to send warning email: {e}")

# Singleton instance
subscription_service = SubscriptionService()


async def check_expired_subscriptions_background():
    """Background task to check expired subscriptions every hour"""
    while True:
        try:
            db = SessionLocal()
            await subscription_service.check_expired_subscriptions(db)
            await subscription_service.check_expiring_soon(db)
            db.close()
        except Exception as e:
            print(f"Error in subscription checker: {e}")
        
        # Wait 1 hour before next check
        await asyncio.sleep(3600)


# Add to your main.py startup:
# asyncio.create_task(check_expired_subscriptions_background())