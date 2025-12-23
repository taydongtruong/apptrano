from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from email_utils import send_email_notification
import cloudinary.uploader
import models, database, auth, schemas

router = APIRouter(tags=["Transactions"])

@router.post("/payments/", response_model=schemas.TransactionResponse)
async def create_payment(
    amount: int = Form(...),
    note: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. Validate File (Bảo mật: chặn file không phải ảnh)
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file ảnh")

    # 2. Upload Cloudinary
    try:
        upload_result = cloudinary.uploader.upload(file.file, folder="apptrano_proofs")
        file_url = upload_result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary Error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi tải ảnh lên Cloud")

    # 3. Save DB
    new_payment = models.Transaction(
        amount=amount,
        note=note or "Góp tiền xe",
        proof_image_url=file_url,
        user_id=current_user.id,
        status=False
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    # ĐOẠN GỬI EMAIL PHẢI THẲNG HÀNG VỚI db.commit()
    subject = f"🔔 Khoản nạp mới từ {current_user.username}"
    body = f"""
    <h2>Thông báo nạp tiền mới</h2>
    <p><b>Người nạp:</b> {current_user.username}</p>
    <p><b>Số tiền:</b> {amount:,} VNĐ</p>
    <p><b>Ghi chú:</b> {note or 'Góp tiền xe'}</p>
    """
    
    # Dòng này bị lỗi vì bạn có thể đã để thừa khoảng trắng phía trước:
    send_email_notification(subject, body) 

    return new_payment

@router.get("/payments/me", response_model=List[schemas.TransactionResponse])
async def get_my_payments(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Chỉ lấy những giao dịch thuộc về user đang đăng nhập
    return db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).order_by(models.Transaction.id.desc()).all()

@router.get("/stats", response_model=schemas.StatsResponse)
async def get_stats(db: Session = Depends(database.get_db)):
    total_goal = 45000000
    
    # Tính tổng tiền đã duyệt
    confirmed = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.status == True).scalar() or 0
    # Tính tổng tiền đang treo
    pending = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.status == False).scalar() or 0
    
    percentage = round((confirmed / total_goal) * 100, 2) if total_goal > 0 else 0

    return {
        "total_goal": total_goal,
        "current_total": int(confirmed),
        "pending_total": int(pending),
        "percentage": percentage
    }