from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

import shutil
import os
import uuid

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os

# Import các file nội bộ
import models
import auth
import database

# Lệnh này giúp tự động tạo bảng trong Database nếu chưa có
models.Base.metadata.create_all(bind=database.engine)

load_dotenv()

# Cấu hình Cloudinary
cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)

app = FastAPI()

# --- 1. CONFIG & MIDDLEWARE ---
if not os.path.exists("static"):
    os.makedirs("static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# --- 2. AUTHENTICATION (Đăng ký / Đăng nhập) ---

@app.post("/register")
def register(
    username: str = Form(...), 
    password: str = Form(...), 
    role: str = Form("nephew"), # Mặc định là cháu (nephew), nhập 'uncle' nếu là chú
    db: Session = Depends(database.get_db)
):
    # Kiểm tra xem username đã tồn tại chưa
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
    
    hashed_pw = auth.get_password_hash(password)
    new_user = models.User(username=username, password_hash=hashed_pw, role=role)
    db.add(new_user)
    db.commit()
    return {"message": f"Tạo tài khoản {username} thành công với quyền {role}"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # Xác thực user
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Sai tài khoản hoặc mật khẩu")
    
    # Tạo token
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

# --- 3. LOGIC CHÍNH ---

@app.post("/payments/")
async def create_payment(
    amount: int = Form(...),
    note: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    # [BẢO MẬT] Bắt buộc đăng nhập mới được nạp tiền
    current_user: models.User = Depends(auth.get_current_user) 
):
    # --- LOGIC MỚI: UPLOAD LÊN CLOUD ---
    try:
        # Upload file trực tiếp lên Cloudinary
        # folder="apptrano_proofs" giúp gom tất cả ảnh vào 1 thư mục trên cloud cho gọn
        upload_result = cloudinary.uploader.upload(file.file, folder="apptrano_proofs")
        
        # Lấy đường dẫn ảnh online (bắt đầu bằng https://...)
        file_url = upload_result.get("secure_url")
        
    except Exception as e:
        print("Lỗi Cloudinary:", e) # In lỗi ra terminal để dễ debug
        raise HTTPException(status_code=500, detail="Lỗi không thể tải ảnh lên Cloud")

    # --- LƯU VÀO DATABASE ---
    try:
        new_payment = models.Transaction(
            amount=amount,
            note=note or "Góp tiền xe",
            proof_image_url=file_url, # Lưu đường dẫn online thay vì local
            user_id=current_user.id, 
            status=False 
        )
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
    except Exception as e:
        db.rollback()
        # Lưu ý: Nếu lỗi DB thì ảnh trên Cloud vẫn còn, nhưng không sao, nó là rác thôi.
        raise HTTPException(status_code=500, detail=f"Lỗi DB: {str(e)}")

    return {"message": "Gửi thành công", "id": new_payment.id, "url": file_url}

@app.get("/stats")
async def get_stats(db: Session = Depends(database.get_db)):
    # API này Public để ai cũng xem được tiến độ
    total_goal = 45000000
    
    confirmed_query = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.status == True).scalar()
    current_total = confirmed_query if confirmed_query else 0
    
    pending_query = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.status == False).scalar()
    pending_total = pending_query if pending_query else 0
    
    return {
        "total_goal": total_goal,
        "current_total": current_total,
        "pending_total": pending_total,
        "percentage": round((current_total / total_goal) * 100, 2)
    }

# --- 4. KHU VỰC ADMIN (CHỈ ÔNG CHÚ) ---

@app.get("/admin/payments")
async def get_all_payments(
    db: Session = Depends(database.get_db),
    # [BẢO MẬT] Chỉ 'uncle' mới xem được danh sách
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    return db.query(models.Transaction).order_by(models.Transaction.id.desc()).all()

@app.post("/admin/approve/{payment_id}")
async def approve_payment(
    payment_id: int, 
    db: Session = Depends(database.get_db),
    # [BẢO MẬT] Chỉ 'uncle' mới duyệt được tiền
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    payment = db.query(models.Transaction).filter(models.Transaction.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch")
    
    payment.status = True
    db.commit()
    return {"message": f"Đã duyệt bởi chú: {current_uncle.username}"}