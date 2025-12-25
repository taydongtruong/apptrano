from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, database, auth, schemas

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

# 1. LẤY DANH SÁCH MỤC TIÊU (Ai cũng xem được)
@router.get("/", response_model=List[schemas.CampaignResponse])
def get_campaigns(db: Session = Depends(database.get_db)):
    return db.query(models.Campaign).order_by(models.Campaign.id.desc()).all()

# 2. TẠO MỤC TIÊU MỚI (Chỉ Ông Chú)
@router.post("/", response_model=schemas.CampaignResponse)
def create_campaign(
    campaign: schemas.CampaignCreate,
    db: Session = Depends(database.get_db),
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    # Nếu chưa có campaign nào, cái đầu tiên sẽ tự active
    is_first = db.query(models.Campaign).count() == 0
    
    new_campaign = models.Campaign(
        title=campaign.title,
        target_amount=campaign.target_amount,
        is_active=is_first 
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign

# 3. KÍCH HOẠT MỘT MỤC TIÊU (Chỉ Ông Chú)
@router.put("/{campaign_id}/activate", response_model=schemas.CampaignResponse)
def activate_campaign(
    campaign_id: int,
    db: Session = Depends(database.get_db),
    current_uncle: models.User = Depends(auth.get_current_uncle)
):
    # Tìm campaign cần active
    target_campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not target_campaign:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục tiêu này")

    # Deactive tất cả các cái khác
    db.query(models.Campaign).update({models.Campaign.is_active: False})
    
    # Active cái được chọn
    target_campaign.is_active = True
    db.commit()
    db.refresh(target_campaign)
    return target_campaign