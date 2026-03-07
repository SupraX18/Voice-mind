"""
Pydantic Schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ── Analysis Schemas ──────────────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    id: int
    stress_level: str
    emotional_state: str
    stress_score: float
    confidence_score: float
    pitch_mean: Optional[float]
    energy_mean: Optional[float]
    speech_rate: Optional[float]
    audio_duration: float
    recording_date: datetime
    suggestions: Optional[List[str]]

    class Config:
        from_attributes = True

class AnalysisHistory(BaseModel):
    analyses: List[AnalysisResponse]
    total: int


# ── Dashboard Schemas ─────────────────────────────────────────────────────────

class TrendPoint(BaseModel):
    date: str
    stress_score: float
    emotional_state: str

class WeeklyPattern(BaseModel):
    day: str
    avg_stress: float
    dominant_emotion: str

class EmotionDistribution(BaseModel):
    emotion: str
    count: int
    percentage: float

class DashboardStats(BaseModel):
    avg_stress_7d: float
    avg_stress_30d: float
    total_sessions: int
    dominant_emotion: str
    trend: str   # "improving" | "stable" | "worsening"
    streak_days: int

class DashboardResponse(BaseModel):
    stats: DashboardStats
    trend_data: List[TrendPoint]
    weekly_patterns: List[WeeklyPattern]
    emotion_distribution: List[EmotionDistribution]
    latest_analysis: Optional[AnalysisResponse]
