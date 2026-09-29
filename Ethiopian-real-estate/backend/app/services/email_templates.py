# backend/app/services/email_templates.py

def get_password_reset_email_html(username, reset_code):
    """HTML email template for password reset"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reset Your Password</title>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 500px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
            }}
            .content {{
                padding: 30px;
            }}
            .code {{
                background: #f3f4f6;
                font-size: 32px;
                font-weight: bold;
                text-align: center;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                letter-spacing: 5px;
                font-family: monospace;
            }}
            .footer {{
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                color: #64748b;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{username}</strong>,</p>
                <p>We received a request to reset your password. Use the code below to reset it:</p>
                <div class="code">{reset_code}</div>
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2024 EstateHub Real Estate. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


def get_payment_approval_email(admin_name, user_name, amount, plan_type, transaction_id):
    """HTML email template for payment approval notification"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Approved</title>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
            }}
            .content {{
                padding: 30px;
            }}
            .payment-details {{
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }}
            .detail-row {{
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #dcfce7;
            }}
            .detail-row:last-child {{
                border-bottom: none;
            }}
            .label {{
                font-weight: 600;
                color: #065f46;
            }}
            .value {{
                color: #047857;
            }}
            .amount {{
                font-size: 24px;
                font-weight: bold;
                color: #059669;
            }}
            .footer {{
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                color: #64748b;
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
            }}
            .button {{
                background: #10b981;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Payment Approved</h1>
                <p>EstateHub Payment Notification</p>
            </div>
            <div class="content">
                <p>Hello <strong>{admin_name}</strong>,</p>
                <p>A payment has been successfully approved!</p>
                
                <div class="payment-details">
                    <h3 style="margin-top: 0; color: #065f46;">Payment Details</h3>
                    <div class="detail-row">
                        <span class="label">User:</span>
                        <span class="value">{user_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Amount:</span>
                        <span class="value amount">{amount} ETB</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Plan:</span>
                        <span class="value">{plan_type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Transaction ID:</span>
                        <span class="value">{transaction_id}</span>
                    </div>
                </div>
                
                <p>The user's account has been activated. They can now start creating listings.</p>
                
                <div style="text-align: center;">
                    <a href="http://localhost:5173/admin/payment-approvals" class="button">View Payment Details</a>
                </div>
            </div>
            <div class="footer">
                <p>© 2024 EstateHub Real Estate. All rights reserved.</p>
                <p>This is an automated notification, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """


def get_payment_rejection_email(admin_name, user_name, amount, plan_type, reason):
    """HTML email template for payment rejection notification"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Rejected</title>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
            }}
            .content {{
                padding: 30px;
            }}
            .payment-details {{
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }}
            .reason {{
                background: #fef3c7;
                border: 1px solid #fde68a;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
                color: #92400e;
            }}
            .footer {{
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                color: #64748b;
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
            }}
            .button {{
                background: #ef4444;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>❌ Payment Rejected</h1>
                <p>EstateHub Payment Notification</p>
            </div>
            <div class="content">
                <p>Hello <strong>{admin_name}</strong>,</p>
                <p>A payment has been rejected.</p>
                
                <div class="payment-details">
                    <h3 style="margin-top: 0;">Payment Details</h3>
                    <p><strong>User:</strong> {user_name}</p>
                    <p><strong>Amount:</strong> {amount} ETB</p>
                    <p><strong>Plan:</strong> {plan_type}</p>
                </div>
                
                <div class="reason">
                    <strong>Rejection Reason:</strong><br>
                    {reason}
                </div>
                
                <div style="text-align: center;">
                    <a href="http://localhost:5173/admin/payment-approvals" class="button">View Details</a>
                </div>
            </div>
            <div class="footer">
                <p>© 2024 EstateHub Real Estate. All rights reserved.</p>
                <p>This is an automated notification, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """


def get_new_user_notification_email(admin_name, user_name, user_email, user_role):
    """HTML email template for new user registration notification"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New User Registration</title>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 500px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
            }}
            .content {{
                padding: 30px;
            }}
            .user-info {{
                background: #f5f3ff;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }}
            .footer {{
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                color: #64748b;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>👤 New User Registration</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{admin_name}</strong>,</p>
                <p>A new user has registered on EstateHub:</p>
                <div class="user-info">
                    <p><strong>Name:</strong> {user_name}</p>
                    <p><strong>Email:</strong> {user_email}</p>
                    <p><strong>Role:</strong> {user_role}</p>
                </div>
                <p>Please review and approve their account.</p>
            </div>
            <div class="footer">
                <p>© 2024 EstateHub Real Estate. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_new_payment_notification_email(admin_name, user_name, user_email, amount, plan_type, transaction_id):
    """HTML email template for new payment notification"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New Payment Received</title>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
            }}
            .content {{
                padding: 30px;
            }}
            .payment-details {{
                background: #fffbeb;
                border: 1px solid #fde68a;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }}
            .detail-row {{
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #fef3c7;
            }}
            .detail-row:last-child {{
                border-bottom: none;
            }}
            .label {{
                font-weight: 600;
                color: #92400e;
            }}
            .value {{
                color: #b45309;
            }}
            .amount {{
                font-size: 24px;
                font-weight: bold;
                color: #d97706;
            }}
            .button {{
                background: #f59e0b;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                margin-top: 20px;
            }}
            .footer {{
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                color: #64748b;
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 New Payment Received</h1>
                <p>EstateHub Payment Notification</p>
            </div>
            <div class="content">
                <p>Hello <strong>{admin_name}</strong>,</p>
                <p>A new payment has been submitted and is waiting for your approval!</p>
                
                <div class="payment-details">
                    <h3 style="margin-top: 0; color: #92400e;">Payment Details</h3>
                    <div class="detail-row">
                        <span class="label">User:</span>
                        <span class="value">{user_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Email:</span>
                        <span class="value">{user_email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Amount:</span>
                        <span class="value amount">{amount} ETB</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Plan:</span>
                        <span class="value">{plan_type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Transaction ID:</span>
                        <span class="value">{transaction_id}</span>
                    </div>
                </div>
                
                <p>Please review and approve this payment in the admin panel.</p>
                
                <div style="text-align: center;">
                    <a href="http://localhost:5173/admin/payment-approvals" class="button">Review Payment</a>
                </div>
            </div>
            <div class="footer">
                <p>© 2024 EstateHub Real Estate. All rights reserved.</p>
                <p>This is an automated notification, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_payment_approved_user_email(user_name, amount, plan_type, transaction_id):
    """HTML email template for user when payment is approved"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Approved</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; }}
            .button {{ background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>✅ Payment Approved!</h1></div>
            <div class="content">
                <p>Hello <strong>{user_name}</strong>,</p>
                <p>Your payment has been approved! Your account is now fully activated.</p>
                <p><strong>Amount:</strong> {amount} ETB<br>
                <strong>Plan:</strong> {plan_type}<br>
                <strong>Transaction ID:</strong> {transaction_id}</p>
                <p>You can now start creating listings on EstateHub.</p>
                <div style="text-align: center;">
                    <a href="http://localhost:5173/dashboard" class="button">Go to Dashboard</a>
                </div>
            </div>
            <div class="footer"><p>© 2024 EstateHub Real Estate. All rights reserved.</p></div>
        </div>
    </body>
    </html>
    """

def get_payment_rejected_user_email(user_name, amount, plan_type, reason):
    """HTML email template for user when payment is rejected"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Rejected</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; }}
            .reason {{ background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 15px 0; color: #92400e; }}
            .button {{ background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>❌ Payment Rejected</h1></div>
            <div class="content">
                <p>Hello <strong>{user_name}</strong>,</p>
                <p>Unfortunately, your payment has been rejected.</p>
                <p><strong>Amount:</strong> {amount} ETB<br>
                <strong>Plan:</strong> {plan_type}</p>
                <div class="reason"><strong>Reason:</strong><br>{reason}</div>
                <p>Please contact support for more information or try again with a different payment method.</p>
                <div style="text-align: center;">
                    <a href="http://localhost:5173/subscription" class="button">Try Again</a>
                </div>
            </div>
            <div class="footer"><p>© 2024 EstateHub Real Estate. All rights reserved.</p></div>
        </div>
    </body>
    </html>
    """

def get_new_payment_notification_email(admin_name, user_name, user_email, amount, plan_type, transaction_id):
    """HTML email template for new payment notification to admin"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New Payment Received</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 28px; }}
            .content {{ padding: 30px; }}
            .payment-details {{ background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #fef3c7; }}
            .detail-row:last-child {{ border-bottom: none; }}
            .label {{ font-weight: 600; color: #92400e; }}
            .value {{ color: #b45309; }}
            .amount {{ font-size: 24px; font-weight: bold; color: #d97706; }}
            .button {{ background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>💰 New Payment Received</h1><p>EstateHub Payment Notification</p></div>
            <div class="content">
                <p>Hello <strong>{admin_name}</strong>,</p>
                <p>A new payment has been submitted and is waiting for your approval!</p>
                <div class="payment-details">
                    <h3 style="margin-top: 0; color: #92400e;">Payment Details</h3>
                    <div class="detail-row"><span class="label">User:</span><span class="value">{user_name}</span></div>
                    <div class="detail-row"><span class="label">Email:</span><span class="value">{user_email}</span></div>
                    <div class="detail-row"><span class="label">Amount:</span><span class="value amount">{amount} ETB</span></div>
                    <div class="detail-row"><span class="label">Plan:</span><span class="value">{plan_type}</span></div>
                    <div class="detail-row"><span class="label">Transaction ID:</span><span class="value">{transaction_id}</span></div>
                </div>
                <p>Please review and approve this payment in the admin panel.</p>
                <div style="text-align: center;"><a href="http://localhost:5173/admin/payment-approvals" class="button">Review Payment</a></div>
            </div>
            <div class="footer"><p>© 2024 EstateHub Real Estate. All rights reserved.</p></div>
        </div>
    </body>
    </html>
    """


def get_payment_approved_user_email(user_name, amount, plan_type, transaction_id):
    """HTML email template for user when payment is approved"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Approved</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; }}
            .button {{ background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>✅ Payment Approved!</h1></div>
            <div class="content">
                <p>Hello <strong>{user_name}</strong>,</p>
                <p>Your payment has been approved! Your account is now fully activated.</p>
                <p><strong>Amount:</strong> {amount} ETB<br><strong>Plan:</strong> {plan_type}<br><strong>Transaction ID:</strong> {transaction_id}</p>
                <p>You can now start creating listings on EstateHub.</p>
                <div style="text-align: center;"><a href="http://localhost:5173/dashboard" class="button">Go to Dashboard</a></div>
            </div>
            <div class="footer"><p>© 2024 EstateHub Real Estate. All rights reserved.</p></div>
        </div>
    </body>
    </html>
    """


def get_payment_rejected_user_email(user_name, amount, plan_type, reason):
    """HTML email template for user when payment is rejected"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Rejected</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; }}
            .reason {{ background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 15px 0; color: #92400e; }}
            .button {{ background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>❌ Payment Rejected</h1></div>
            <div class="content">
                <p>Hello <strong>{user_name}</strong>,</p>
                <p>Unfortunately, your payment has been rejected.</p>
                <p><strong>Amount:</strong> {amount} ETB<br><strong>Plan:</strong> {plan_type}</p>
                <div class="reason"><strong>Reason:</strong><br>{reason}</div>
                <p>Please contact support for more information or try again with a different payment method.</p>
                <div style="text-align: center;"><a href="http://localhost:5173/subscription" class="button">Try Again</a></div>
            </div>
            <div class="footer"><p>© 2024 EstateHub Real Estate. All rights reserved.</p></div>
        </div>
    </body>
    </html>
    """