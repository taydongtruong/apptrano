import os
from database import SessionLocal, engine
import models, auth
from dotenv import load_dotenv

load_dotenv()

def init_accounts():
    db = SessionLocal()
    # Tạo bảng nếu chưa có
    models.Base.metadata.create_all(bind=engine)

    # 1. Tạo tài khoản cho bạn (Cháu)
    if not db.query(models.User).filter(models.User.username == "chau_ne").first():
        nephew = models.User(
            username="chau_ne",
            password_hash=auth.get_password_hash("mat_khau_cua_ban"), # Thay đổi mật khẩu này
            role="nephew"
        )
        db.add(nephew)

    # 2. Tạo tài khoản cho Ông chú
    if not db.query(models.User).filter(models.User.username == "ong_chu").first():
        uncle = models.User(
            username="ong_chu",
            password_hash=auth.get_password_hash("mat_khau_ong_chu"), # Thay đổi mật khẩu này
            role="uncle"
        )
        db.add(uncle)

    db.commit()
    db.close()
    print("--- Đã khởi tạo 2 tài khoản thành công! ---")

if __name__ == "__main__":
    init_accounts()