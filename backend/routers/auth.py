from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

# Import từ thư mục cha (parent directory)
import database, models, auth, schemas

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserResponse)
def register(
    username: str = Form(...), 
    password: str = Form(...), 
    role: str = Form("nephew"), 
    db: Session = Depends(database.get_db)
):
    # Validate role
    if role not in ["nephew", "uncle"]:
        raise HTTPException(status_code=400, detail="Role không hợp lệ (chỉ chấp nhận 'nephew' hoặc 'uncle')")

    # 2. KIỂM TRA DUY NHẤT ÔNG CHÚ (MỚI)
    if role == "uncle":
        existing_uncle = db.query(models.User).filter(models.User.role == "uncle").first()
        if existing_uncle:
            raise HTTPException(
                status_code=400, 
                detail="Hệ thống đã có 'Ông Chủ' rồi. Không thể đăng ký thêm quản trị viên!"
            )
    
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
    
    hashed_pw = auth.get_password_hash(password)
    new_user = models.User(username=username, password_hash=hashed_pw, role=role)
    db.add(new_user)
    db.commit()
    #db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    stmt = select(models.User).where(models.User.username == form_data.username)
    result = db.execute(stmt)
    user = result.scalar_one_or_none() # Lấy 1 kết quả hoặc None

    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tài khoản hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}
