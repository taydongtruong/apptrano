import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

def send_email_notification(subject, body):
    try:
        params = {
            "from": "Acme <onboarding@resend.dev>", # Mặc định khi chưa có tên miền riêng
            "to": [os.getenv("EMAIL_RECEIVER")],
            "subject": subject,
            "html": body,
        }

        email = resend.Emails.send(params)
        print(f"✅ Email đã gửi thành công qua API: {email}")
    except Exception as e:
        print(f"❌ Lỗi gửi email qua API: {e}")