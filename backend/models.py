from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, BigInteger
from datetime import datetime
from database import Base # Đảm bảo dòng này khớp với file database.py của bạn

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    password_hash = Column(String)
    role = Column(String) # 'nephew' hoặc 'uncle'

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(BigInteger)
    proof_image_url = Column(String, nullable=True)
    note = Column(String, nullable=True)
    status = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))