# backend/app/services/email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from ..config import settings
import asyncio
from concurrent.futures import ThreadPoolExecutor

class EmailService:
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = getattr(settings, 'SMTP_FROM_NAME', 'EstateHub')
        self.use_tls = getattr(settings, 'SMTP_USE_TLS', True)
        
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
            
            # Send email
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            print(f"✅ Email sent to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {e}")
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