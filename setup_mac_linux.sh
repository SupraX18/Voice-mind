#!/bin/bash
set -e

echo "=========================================="
echo " VoiceMind - Voice Stress Detection Setup"
echo "=========================================="
echo

# Backend
echo "[1/4] Setting up Python backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
[ -f .env ] || cp .env.example .env
echo "✅ Backend dependencies installed."
echo

# Start backend in background
echo "[2/4] Starting backend server..."
python start.py &
BACKEND_PID=$!
sleep 3
echo "✅ Backend running on http://localhost:8000 (PID: $BACKEND_PID)"
echo

# Frontend
echo "[3/4] Setting up React frontend..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed."
echo

echo "[4/4] Starting frontend..."
npm start &

echo
echo "=========================================="
echo " All services started!"
echo " Backend:  http://localhost:8000"
echo " Frontend: http://localhost:3000"
echo " API Docs: http://localhost:8000/docs"
echo " Press Ctrl+C to stop all services."
echo "=========================================="

# Wait for Ctrl+C
trap "kill $BACKEND_PID 2>/dev/null; exit" INT
wait
