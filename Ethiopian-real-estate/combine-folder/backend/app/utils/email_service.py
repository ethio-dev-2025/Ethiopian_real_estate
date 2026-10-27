from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from typing import List
from .config import settings

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USERNAME,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.FROM_EMAIL,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_SERVER,
    MAIL_FROM_NAME=settings.FROM_NAME,
    MAIL_TLS=True,
    MAIL_SSL=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

fastmail = FastMail(conf)

async def send_password_reset_email(email: EmailStr, reset_token: str, reset_link: str):
    """Send password reset email"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset - RealEstate Pro</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
            .content {{ padding: 30px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            .warning {{ background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 RealEstate Pro</h1>
                <h2>Password Reset Request</h2>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You have requested to reset your password for your RealEstate Pro account.</p>
                <p>Please click the button below to reset your password:</p>

                <div style="text-align: center;">
                    <a href="{reset_link}" class="button">Reset Password</a>
                </div>

                <div class="warning">
                    <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
                    If you didn't request this password reset, please ignore this email.
                </div>

                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">{reset_link}</p>

                <p>Best regards,<br>The RealEstate Pro Team</p>
            </div>
            <div class="footer">
                <p>This email was sent to you because you requested a password reset for your RealEstate Pro account.</p>
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="Password Reset - RealEstate Pro",
        recipients=[email],
        body=html,
        subtype="html"
    )

    await fastmail.send_message(message)

async def send_welcome_email(email: EmailStr, username: str):
    """Send welcome email to new users"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to RealEstate Pro</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
            .content {{ padding: 30px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Welcome to RealEstate Pro</h1>
            </div>
            <div class="content">
                <p>Hello {username},</p>
                <p>Welcome to RealEstate Pro! Your account has been successfully created.</p>
                <p>You can now:</p>
                <ul>
                    <li>Browse property listings</li>
                    <li>Create your own listings (after verification)</li>
                    <li>Connect with buyers and sellers</li>
                    <li>Manage your real estate transactions</li>
                </ul>

                <p>To get started, please verify your account and complete your profile.</p>

                <div style="text-align: center;">
                    <a href="http://localhost:3000/login" class="button">Login to Your Account</a>
                </div>

                <p>Best regards,<br>The RealEstate Pro Team</p>
            </div>
            <div class="footer">
                <p>This email was sent because you created an account with RealEstate Pro.</p>
            </div>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="Welcome to RealEstate Pro",
        recipients=[email],
        body=html,
        subtype="html"
    )

    await fastmail.send_message(message)