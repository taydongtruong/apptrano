from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, database, auth, schemas

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

@router.get("/payments", response_model=List[schemas.TransactionResponse])
async def get_all_payments(
    db: Session = Depends(database.get_db),
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    # Lấy kèm thông tin user (joinedload) để hiển thị ai nạp
    return db.query(models.Transaction).order_by(models.Transaction.id.desc()).all()

@router.post("/approve/{payment_id}")
async def approve_payment(
    payment_id: int, 
    db: Session = Depends(database.get_db),
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    payment = db.query(models.Transaction).filter(models.Transaction.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch")
    
    if payment.status:
         return {"message": "Giao dịch này đã được duyệt trước đó rồi"}

    payment.status = True
    db.commit()
    return {"message": f"Đã duyệt giao dịch #{payment_id} thành công"}