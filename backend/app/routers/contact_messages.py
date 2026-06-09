# backend/app/routers/contact_messages.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..database import get_db
from ..models import User
from ..models.contact_message import ContactMessage
from .auth import get_current_user, get_current_admin_user
from .websocket import manager
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import ssl

router = APIRouter()

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

class SendReplyRequest(BaseModel):
    message_id: Optional[int] = None
    to_email: str
    subject: str
    message: str

# Email configuration - Using your existing .env settings
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "melkamuenyew97@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "dmyvpcixleccirzt")
FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "melkamuenyew97@gmail.com")
FROM_NAME = os.getenv("SMTP_FROM_NAME", "EstateHub")

def send_email_background(to_email: str, subject: str, html_content: str, text_content: str):
    """Send email in background using SMTP with detailed error logging"""
    try:
        print(f"\n{'='*50}")
        print(f"📧 ATTEMPTING TO SEND EMAIL")
        print(f"{'='*50}")
        print(f"   To: {to_email}")
        print(f"   Subject: {subject}")
        print(f"   SMTP Host: {SMTP_HOST}:{SMTP_PORT}")
        print(f"   SMTP User: {SMTP_USER}")
        print(f"   From: {FROM_NAME} <{FROM_EMAIL}>")
        print(f"{'='*50}\n")
        
        # Validate credentials
        if not SMTP_USER or not SMTP_PASSWORD:
            print("❌ ERROR: SMTP_USER or SMTP_PASSWORD is empty!")
            print("   Please check your .env file")
            return
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Reply-To"] = FROM_EMAIL
        
        # Attach plain text and HTML versions
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email using SMTP
        print("📡 Connecting to SMTP server...")
        
        # For Gmail, create SSL context
        context = ssl.create_default_context()
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.set_debuglevel(1)  # Enable debug output
            print("   - Connecting...")
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            print("   - TLS started")
            print(f"   - Logging in as {SMTP_USER}...")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print("   - Login successful")
            print(f"   - Sending email to {to_email}...")
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
            print("   - Email sent successfully!")
            
        print(f"\n✅ EMAIL SENT SUCCESSFULLY to {to_email}\n")
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"\n❌ SMTP AUTHENTICATION ERROR: {e}")
        print("   Possible causes:")
        print("   1. Incorrect email or password")
        print("   2. Gmail requires an 'App Password' not your regular password")
        print("   3. Less secure app access is disabled")
        print("\n   For Gmail App Password:")
        print("   1. Go to https://myaccount.google.com/apppasswords")
        print("   2. Select 'Mail' and 'Windows Computer'")
        print("   3. Generate a 16-character password")
        print("   4. Update SMTP_PASSWORD in .env file\n")
    except smtplib.SMTPException as e:
        print(f"\n❌ SMTP ERROR: {e}\n")
    except Exception as e:
        print(f"\n❌ FAILED TO SEND EMAIL: {e}\n")
        import traceback
        traceback.print_exc()

# Public endpoint - anyone can submit contact form
@router.post("/submit")
async def submit_contact_message(
    message_data: ContactMessageCreate,
    db: Session = Depends(get_db)
):
    """Submit a contact message from the website"""
    try:
        # Save to database
        new_message = ContactMessage(
            name=message_data.name,
            email=message_data.email,
            phone=message_data.phone,
            subject=message_data.subject,
            message=message_data.message,
            is_read=False,
            is_replied=False,
            created_at=datetime.utcnow()
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        print(f"📝 New contact message from {message_data.name} ({message_data.email})")
        
        # Notify all online admins via WebSocket
        try:
            admins = db.query(User).filter(User.role_type == 'admin').all()
            
            for admin in admins:
                await manager.send_personal_message({
                    "type": "new_contact_message",
                    "message": {
                        "id": new_message.id,
                        "name": new_message.name,
                        "email": new_message.email,
                        "subject": new_message.subject,
                        "message": new_message.message[:100] + "..." if len(new_message.message) > 100 else new_message.message,
                        "created_at": new_message.created_at.isoformat()
                    }
                }, admin.id)
        except Exception as ws_error:
            print(f"WebSocket notification error: {ws_error}")
        
        return {
            "success": True,
            "message": "Your message has been sent. We'll get back to you soon!",
            "message_id": new_message.id
        }
        
    except Exception as e:
        print(f"Error submitting contact message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoint - get all contact messages
@router.get("/admin/messages")
async def get_contact_messages(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    status: str = "all",
    limit: int = 100,
    offset: int = 0
):
    """Get all contact messages (admin only)"""
    try:
        query = db.query(ContactMessage)
        
        if status == "unread":
            query = query.filter(ContactMessage.is_read == False)
        elif status == "read":
            query = query.filter(ContactMessage.is_read == True)
        
        total = query.count()
        messages = query.order_by(desc(ContactMessage.created_at)).offset(offset).limit(limit).all()
        
        return {
            "success": True,
            "total": total,
            "messages": [msg.to_dict() for msg in messages]
        }
        
    except Exception as e:
        print(f"Error fetching contact messages: {e}")
        return {"success": False, "total": 0, "messages": []}

# Admin endpoint - mark message as read
@router.post("/admin/messages/{message_id}/read")
async def mark_contact_message_read(
    message_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Mark a contact message as read (admin only)"""
    try:
        message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        message.is_read = True
        message.read_at = datetime.utcnow()
        db.commit()
        
        return {"success": True, "message": "Message marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking message as read: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoint - delete message
@router.delete("/admin/messages/{message_id}")
async def delete_contact_message(
    message_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a contact message (admin only)"""
    try:
        message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        db.delete(message)
        db.commit()
        
        return {"success": True, "message": "Message deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ✅ Send reply email endpoint
@router.post("/admin/send-reply")
async def send_reply_email(
    reply_data: SendReplyRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Send a reply email to a contact message sender"""
    try:
        to_email = reply_data.to_email
        subject = reply_data.subject
        message_text = reply_data.message
        message_id = reply_data.message_id
        
        print(f"\n{'='*50}")
        print(f"📧 ADMIN REPLY REQUEST")
        print(f"{'='*50}")
        print(f"   To: {to_email}")
        print(f"   Subject: {subject}")
        print(f"   Message length: {len(message_text)} chars")
        print(f"   From Admin: {current_user.email}")
        print(f"{'='*50}\n")
        
        if not all([to_email, subject, message_text]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Get the original message if message_id provided
        original_message = None
        if message_id:
            original_message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
            if original_message:
                print(f"   Original message from: {original_message.name} ({original_message.email})")
        
        # Convert newlines to HTML breaks
        message_html = message_text.replace('\n', '<br>').replace('  ', ' &nbsp;')
        
        # Create HTML email
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9fafb;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                    border: 1px solid #e5e7eb;
                    border-top: none;
                }}
                .message-box {{
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    border-left: 4px solid #2563EB;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    font-size: 12px;
                    color: #6b7280;
                    border-top: 1px solid #e5e7eb;
                    margin-top: 20px;
                }}
                .logo {{
                    font-size: 24px;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🏠 EstateHub</div>
                <p>Ethiopia's Leading Real Estate Platform</p>
            </div>
            <div class="content">
                <p>Dear {original_message.name if original_message else 'Customer'},</p>
                
                <div class="message-box">
                    {message_html}
                </div>
                
                <p>Best regards,<br>
                <strong>EstateHub Support Team</strong></p>
                <p style="font-size: 14px; color: #6b7280;">
                    📞 Phone: +251-960724272<br>
                    📧 Email: info@estatehub.com<br>
                    🌐 Website: www.estatehub.com
                </p>
            </div>
            <div class="footer">
                <p>&copy; 2024 EstateHub. All rights reserved.</p>
                <p>Bole, Addis Ababa, Ethiopia</p>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
EstateHub Support

Dear {original_message.name if original_message else 'Customer'},

{message_text}

Best regards,
EstateHub Support Team

---
Phone: +251-960724272
Email: info@estatehub.com
Website: www.estatehub.com
        """
        
        # Send email in background
        background_tasks.add_task(
            send_email_background,
            to_email,
            subject,
            html_content,
            text_content
        )
        
        # Update message as replied
        if original_message:
            original_message.is_replied = True
            db.commit()
        
        print(f"✅ Reply queued for background sending to: {to_email}")
        
        return {
            "success": True,
            "message": "Reply has been queued for sending. The customer will receive an email shortly."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending reply: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Test endpoint to verify SMTP configuration
@router.post("/test-email")
async def test_email_sending(
    to_email: str,
    current_user: User = Depends(get_current_admin_user),
    background_tasks: BackgroundTasks = None
):
    """Test email configuration - Admin only"""
    try:
        print(f"\n{'='*50}")
        print(f"🔧 TESTING EMAIL CONFIGURATION")
        print(f"{'='*50}")
        print(f"   Test email to: {to_email}")
        print(f"   SMTP_USER: {SMTP_USER}")
        print(f"   SMTP_HOST: {SMTP_HOST}:{SMTP_PORT}")
        print(f"{'='*50}\n")
        
        test_html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body>
            <h1>✅ EstateHub Email Test</h1>
            <p>If you received this email, your SMTP configuration is working correctly!</p>
            <p>Time: {datetime.utcnow().isoformat()}</p>
            <p>From: {FROM_NAME} &lt;{FROM_EMAIL}&gt;</p>
        </body>
        </html>
        """
        
        test_text = f"Test email from EstateHub at {datetime.utcnow().isoformat()}\n\nIf you received this, your SMTP configuration is working!"
        
        # Send directly (not in background) to see immediate errors
        send_email_background(to_email, "EstateHub SMTP Test", test_html, test_text)
        
        return {
            "success": True, 
            "message": f"Test email sent to {to_email}. Check your inbox and backend console for details."
        }
    except Exception as e:
        return {
            "success": False, 
            "error": str(e)
        }

print("✅ Contact messages router loaded with email reply support!")