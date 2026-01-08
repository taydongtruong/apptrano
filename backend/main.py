from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import cloudinary

# Import các thành phần nội bộ
import models, database
from routers import auth, transactions, campaigns

# Load env & Config DB
load_dotenv()
models.Base.metadata.create_all(bind=database.engine)

# Config Cloudinary
cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)

app = FastAPI(title="App Trả Nợ API", version="2.0")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static (nếu cần dùng tạm)
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- INCLUDE ROUTERS ---
# Đây là bước gom các file con vào ứng dụng chính
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(campaigns.router)


@app.get("/")
def root():
    return {"message": "Server đang chạy ngon lành cành đào!"}

# Thêm route này để UptimeRobot gọi vào
@app.api_route("/health", methods=["GET", "POST", "HEAD"])
async def health_check():
    return {"status": "ok Server đã chạy khỏi lười", "message": "Server is running"}
