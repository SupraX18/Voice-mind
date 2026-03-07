@echo off
echo ==========================================
echo  VoiceMind - Voice Stress Detection Setup
echo ==========================================
echo.

echo [1/4] Setting up Python backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
if not exist .env copy .env.example .env
echo Backend dependencies installed.
echo.

echo [2/4] Starting backend in background...
start "VoiceMind Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && python start.py"
timeout /t 3 > nul

echo [3/4] Setting up React frontend...
cd ..\frontend
call npm install
echo Frontend dependencies installed.
echo.

echo [4/4] Starting frontend...
start "VoiceMind Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ==========================================
echo  Setup complete!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:3000
echo  API Docs: http://localhost:8000/docs
echo ==========================================
pause
