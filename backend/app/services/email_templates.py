# backend/app/services/email_templates.py
from ..config import settings

def get_password_reset_email_html(username: str, reset_code: str) -> str:
    """Password reset email template"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Password Reset - EstateHub</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; padding: 30px; text-align: center; }}
            .content {{ padding: 30px; }}
            .code {{ background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }}
            .code-number {{ font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #16a34a; font-family: monospace; }}
            .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }}
            .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 8px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 EstateHub</h1>
                <p>Password Reset Request</p>
            </div>
            <div class="content">
                <h2>Hello {username},</h2>
                <p>We received a request to reset your password for your EstateHub account.</p>
                <div class="code">
                    <p style="margin-bottom: 10px;">Your verification code is:</p>
                    <div class="code-number">{reset_code}</div>
                    <p style="margin-top: 10px; font-size: 14px;">This code expires in 10 minutes.</p>
                </div>
                <p>If you didn't request this, please ignore this email.</p>
                <div class="warning">
                    <strong>⚠️ Security Tip:</strong> Never share this code with anyone.
                </div>
                <p style="text-align: center;">
                    <a href="{settings.FRONTEND_URL}/reset-password" class="button">Reset Password →</a>
                </p>
            </div>
            <div class="footer">
                <p>&copy; 2024 EstateHub. All rights reserved.</p>
                <p>Making real estate accessible to everyone in Ethiopia</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_welcome_email_html(username: str) -> str:
    """Welcome email template"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Welcome to EstateHub</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; padding: 30px; text-align: center; }}
            .content {{ padding: 30px; }}
            .feature {{ background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; }}
            .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-decoration: none; border-radius: 8px; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Welcome to EstateHub!</h1>
            </div>
            <div class="content">
                <h2>Hello {username},</h2>
                <p>Thank you for joining EstateHub! We're excited to help you with your real estate journey in Ethiopia.</p>
                <div class="feature">
                    <strong>🏠 Browse Properties</strong>
                    <p style="margin: 5px 0 0;">Find your dream home or investment property</p>
                </div>
                <div class="feature">
                    <strong>📈 List Your Property</strong>
                    <p style="margin: 5px 0 0;">Sell or rent your property to thousands of buyers</p>
                </div>
                <div class="feature">
                    <strong>💬 Connect with Agents</strong>
                    <p style="margin: 5px 0 0;">Chat directly with property owners and agents</p>
                </div>
                <p style="text-align: center; margin-top: 25px;">
                    <a href="{settings.FRONTEND_URL}/login" class="button">Get Started →</a>
                </p>
            </div>
            <div class="footer">
                <p>&copy; 2024 EstateHub. Making real estate accessible to everyone in Ethiopia</p>
            </div>
        </div>
    </body>
    </html>
    """