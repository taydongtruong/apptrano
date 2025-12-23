import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def send_email_notification(subject, body):
    sender = os.getenv("EMAIL_SENDER")
    password = os.getenv("EMAIL_PASSWORD")
    receiver = os.getenv("EMAIL_RECEIVER")

    if not sender or not password:
        print("Cấu hình Email thiếu!")
        return

    # Thiết lập nội dung email
    msg = MIMEMultipart()
    msg['From'] = f"Hệ Thống Quản Lý Trả Góp <{sender}>"
    msg['To'] = receiver
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html')) # Gửi dạng HTML cho đẹp

    try:
        # Kết nối đến server Gmail (SMTP)
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls() # Bảo mật kết nối
        server.login(sender, password)
        server.sendmail(sender, receiver, msg.as_string())
        server.quit()
        print("✅ Email thông báo đã được gửi!")
    except Exception as e:
        print(f"❌ Lỗi gửi email: {e}")