@echo off
title AppTraNo - Parallel Start
color 0B

set ROOT_DIR=%~dp0

echo ======================================================
echo           DANG KHOI CHAY SONG SONG BACKEND & FRONTEND
echo ======================================================

:: --- KHOI CHAY BACKEND TRONG CUA SO RIENG ---
echo [+] Dang kich hoat luong Backend...
start "BACKEND_SERVICE" cmd /c "echo Dang kiem tra Backend... && cd /d %ROOT_DIR%backend && (if not exist venv python -m venv venv) && venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"

:: --- KHOI CHAY FRONTEND TRONG CUA SO RIENG ---
echo [+] Dang kich hoat luong Frontend...
start "FRONTEND_SERVICE" cmd /c "echo Dang kiem tra Frontend... && cd /d %ROOT_DIR%frontend && (if not exist node_modules call npm install) && npm start"

echo.
echo ======================================================
echo [DA GUI LENH] 2 cua so moi se tu thuc hien nhiem vu:
echo 1. Tu kiem tra/cai dat moi truong.
echo 2. Tu khoi chay server.
echo.
echo Ban co the dong cua so chinh nay.
echo ======================================================
pause