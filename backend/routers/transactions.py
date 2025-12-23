from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from email_utils import send_email_notification
import cloudinary.uploader
import models, database, auth, schemas

router = APIRouter(tags=["Transactions"])

# --- API 1: TẠO KHOẢN NẠP ---
@router.post("/payments/", response_model=schemas.TransactionResponse)
async def create_payment(
    amount: int = Form(...),
    note: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file ảnh")

    try:
        upload_result = cloudinary.uploader.upload(file.file, folder="apptrano_proofs")
        file_url = upload_result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary Error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi tải ảnh lên Cloud")

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

    # Gửi email thông báo
    try:
        subject = f"🔔 Khoản nạp mới từ {current_user.username}"
        body = f"""
        <h2>Thông báo nạp tiền mới</h2>
        <p><b>Người nạp:</b> {current_user.username}</p>
        <p><b>Số tiền:</b> {amount:,} VNĐ</p>
        <p><b>Ghi chú:</b> {note or 'Góp tiền xe'}</p>
        <p><b><i>Vui lòng truy cập để duyệt: </i></b><a href="https://apptrano-web.onrender.com">App Trả Nợ</a></p>
        """
        send_email_notification(subject, body)
    except Exception as e:
        print(f"Lỗi gửi mail: {e}")

    return new_payment

# --- API 2: LẤY LỊCH SỬ CÁ NHÂN ---
@router.get("/payments/me", response_model=List[schemas.TransactionResponse])
async def get_my_payments(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).order_by(models.Transaction.id.desc()).all()

# --- API 3: LẤY THỐNG KÊ ---
@router.get("/stats", response_model=schemas.StatsResponse)
async def get_stats(db: Session = Depends(database.get_db)):
    total_goal = 45000000
    confirmed = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.status == True).scalar() or 0
    pending = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.status == False).scalar() or 0
    percentage = round((confirmed / total_goal) * 100, 2) if total_goal > 0 else 0

    return {
        "total_goal": total_goal,
        "current_total": int(confirmed),
        "pending_total": int(pending),
        "percentage": percentage
    }

# --- API 4: DUYỆT THANH TOÁN (ĐÃ SỬA LỖI TÊN BIẾN) ---
@router.put("/payments/{payment_id}/approve")
async def approve_payment(
    payment_id: int,
    confirm_data: schemas.AdminApproveRequest, 
    db: Session = Depends(database.get_db),
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    # --- BƯỚC 1: XỬ LÝ KHOẢNG TRẮNG ---
    clean_password = confirm_data.password.strip()

    # --- BƯỚC 2: LOG DEBUG ---
    print(f"DEBUG: User={current_uncle.username} | Pass nhập='{clean_password}'")
    
    # --- BƯỚC 3: KIỂM TRA MẬT KHẨU (QUAN TRỌNG: Dùng .password_hash) ---
    # Đây là chỗ đã sửa: current_uncle.password_hash
    is_valid_password = auth.verify_password(clean_password, current_uncle.password_hash)

    if not is_valid_password:
        print("❌ KẾT QUẢ: Mật khẩu KHÔNG KHỚP!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu xác nhận không chính xác"
        )

    # --- BƯỚC 4: CẬP NHẬT DB ---
    transaction = db.query(models.Transaction).filter(models.Transaction.id == payment_id).first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch này")

    if transaction.status == True:
        raise HTTPException(status_code=400, detail="Giao dịch này đã được duyệt trước đó!")

    try:
        transaction.status = True
        db.commit()
        db.refresh(transaction)
        print("✅ KẾT QUẢ: Duyệt thành công!")
        return {"message": "Duyệt thành công!", "status": True}
        
    except Exception as e:
        db.rollback()
        print(f"❌ LỖI DB: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi cập nhật trạng thái")