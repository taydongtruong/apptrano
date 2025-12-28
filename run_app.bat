@echo off
title Running AppTraNo - Backend & Frontend

:: 1. Chạy Backend trong một cửa sổ mới
echo Starting Backend...
start cmd /k "cd backend && venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload"

:: 2. Đợi một chút để Backend khởi động
timeout /t 3

:: 3. Chạy Frontend trong một cửa sổ mới
echo Starting Frontend...
start cmd /k "cd frontend && npm install && npm start"

echo.
echo Da kich hoat Backend va Frontend!
echo Backend dang chay tai: http://127.0.0.1:8000
echo Frontend dang chay tai: http://localhost:3000
pause