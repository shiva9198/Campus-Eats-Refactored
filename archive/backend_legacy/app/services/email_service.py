"""
Email Service
Handles sending emails via SMTP
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings


class EmailService:
    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str
    ) -> tuple[bool, str]:
        """Send an email using SMTP"""
        if not settings.SMTP_HOST:
            msg = f"Email not sent (SMTP not configured): {subject} to {to}"
            print(msg)
            return False, msg

        try:
            message = MIMEMultipart("alternative")
            message["From"] = settings.EMAIL_FROM
            message["To"] = to
            message["Subject"] = subject

            html_part = MIMEText(html_body, "html")
            message.attach(html_part)

            if settings.SMTP_PORT == 465:
                # Use implicit SSL for port 465
                await aiosmtplib.send(
                    message,
                    hostname=settings.SMTP_HOST,
                    port=settings.SMTP_PORT,
                    username=settings.SMTP_USER,
                    password=settings.SMTP_PASS,
                    use_tls=True
                )
            else:
                # Use STARTTLS for port 587
                await aiosmtplib.send(
                    message,
                    hostname=settings.SMTP_HOST,
                    port=settings.SMTP_PORT,
                    username=settings.SMTP_USER,
                    password=settings.SMTP_PASS,
                    start_tls=True
                )

            print(f"Email sent: {subject} to {to}")
            return True, "Email sent successfully"

        except Exception as e:
            error_msg = f"Email failed: {str(e)}"
            print(error_msg)
            return False, error_msg

    async def send_otp_email(
        self,
        to: str,
        name: str,
        otp: str
    ) -> tuple[bool, str]:
        """Send OTP verification email"""
        subject = "Campus Eats - Verify Your Email"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .otp-box {{ 
                    background: #f5f5f5; 
                    padding: 20px; 
                    text-align: center; 
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .otp-code {{ 
                    font-size: 32px; 
                    font-weight: bold; 
                    letter-spacing: 4px;
                    color: #1976d2;
                }}
                .footer {{ color: #666; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Welcome to Campus Eats! 🍽️</h2>
                <p>Hi {name},</p>
                <p>Please use the following OTP to verify your email address:</p>
                
                <div class="otp-box">
                    <div class="otp-code">{otp}</div>
                </div>
                
                <p>This OTP will expire in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
                
                <div class="footer">
                    <p>© Campus Eats - Your Campus Food Ordering App</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self.send_email(to, subject, html_body)

    async def send_order_notification(
        self,
        to: str,
        name: str,
        order_id: str,
        status: str,
        otp: str = None
    ) -> bool:
        """Send order status notification"""
        status_messages = {
            "paid": "Your payment has been verified!",
            "preparing": "Your order is being prepared!",
            "ready": "Your order is ready for pickup!",
            "completed": "Your order has been collected. Enjoy!",
            "payment_rejected": "Your payment could not be verified."
        }

        subject = f"Campus Eats - Order #{order_id[:8]} Update"
        message = status_messages.get(status, f"Order status: {status}")

        otp_section = ""
        if otp and status in ["paid", "preparing", "ready"]:
            otp_section = f"""
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong>Collection OTP:</strong>
                <span style="font-size: 24px; font-weight: bold; color: #1976d2;">{otp}</span>
            </div>
            <p>Show this OTP when collecting your order.</p>
            """

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Order Update 📦</h2>
                <p>Hi {name},</p>
                <p>{message}</p>
                {otp_section}
                <p>Order ID: #{order_id[:8]}</p>
            </div>
        </body>
        </html>
        """
        return await self.send_email(to, subject, html_body)


# Singleton instance
email_service = EmailService()
