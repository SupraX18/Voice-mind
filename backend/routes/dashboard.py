"""
Dashboard Routes - aggregated analytics
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter, defaultdict
from models.database import get_db, User, VoiceAnalysis
from models.schemas import (
    DashboardResponse, DashboardStats, TrendPoint,
    WeeklyPattern, EmotionDistribution
)
from services.auth_service import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    cutoff_7  = now - timedelta(days=7)
    cutoff_30 = now - timedelta(days=30)

    all_analyses = (
        db.query(VoiceAnalysis)
        .filter(VoiceAnalysis.user_id == current_user.id)
        .order_by(VoiceAnalysis.recording_date.asc())
        .all()
    )

    recent_7  = [a for a in all_analyses if a.recording_date >= cutoff_7]
    recent_30 = [a for a in all_analyses if a.recording_date >= cutoff_30]

    avg_7  = sum(a.stress_score for a in recent_7)  / max(len(recent_7), 1)
    avg_30 = sum(a.stress_score for a in recent_30) / max(len(recent_30), 1)

    emotions = [a.emotional_state for a in all_analyses]
    dominant = Counter(emotions).most_common(1)[0][0] if emotions else "N/A"

    # Trend
    if len(recent_7) >= 2:
        first_half = recent_7[:len(recent_7)//2]
        second_half = recent_7[len(recent_7)//2:]
        avg_first  = sum(a.stress_score for a in first_half)  / len(first_half)
        avg_second = sum(a.stress_score for a in second_half) / len(second_half)
        trend = "improving" if avg_second < avg_first - 3 else ("worsening" if avg_second > avg_first + 3 else "stable")
    else:
        trend = "stable"

    # Streak (consecutive days with at least one entry)
    dates = sorted({a.recording_date.date() for a in all_analyses}, reverse=True)
    streak = 0
    today = now.date()
    for i, d in enumerate(dates):
        if (today - d).days == i:
            streak += 1
        else:
            break

    stats = DashboardStats(
        avg_stress_7d=round(avg_7, 1),
        avg_stress_30d=round(avg_30, 1),
        total_sessions=len(all_analyses),
        dominant_emotion=dominant,
        trend=trend,
        streak_days=streak,
    )

    # Trend data (last 30 days, one point per day avg)
    daily: dict = defaultdict(list)
    for a in recent_30:
        key = a.recording_date.strftime("%b %d")
        daily[key].append((a.stress_score, a.emotional_state))

    trend_data = []
    for date_str, vals in sorted(daily.items()):
        avg_score = sum(v[0] for v in vals) / len(vals)
        emotions_day = Counter(v[1] for v in vals)
        trend_data.append(TrendPoint(
            date=date_str,
            stress_score=round(avg_score, 1),
            emotional_state=emotions_day.most_common(1)[0][0],
        ))

    # Weekly pattern (by day-of-week)
    day_buckets: dict = defaultdict(list)
    for a in all_analyses:
        dow = a.recording_date.weekday()  # 0=Mon
        day_buckets[dow].append((a.stress_score, a.emotional_state))

    weekly_patterns = []
    for i, day_name in enumerate(DAYS):
        if day_buckets[i]:
            avg = sum(v[0] for v in day_buckets[i]) / len(day_buckets[i])
            dom_e = Counter(v[1] for v in day_buckets[i]).most_common(1)[0][0]
        else:
            avg, dom_e = 0.0, "N/A"
        weekly_patterns.append(WeeklyPattern(day=day_name, avg_stress=round(avg, 1), dominant_emotion=dom_e))

    # Emotion distribution
    total = len(all_analyses) or 1
    emotion_dist = []
    for emotion, count in Counter(emotions).most_common():
        emotion_dist.append(EmotionDistribution(
            emotion=emotion,
            count=count,
            percentage=round(count / total * 100, 1),
        ))

    latest = all_analyses[-1] if all_analyses else None
    from services.voice_analysis import get_suggestions
    latest_resp = None
    if latest:
        from models.schemas import AnalysisResponse
        latest_resp = AnalysisResponse(
            id=latest.id,
            stress_level=latest.stress_level,
            emotional_state=latest.emotional_state,
            stress_score=latest.stress_score,
            confidence_score=latest.confidence_score,
            pitch_mean=latest.pitch_mean,
            energy_mean=latest.energy_mean,
            speech_rate=latest.speech_rate,
            audio_duration=latest.audio_duration,
            recording_date=latest.recording_date,
            suggestions=get_suggestions(latest.stress_level, latest.emotional_state),
        )

    return DashboardResponse(
        stats=stats,
        trend_data=trend_data,
        weekly_patterns=weekly_patterns,
        emotion_distribution=emotion_dist,
        latest_analysis=latest_resp,
    )
