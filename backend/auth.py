import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# Import models và database
import models
import database

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "secret_key_tam_thoi")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") # API login của bạn phải khớp url này

# --- HÀM BĂM & KIỂM TRA MẬT KHẨU ---
def get_password_hash(password: str):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_enc = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_enc)

# --- HÀM TẠO TOKEN ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- LẤY USER ĐANG ĐĂNG NHẬP ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực người dùng",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- [MỚI] KIỂM TRA QUYỀN "ÔNG CHÚ" (ADMIN) ---
def get_current_uncle(current_user: models.User = Depends(get_current_user)):
    # Logic: Chỉ user có role là 'uncle' mới được qua cửa này
    if current_user.role != 'uncle':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ có 'Chú' mới có quyền thực hiện thao tác này!"
        )
    return current_user