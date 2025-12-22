from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm


import shutil
import os

# Import các file nội bộ
import models
import auth
import database

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/payments/")
async def create_payment(
    amount: int = Form(...),
    note: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    if not os.path.exists("static"):
        os.makedirs("static")

    file_location = f"static/{file.filename}"
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Lỗi lưu ảnh")

    try:
        new_payment = models.Transaction(
            amount=amount,
            note=note or "Góp tiền xe",
            proof_image_url=file_location,
            user_id=1,
            status=False # Luôn là False khi mới gửi
        )
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Lỗi DB")

    return {"message": "Thành công", "id": new_payment.id}

@app.get("/stats")
async def get_stats(db: Session = Depends(database.get_db)):
    total_goal = 45000000
    
    # 1. Chỉ tính tiền ĐÃ DUYỆT (Status=True)
    confirmed = db.query(models.Transaction).filter(models.Transaction.status == True).all()
    current_total = sum(p.amount for p in confirmed)
    
    # 2. Tính tiền ĐANG CHỜ (Status=False)
    pending = db.query(models.Transaction).filter(models.Transaction.status == False).all()
    pending_total = sum(p.amount for p in pending)
    
    return {
        "total_goal": total_goal,
        "current_total": current_total,
        "pending_total": pending_total,
        "percentage": round((current_total / total_goal) * 100, 2)
    }

@app.get("/admin/payments")
async def get_all_payments(db: Session = Depends(database.get_db)):
    return db.query(models.Transaction).order_by(models.Transaction.id.desc()).all()

@app.post("/admin/approve/{payment_id}")
async def approve_payment(payment_id: int, db: Session = Depends(database.get_db)):
    payment = db.query(models.Transaction).filter(models.Transaction.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Không tìm thấy")
    payment.status = True
    #db.commit()
    return {"message": "Duyệt thành công"}