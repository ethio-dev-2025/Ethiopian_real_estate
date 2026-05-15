import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings

def send_reset_password_email(to_email: str, reset_token: str):
    """Send password reset email"""
    try:
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        
        subject = "Reset Your Password - RealEstate Pro"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Password Reset</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 50px auto;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #2563EB, #7C3AED);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    padding: 30px;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #2563EB, #7C3AED);
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                    border-top: 1px solid #eee;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>RealEstate Pro</h1>
                    <p>Password Reset Request</p>
                </div>
                <div class="content">
                    <h2>Hello,</h2>
                    <p>We received a request to reset your password for your RealEstate Pro account.</p>
                    <p>Click the button below to create a new password:</p>
                    <div style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </div>
                    <p>If you didn't request this, please ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 RealEstate Pro. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(html_content, 'html'))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"Password reset email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False