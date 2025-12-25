from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from email_utils import send_email_notification
import cloudinary.uploader
import models, database, auth, schemas

router = APIRouter(tags=["Transactions"])

# --- API 1: TẠO KHOẢN NẠP (Tự động gắn vào Campaign đang chạy) ---
@router.post("/payments/", response_model=schemas.TransactionResponse)
async def create_payment(
    amount: int = Form(...),
    note: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # [QUAN TRỌNG] 1. Tìm campaign đang active để gắn giao dịch vào
    active_campaign = db.query(models.Campaign).filter(models.Campaign.is_active == True).first()
    
    # Nếu Ông Chú chưa tạo/kích hoạt mục tiêu nào thì không cho nạp
    if not active_campaign:
        raise HTTPException(status_code=400, detail="Hiện tại chưa có mục tiêu nào được kích hoạt. Vui lòng liên hệ Admin!")

    # 2. Upload ảnh
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file ảnh")

    try:
        upload_result = cloudinary.uploader.upload(file.file, folder="apptrano_proofs")
        file_url = upload_result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary Error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi tải ảnh lên Cloud")

    # 3. Lưu DB (Có gắn campaign_id)
    new_payment = models.Transaction(
        amount=amount,
        note=note or "Góp tiền",
        proof_image_url=file_url,
        user_id=current_user.id,
        campaign_id=active_campaign.id, # <--- Gắn ID mục tiêu vào đây
        status=False
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    # Gửi email thông báo
    try:
        subject = f"🔔 Khoản nạp mới cho mục tiêu: {active_campaign.title}"
        body = f"""
        <h2>Thông báo nạp tiền mới</h2>
        <p><b>Mục tiêu:</b> {active_campaign.title}</p>
        <p><b>Người nạp:</b> {current_user.username}</p>
        <p><b>Số tiền:</b> {amount:,} VNĐ</p>
        <p><b>Ghi chú:</b> {note or 'Góp tiền'}</p>
        <p><b><i>Vui lòng truy cập để duyệt: </i></b><a href="https://apptrano-web.onrender.com">App Trả Nợ</a></p>
        """
        send_email_notification(subject, body)
    except Exception as e:
        print(f"Lỗi gửi mail: {e}")

    return new_payment

# --- API 2: LẤY LỊCH SỬ CÁ NHÂN (Theo Campaign đang Active) ---
@router.get("/payments/me", response_model=List[schemas.TransactionResponse])
async def get_my_payments(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Mặc định Cháu chỉ nhìn thấy lịch sử đóng góp cho MỤC TIÊU HIỆN TẠI
    active_campaign = db.query(models.Campaign).filter(models.Campaign.is_active == True).first()
    
    query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)
    
    if active_campaign:
        query = query.filter(models.Transaction.campaign_id == active_campaign.id)
        
    return query.order_by(models.Transaction.id.desc()).all()

# --- API 3: LẤY THỐNG KÊ (Hỗ trợ lọc theo ID Chiến dịch) ---
@router.get("/stats", response_model=schemas.StatsResponse)
async def get_stats(
    campaign_id: Optional[int] = None, # Cho phép Frontend truyền ID lên để xem lịch sử cũ
    db: Session = Depends(database.get_db)
):
    # Nếu có ID thì lấy campaign đó, không thì lấy cái đang active
    if campaign_id:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    else:
        campaign = db.query(models.Campaign).filter(models.Campaign.is_active == True).first()

    if not campaign:
        return {
            "total_goal": 0, "current_total": 0, "pending_total": 0, "percentage": 0,
            "campaign_title": "Chưa có mục tiêu"
        }

    # Tính toán CHỈ TRONG PHẠM VI campaign đó
    confirmed = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.campaign_id == campaign.id,
        models.Transaction.status == True
    ).scalar() or 0
    
    pending = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.campaign_id == campaign.id,
        models.Transaction.status == False
    ).scalar() or 0
    
    percentage = round((confirmed / campaign.target_amount) * 100, 2) if campaign.target_amount > 0 else 0

    return {
        "total_goal": campaign.target_amount,
        "current_total": int(confirmed),
        "pending_total": int(pending),
        "percentage": percentage,
        "campaign_title": campaign.title # Trả về tên để hiển thị
    }

# --- API 4: ADMIN LẤY DANH SÁCH (Có lọc theo Campaign) ---
@router.get("/admin/payments", response_model=List[schemas.TransactionResponse])
async def get_admin_payments(
    campaign_id: Optional[int] = None, 
    db: Session = Depends(database.get_db),
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    query = db.query(models.Transaction)
    
    # Nếu Admin chọn xem 1 campaign cụ thể
    if campaign_id:
        query = query.filter(models.Transaction.campaign_id == campaign_id)
    else:
        # Mặc định lấy của cái đang active
        active_c = db.query(models.Campaign).filter(models.Campaign.is_active == True).first()
        if active_c:
            query = query.filter(models.Transaction.campaign_id == active_c.id)

    return query.order_by(models.Transaction.id.desc()).all()

# --- API 5: DUYỆT THANH TOÁN (Giữ nguyên) ---
@router.put("/payments/{payment_id}/approve")
async def approve_payment(
    payment_id: int,
    confirm_data: schemas.AdminApproveRequest, 
    db: Session = Depends(database.get_db),
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    clean_password = confirm_data.password.strip()
    
    # Verify password
    if not auth.verify_password(clean_password, current_uncle.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu xác nhận không chính xác"
        )

    transaction = db.query(models.Transaction).filter(models.Transaction.id == payment_id).first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch này")

    if transaction.status == True:
        raise HTTPException(status_code=400, detail="Giao dịch này đã được duyệt trước đó!")

    try:
        transaction.status = True
        db.commit()
        db.refresh(transaction)
        return {"message": "Duyệt thành công!", "status": True}
        
    except Exception as e:
        db.rollback()
        print(f"❌ LỖI DB: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi cập nhật trạng thái")