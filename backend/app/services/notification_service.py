# backend/app/services/notification_service.py
from ..database import SessionLocal
from ..models.user import User
from ..models.payment import PaymentTransaction
from .websocket_manager import manager
from .email_service import email_service


async def notify_admin_new_payment(payment_id: int, user_id: int, user_email: str, user_name: str, plan_type: str, amount: float):
    """Notify admin about new payment via WebSocket and Email"""
    
    # Get admin users
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.role_type == "admin").all()
        
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        
        notification_data = {
            "type": "new_payment",
            "payment_id": payment_id,
            "user_id": user_id,
            "user_name": user_name,
            "user_email": user_email,
            "plan_type": plan_type,
            "amount": amount,
            "timestamp": datetime.utcnow().isoformat() if payment else None
        }
        
        # Send WebSocket notification to all connected admins
        for admin in admins:
            await manager.send_personal_message(notification_data, admin.id)
            print(f"📡 WebSocket notification sent to admin {admin.email}")
        
        # Send email notification to all admins
        admin_emails = [admin.email for admin in admins]
        if admin_emails:
            await send_admin_payment_notification_email(admin_emails, user_name, user_email, plan_type, amount)
            
    except Exception as e:
        print(f"Error sending admin notification: {e}")
    finally:
        db.close()


async def send_admin_payment_notification_email(admin_emails, user_name, user_email, plan_type, amount):
    """Send email notification to admins about new payment"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .button {{ background: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 New Payment Received!</h1>
            </div>
            <div class="content">
                <h2>Payment Details:</h2>
                <p><strong>User:</strong> {user_name} ({user_email})</p>
                <p><strong>Plan:</strong> {plan_type.upper()} Plan</p>
                <p><strong>Amount:</strong> ETB {amount:,.2f}</p>
                <p><strong>Status:</strong> Pending Approval</p>
                <a href="http://localhost:5173/admin/payment-approvals" class="button">Review Payment →</a>
            </div>
        </div>
    </body>
    </html>
    """
    
    for admin_email in admin_emails:
        await email_service.send_email(
            to_email=admin_email,
            subject=f"New Payment Pending Approval - {plan_type.upper()} Plan",
            html_content=html_content
        )


from datetime import datetime