import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv() 

# Lấy URL database từ .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Đối với Neon/PostgreSQL, đôi khi cần sửa đầu url từ postgres:// thành postgresql://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Khởi tạo Engine
engine = create_engine(
    DATABASE_URL,
    # 1. Tự động kiểm tra kết nối trước khi sử dụng
    pool_pre_ping=True,
    # 2. Giới hạn thời gian sống của một kết nối trong pool (ví dụ 300 giây = 5 phút)
    pool_recycle=300,
    # 3. Kích thước pool và tối đa kết nối tạm thời
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Hàm bổ trợ để lấy DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
