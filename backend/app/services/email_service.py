# backend/app/services/email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
from ..config import settings

class EmailService:
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.use_tls = settings.SMTP_USE_TLS
        
        print(f"📧 Email Service Initialized:")
        print(f"   Host: {self.host}:{self.port}")
        print(f"   User: {self.username}")
        print(f"   From: {self.from_name} <{self.from_email}>")
        print(f"   Password length: {len(self.password) if self.password else 0} characters")
        
    def _send_sync(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
        """Synchronous email sending"""
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            
            # Add plain text version
            if text_content:
                text_part = MIMEText(text_content, "plain")
                msg.attach(text_part)
            
            # Add HTML version
            html_part = MIMEText(html_content, "html")
            msg.attach(html_part)
            
            # Send email using TLS
            print(f"📤 Connecting to {self.host}:{self.port}...")
            with smtplib.SMTP(self.host, self.port) as server:
                server.set_debuglevel(1)  # Enable debug output
                server.starttls()
                print(f"🔐 Logging in as {self.username}...")
                server.login(self.username, self.password)
                print(f"📧 Sending email to {to_email}...")
                server.send_message(msg)
            
            print(f"✅ Email sent successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            print(f"❌ SMTP Authentication Failed: {e}")
            print(f"   Please check:")
            print(f"   1. Email: {self.username}")
            print(f"   2. App Password (not regular password)")
            print(f"   3. 2-Step Verification is enabled on Google Account")
            return False
        except smtplib.SMTPException as e:
            print(f"❌ SMTP Error: {e}")
            return False
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
        """Async email sending"""
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            result = await loop.run_in_executor(
                executor,
                self._send_sync,
                to_email,
                subject,
                html_content,
                text_content
            )
            return {"success": result, "message": "Email sent" if result else "Failed to send"}

# Create singleton instance
email_service = EmailService()