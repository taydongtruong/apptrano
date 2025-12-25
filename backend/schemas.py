from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    username: str
    role: str = "nephew"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    # Config này giúp Pydantic đọc được dữ liệu từ SQLAlchemy Object
    class Config:
        from_attributes = True 

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

# --- TRANSACTION SCHEMAS ---
# Lưu ý: Khi upload file, ta vẫn dùng Form(), nhưng Response trả về phải chuẩn JSON
class TransactionResponse(BaseModel):
    id: int
    amount: int
    note: Optional[str] = None
    proof_image_url: Optional[str] = None
    status: bool
    created_at: datetime
    # Trả về luôn thông tin người tạo (nếu cần hiển thị tên người nạp)
    owner: UserResponse

    # [MỚI] Có thể trả về thông tin campaign nếu cần (optional)
    campaign_id: Optional[int] = None

    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    total_goal: int
    current_total: int
    pending_total: int
    percentage: float
    campaign_title: str # [MỚI] Trả về tên chiến dịch để hiển thị

class AdminApproveRequest(BaseModel):
    password: str # Mật khẩu xác nhận của Admin

# --- THÊM SCHEMAS CHO CAMPAIGN ---
class CampaignBase(BaseModel):
    title: str
    target_amount: int

class CampaignCreate(CampaignBase):
    pass

class CampaignResponse(CampaignBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True