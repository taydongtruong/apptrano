from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from email_utils import send_email_notification
import cloudinary.uploader
import models, database, auth, schemas

# Lưu ý: Không đặt prefix ở đây để giữ nguyên đường dẫn cũ (Frontend đỡ phải sửa)
router = APIRouter(tags=["Transactions"])

# ==========================================
# PHẦN 1: DÀNH CHO NGƯỜI DÙNG (CHÁU)
# ==========================================

# 1. TẠO KHOẢN NẠP
@router.post("/payments/", response_model=schemas.TransactionResponse)
async def create_payment(
    amount: int = Form(...),
    note: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Kiểm tra chiến dịch active
    active_campaign = db.query(models.Campaign).filter(models.Campaign.is_active == True).first()
    if not active_campaign:
        raise HTTPException(status_code=400, detail="Hiện tại chưa có mục tiêu nào được kích hoạt.")

    # Validate file ảnh
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file ảnh")

    # Upload Cloudinary
    try:
        upload_result = cloudinary.uploader.upload(file.file, folder="apptrano_proofs")
        file_url = upload_result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary Error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi tải ảnh lên Cloud")

    # Lưu vào DB
    new_payment = models.Transaction(
        amount=amount,
        note=note or "Góp tiền",
        proof_image_url=file_url,
        user_id=current_user.id,
        campaign_id=active_campaign.id,
        status=False
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    # Gửi Email thông báo (Không chặn luồng chính nếu lỗi mail)
    try:
        subject = f"🔔 Khoản nạp mới: {active_campaign.title}"
        body = f"""
        <h2>Thông báo nạp tiền mới</h2>
        <p><b>Người nạp:</b> {current_user.username}</p>
        <p><b>Số tiền:</b> {amount:,} VNĐ</p>
        <p><b>Ghi chú:</b> {note or 'Góp tiền'}</p>
        <p><a href="https://apptrano-web.onrender.com">Bấm vào đây để duyệt ngay</a></p>
        """
        send_email_notification(subject, body)
    except Exception as e:
        print(f"Lỗi gửi mail: {e}")

    return new_payment

# 2. LẤY LỊCH SỬ CÁ NHÂN
@router.get("/payments/me", response_model=List[schemas.TransactionResponse])
async def get_my_payments(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    active_campaign = db.query(models.Campaign).filter(models.Campaign.is_active == True).first()
    query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)
    
    # Chỉ lấy giao dịch của chiến dịch hiện tại (để tránh lẫn lộn với chiến dịch cũ)
    if active_campaign:
        query = query.filter(models.Transaction.campaign_id == active_campaign.id)
        
    return query.order_by(models.Transaction.id.desc()).all()

# ==========================================
# PHẦN 2: THỐNG KÊ (CHUNG)
# ==========================================

# 3. LẤY THỐNG KÊ CHIẾN DỊCH
@router.get("/stats", response_model=schemas.StatsResponse)
async def get_stats(
    campaign_id: Optional[int] = None,
    db: Session = Depends(database.get_db)
):
    # Xác định chiến dịch cần xem
    if campaign_id:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    else:
        campaign = db.query(models.Campaign).filter(models.Campaign.is_active == True).first()

    if not campaign:
        return {
            "total_goal": 0, "current_total": 0, "pending_total": 0, "percentage": 0,
            "campaign_title": "Chưa có mục tiêu"
        }

    # Tính tổng tiền đã duyệt
    confirmed = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.campaign_id == campaign.id,
        models.Transaction.status == True
    ).scalar() or 0
    
    # Tính tổng tiền đang treo
    pending = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.campaign_id == campaign.id,
        models.Transaction.status == False
    ).scalar() or 0
    
    # Tính phần trăm
    percentage = round((confirmed / campaign.target_amount) * 100, 2) if campaign.target_amount > 0 else 0

    return {
        "total_goal": campaign.target_amount,
        "current_total": int(confirmed),
        "pending_total": int(pending),
        "percentage": percentage,
        "campaign_title": campaign.title
    }

# ==========================================
# PHẦN 3: DÀNH CHO ADMIN (ÔNG CHÚ)
# ==========================================

# 4. LẤY DANH SÁCH GIAO DỊCH (Có bộ lọc)
@router.get("/admin/payments", response_model=List[schemas.TransactionResponse])
async def get_admin_payments(
    campaign_id: Optional[int] = None, 
    status_filter: Optional[str] = None, # 'pending' | 'approved' | None
    db: Session = Depends(database.get_db),
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    query = db.query(models.Transaction)
    
    # Lọc theo Campaign
    if campaign_id:
        query = query.filter(models.Transaction.campaign_id == campaign_id)
    else:
        # Mặc định lấy campaign đang chạy
        active_c = db.query(models.Campaign).filter(models.Campaign.is_active == True).first()
        if active_c:
            query = query.filter(models.Transaction.campaign_id == active_c.id)

    # Lọc theo Trạng thái
    if status_filter == "pending":
        query = query.filter(models.Transaction.status == False)
    elif status_filter == "approved":
        query = query.filter(models.Transaction.status == True)

    return query.order_by(models.Transaction.id.desc()).all()

# 5. DUYỆT THANH TOÁN (Cần mật khẩu cấp 2)
@router.put("/payments/{payment_id}/approve")
async def approve_payment(
    payment_id: int,
    confirm_data: schemas.AdminApproveRequest, 
    db: Session = Depends(database.get_db),
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    # Xác thực lại mật khẩu của Admin cho an toàn
    clean_password = confirm_data.password.strip()
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