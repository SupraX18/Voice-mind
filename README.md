# 🧠 VoiceMind — Voice-Based Stress Detection System

An AI-powered full-stack web application that analyzes voice recordings to detect stress levels and provide mental health insights using audio feature extraction (MFCC, pitch, energy, spectral contrast) and machine learning classification.

---

## 🏗️ Architecture Overview

```
voice-stress-app/
├── backend/                  # Python FastAPI API
│   ├── main.py               # Entry point
│   ├── start.py              # DB init + server launcher
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment template
│   ├── models/
│   │   ├── database.py       # SQLAlchemy ORM + SQLite/PostgreSQL
│   │   └── schemas.py        # Pydantic request/response schemas
│   ├── routes/
│   │   ├── auth.py           # Register / Login / JWT
│   │   ├── analysis.py       # Voice upload + AI analysis
│   │   └── dashboard.py      # Aggregated analytics
│   └── services/
│       ├── auth_service.py   # JWT + bcrypt helpers
│       └── voice_analysis.py # Librosa feature extraction + classifier
│
└── frontend/                 # React + Recharts SPA
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js / index.css
        ├── context/AuthContext.js   # Global auth + axios
        ├── hooks/useVoiceRecorder.js # Web Audio API recorder
        ├── components/Layout.js     # Sidebar navigation
        └── pages/
            ├── AuthPage.js          # Login / Register
            ├── RecordPage.js        # Record + analyze
            ├── DashboardPage.js     # Charts + stats
            └── HistoryPage.js       # Past recordings
```

---

## ⚡ Quick Start (VS Code)

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.10+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| Git | any | https://git-scm.com |

---

### 1 · Clone / Open in VS Code

```bash
# If downloaded as a ZIP, extract it, then:
code voice-stress-app
```

VS Code will open the project. Open two terminals (`` Ctrl+` `` → split terminal).

---

### 2 · Backend Setup (Terminal 1)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# (Optional) edit .env to change SECRET_KEY or DATABASE_URL

# Start the API server (also creates DB tables)
python start.py
```

✅ API runs at **http://localhost:8000**  
✅ Interactive docs at **http://localhost:8000/docs**

---

### 3 · Frontend Setup (Terminal 2)

```bash
cd frontend

# Install Node packages
npm install

# Start the dev server
npm start
```

✅ Frontend runs at **http://localhost:3000**

---

## 🔧 VS Code Recommended Extensions

Install these for the best dev experience:

- **Python** (ms-python.python)
- **Pylance** (ms-python.vscode-pylance)
- **ES7+ React/Redux snippets** (dsznajder.es7-react-js-snippets)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **REST Client** (humao.rest-client) — test API endpoints

### `.vscode/launch.json` (optional debugger config)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI Backend",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload", "--port", "8000"],
      "cwd": "${workspaceFolder}/backend",
      "env": { "PYTHONPATH": "${workspaceFolder}/backend" }
    }
  ]
}
```

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in, get JWT |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/analyze` | Upload audio → AI analysis |
| GET | `/api/analysis/history` | All past analyses |
| DELETE | `/api/analysis/{id}` | Delete one record |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/` | Stats, trends, emotion distribution |

All `/api/analysis/*` and `/api/dashboard/*` routes require:
```
Authorization: Bearer <JWT>
```

---

## 🤖 AI Pipeline

```
Audio Bytes (WebM/WAV/OGG)
       │
       ▼
 librosa.load()
       │
       ├─ MFCC (13 coefficients)  ──┐
       ├─ Pitch / F0 (mean, std)    │
       ├─ RMS Energy (mean, std)    ├──► Rule-based / ML Classifier
       ├─ Spectral Contrast         │          │
       ├─ Zero Crossing Rate        │          ▼
       └─ Speech Rate / Onset ──────┘   stress_score (0-100)
                                         stress_level (Low/Med/High)
                                         emotional_state (Calm … Anxious)
                                         confidence (0-1)
                                         suggestions[]
```

### Upgrading to a Trained ML Model

Replace the `classify_stress()` function in `backend/services/voice_analysis.py`:

```python
# Option A: TensorFlow
import tensorflow as tf
model = tf.keras.models.load_model('models/stress_cnn.h5')
features_array = np.array([mfcc_mean + [pitch_mean, energy_mean, zcr]])
prediction = model.predict(features_array.reshape(1, -1))

# Option B: PyTorch
import torch
model = torch.load('models/stress_lstm.pth')
tensor = torch.FloatTensor(features_array).unsqueeze(0)
prediction = model(tensor)
```

Recommended datasets for training:
- **RAVDESS** — Ryerson Audio-Visual Database of Emotional Speech
- **CREMAD** — Crowd-Sourced Emotional Multimodal Actors Dataset
- **IEMOCAP** — Interactive Emotional Dyadic Motion Capture

---

## 🗄️ Database

Default: **SQLite** (`backend/voice_stress.db`) — zero config, perfect for development.

### Switch to PostgreSQL

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE voice_stress_db;
CREATE USER vsuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE voice_stress_db TO vsuser;
```

2. Update `backend/.env`:
```
DATABASE_URL=postgresql://vsuser:yourpassword@localhost:5432/voice_stress_db
```

3. Install driver:
```bash
pip install psycopg2-binary
```

---

## 🔑 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `voice-stress-super-secret…` | JWT signing key — **change in production** |
| `DATABASE_URL` | `sqlite:///./voice_stress.db` | Database connection string |

---

## 🚀 Production Deployment

### Backend
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend

**Vercel Deployment (Recommended)**
Since this project is a monorepo (both backend and frontend in one repository), you must configure Vercel correctly:
1. Import your GitHub repository to Vercel.
2. In the **Configure Project** section, locate **Root Directory** and click `Edit`.
3. Select `frontend` from the list and save.
4. Framework Preset will auto-detect as **Create React App**.
5. Change the **Build Command** if needed, but the default `npm run build` is correct.
6. Open **Environment Variables** and add:
   - Name: `REACT_APP_API_URL`
   - Value: `<your-backend-url>` (e.g., `https://your-backend.onrender.com`)
7. Click **Deploy**.

*Note: The `vercel.json` is already included to handle React Router client-side routing.*

**Manual Build**
```bash
npm run build
# Serve the build/ folder with nginx or a static host
```

### Docker (optional)
```bash
docker-compose up --build
```

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: librosa` | `pip install librosa` in your venv |
| `CORS error in browser` | Ensure backend is running on port 8000 |
| `Microphone not working` | Allow microphone in browser settings; use HTTPS in production |
| `401 Unauthorized` | Token expired — log out and log back in |
| `npm install fails` | Use Node 18+; try `npm install --legacy-peer-deps` |
| SQLite locked | Only one process should write at a time; use PostgreSQL for multi-worker |

---

## 📱 Features Summary

- ✅ **Voice Recording** — Web Audio API waveform visualizer, 5–30s capture
- ✅ **AI Analysis** — MFCC + pitch + energy + ZCR feature extraction via librosa
- ✅ **Stress Scoring** — 0–100 score with Low / Medium / High classification
- ✅ **Emotion Detection** — Calm, Neutral, Stressed, Anxious, Highly Stressed, Sad
- ✅ **Confidence Score** — Per-prediction certainty estimate
- ✅ **Personalised Suggestions** — Tailored relaxation techniques
- ✅ **Dashboard** — Trend line, weekly bar chart, emotion pie chart
- ✅ **History** — Filterable, expandable record list with delete
- ✅ **Auth** — JWT-secured accounts with bcrypt password hashing
- ✅ **Dark UI** — Soothing dark theme with teal/violet accent palette
- ✅ **Responsive** — Mobile-friendly sidebar layout

---

## 📄 License

MIT — free to use, modify, and distribute.
