"""
Voice Analysis Routes
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from models.database import get_db, User, VoiceAnalysis
from models.schemas import AnalysisResponse, AnalysisHistory
from services.auth_service import get_current_user
from services.voice_analysis import extract_audio_features, classify_stress, get_suggestions
from datetime import datetime
import json

router = APIRouter()

ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/webm", "audio/ogg", "audio/mpeg",
    "audio/mp4", "application/octet-stream"
}

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_voice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate file type – strip codec suffix (e.g. "audio/webm;codecs=opus" → "audio/webm")
    base_type = (file.content_type or "").split(";")[0].strip()
    if base_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Upload WAV, WebM, or OGG."
        )

    audio_bytes = await file.read()
    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio file too small – please record at least 5 seconds.")

    # Extract features
    features = extract_audio_features(audio_bytes)

    # Classify
    stress_level, emotional_state, stress_score, confidence = classify_stress(features)

    # Persist
    record = VoiceAnalysis(
        user_id=current_user.id,
        stress_level=stress_level,
        emotional_state=emotional_state,
        stress_score=stress_score,
        confidence_score=confidence,
        pitch_mean=features.get("pitch_mean"),
        pitch_std=features.get("pitch_std"),
        energy_mean=features.get("energy_mean"),
        speech_rate=features.get("speech_rate"),
        mfcc_features=features.get("mfcc_mean"),
        spectral_contrast=features.get("spectral_contrast"),
        audio_duration=features.get("duration", 0),
        recording_date=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    suggestions = get_suggestions(stress_level, emotional_state)

    return AnalysisResponse(
        id=record.id,
        stress_level=stress_level,
        emotional_state=emotional_state,
        stress_score=stress_score,
        confidence_score=confidence,
        pitch_mean=record.pitch_mean,
        energy_mean=record.energy_mean,
        speech_rate=record.speech_rate,
        audio_duration=record.audio_duration,
        recording_date=record.recording_date,
        suggestions=suggestions,
    )


@router.get("/history", response_model=AnalysisHistory)
async def get_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analyses = (
        db.query(VoiceAnalysis)
        .filter(VoiceAnalysis.user_id == current_user.id)
        .order_by(VoiceAnalysis.recording_date.desc())
        .limit(limit)
        .all()
    )
    results = []
    for a in analyses:
        results.append(AnalysisResponse(
            id=a.id,
            stress_level=a.stress_level,
            emotional_state=a.emotional_state,
            stress_score=a.stress_score,
            confidence_score=a.confidence_score,
            pitch_mean=a.pitch_mean,
            energy_mean=a.energy_mean,
            speech_rate=a.speech_rate,
            audio_duration=a.audio_duration,
            recording_date=a.recording_date,
            suggestions=get_suggestions(a.stress_level, a.emotional_state),
        ))
    return AnalysisHistory(analyses=results, total=len(results))


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(VoiceAnalysis).filter(
        VoiceAnalysis.id == analysis_id,
        VoiceAnalysis.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.delete(record)
    db.commit()
    return {"message": "Deleted successfully"}
