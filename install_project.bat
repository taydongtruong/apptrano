@echo off
title Setup AppTraNo - Installing Dependencies

echo ==========================================
echo DANG CAI DAT HE THONG BACKEND...
echo ==========================================
cd backend
:: Tao moi truong ao neu chua co
if not exist venv (
    python -m venv venv
    echo Da tao moi truong ao venv.
)
:: Cai dat thu vien Python
call venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo.
echo ==========================================
echo DANG CAI DAT HE THONG FRONTEND...
echo ==========================================
cd frontend
:: Cai dat thu vien Node.js
call npm install
cd ..

echo.
echo ==========================================
echo DA CAI DAT XONG!
echo Bay gio ban co the chay file run_app.bat de bat dau.
echo ==========================================
pause