from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, BigInteger
from sqlalchemy.orm import relationship # <--- Import thêm cái này
from datetime import datetime, timedelta, timezone
from database import Base 

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # Thêm index cho nhanh
    password_hash = Column(String)
    role = Column(String) # 'nephew' hoặc 'uncle'

    # Thêm dòng này để từ User có thể lấy danh sách các giao dịch họ đã nạp
    transactions = relationship("Transaction", back_populates="owner")

# Tạo một biến offset cho giờ Việt Nam (UTC+7)
VN_TIMEZONE = timezone(timedelta(hours=7))

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(BigInteger)
    proof_image_url = Column(String, nullable=True)
    note = Column(String, nullable=True)
    status = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(VN_TIMEZONE))
    user_id = Column(Integer, ForeignKey("users.id"))
    # Thêm dòng này để từ Giao dịch biết được ai là người nạp (owner)
    owner = relationship("User", back_populates="transactions")

    # [MỚI] Liên kết Campaign
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    campaign = relationship("Campaign", back_populates="transactions")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)           # Ví dụ: "Mua xe Mercedes"
    target_amount = Column(BigInteger) # Ví dụ: 1.500.000.000
    is_active = Column(Boolean, default=False) # Chỉ có 1 cái True cùng lúc
    created_at = Column(DateTime, default=lambda: datetime.now(VN_TIMEZONE))

    # Quan hệ: 1 Chiến dịch có nhiều Giao dịch
    transactions = relationship("Transaction", back_populates="campaign")