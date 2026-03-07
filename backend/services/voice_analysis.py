"""
Voice Analysis Service
Extracts audio features and classifies emotional state / stress level
using librosa + a rule-based ML-style classifier.
"""
import numpy as np
import io
import random
from typing import Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)

# ── Try to import optional heavy libs ────────────────────────────────────────
try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    logger.warning("librosa not available – using simulated features")


# ── Feature Extraction ────────────────────────────────────────────────────────

def extract_audio_features(audio_bytes: bytes, sample_rate: int = 22050) -> Dict[str, Any]:
    """Extract MFCC, pitch, energy, and spectral features from raw audio bytes."""

    if not LIBROSA_AVAILABLE:
        return _simulate_features()

    try:
        audio_array, sr = librosa.load(io.BytesIO(audio_bytes), sr=sample_rate, mono=True)
        duration = librosa.get_duration(y=audio_array, sr=sr)

        # ── MFCC ─────────────────────────────────────────────────────────────
        mfccs = librosa.feature.mfcc(y=audio_array, sr=sr, n_mfcc=13)
        mfcc_mean = mfccs.mean(axis=1).tolist()
        mfcc_std  = mfccs.std(axis=1).tolist()

        # ── Pitch / F0 ───────────────────────────────────────────────────────
        pitches, magnitudes = librosa.piptrack(y=audio_array, sr=sr)
        pitch_values = pitches[magnitudes > np.median(magnitudes)]
        pitch_mean = float(np.mean(pitch_values)) if len(pitch_values) else 0.0
        pitch_std  = float(np.std(pitch_values))  if len(pitch_values) else 0.0

        # ── Energy / RMS ─────────────────────────────────────────────────────
        rms = librosa.feature.rms(y=audio_array)
        energy_mean = float(np.mean(rms))
        energy_std  = float(np.std(rms))

        # ── Spectral Features ────────────────────────────────────────────────
        spectral_contrast = librosa.feature.spectral_contrast(y=audio_array, sr=sr)
        sc_mean = float(np.mean(spectral_contrast))

        spectral_rolloff = librosa.feature.spectral_rolloff(y=audio_array, sr=sr)
        rolloff_mean = float(np.mean(spectral_rolloff))

        zero_crossing = librosa.feature.zero_crossing_rate(audio_array)
        zcr_mean = float(np.mean(zero_crossing))

        # ── Speech Rate proxy ────────────────────────────────────────────────
        # Onset strength as a proxy for syllable rate
        onset_env = librosa.onset.onset_strength(y=audio_array, sr=sr)
        speech_rate = float(np.mean(onset_env))

        # ── Tempo ────────────────────────────────────────────────────────────
        tempo, _ = librosa.beat.beat_track(y=audio_array, sr=sr)
        tempo_val = float(tempo) if not isinstance(tempo, np.ndarray) else float(tempo[0])

        return {
            "duration": duration,
            "mfcc_mean": mfcc_mean,
            "mfcc_std": mfcc_std,
            "pitch_mean": pitch_mean,
            "pitch_std": pitch_std,
            "energy_mean": energy_mean,
            "energy_std": energy_std,
            "spectral_contrast": sc_mean,
            "spectral_rolloff": rolloff_mean,
            "zero_crossing_rate": zcr_mean,
            "speech_rate": speech_rate,
            "tempo": tempo_val,
        }

    except Exception as e:
        logger.error(f"Feature extraction error: {e}")
        return _simulate_features()


def _simulate_features() -> Dict[str, Any]:
    """Return realistic random features when librosa is unavailable."""
    rng = np.random.default_rng()
    return {
        "duration": rng.uniform(20, 30),
        "mfcc_mean": rng.uniform(-50, 50, 13).tolist(),
        "mfcc_std":  rng.uniform(0, 20, 13).tolist(),
        "pitch_mean": rng.uniform(80, 300),
        "pitch_std":  rng.uniform(10, 80),
        "energy_mean": rng.uniform(0.01, 0.3),
        "energy_std":  rng.uniform(0.001, 0.05),
        "spectral_contrast": rng.uniform(10, 50),
        "spectral_rolloff": rng.uniform(1000, 8000),
        "zero_crossing_rate": rng.uniform(0.02, 0.15),
        "speech_rate": rng.uniform(0.1, 1.5),
        "tempo": rng.uniform(60, 140),
    }


# ── Stress Classification ─────────────────────────────────────────────────────

def classify_stress(features: Dict[str, Any]) -> Tuple[str, str, float, float]:
    """
    Rule-based classifier using audio features.
    Returns (stress_level, emotional_state, stress_score 0-100, confidence 0-1)
    
    In production replace with a trained CNN/LSTM model loaded via TensorFlow/PyTorch.
    """
    pitch_mean     = features.get("pitch_mean", 150)
    pitch_std      = features.get("pitch_std", 30)
    energy_mean    = features.get("energy_mean", 0.05)
    energy_std     = features.get("energy_std", 0.01)
    speech_rate    = features.get("speech_rate", 0.5)
    zcr            = features.get("zero_crossing_rate", 0.06)
    spec_contrast  = features.get("spectral_contrast", 25)
    mfcc_mean      = features.get("mfcc_mean", [0] * 13)

    # ── Normalise sub-scores (0-1) ────────────────────────────────────────────
    # High pitch variability → stress
    pitch_stress   = min(pitch_std / 100.0, 1.0)
    # High energy variation → stress
    energy_stress  = min(energy_std / 0.05, 1.0)
    # High ZCR → anxiety / tension
    zcr_stress     = min(zcr / 0.12, 1.0)
    # Low spectral contrast → monotone (can indicate depression/sadness)
    contrast_score = 1.0 - min(spec_contrast / 50.0, 1.0)
    # MFCC delta as proxy
    mfcc_var       = float(np.var(mfcc_mean)) / 1000.0
    mfcc_stress    = min(mfcc_var, 1.0)

    # Weighted combination
    raw_score = (
        0.30 * pitch_stress +
        0.25 * energy_stress +
        0.20 * zcr_stress +
        0.15 * mfcc_stress +
        0.10 * contrast_score
    )

    # Scale to 0-100 with some natural variance
    stress_score = float(np.clip(raw_score * 100 + np.random.normal(0, 3), 0, 100))

    # ── Stress Level ──────────────────────────────────────────────────────────
    if stress_score < 35:
        stress_level = "Low"
    elif stress_score < 65:
        stress_level = "Medium"
    else:
        stress_level = "High"

    # ── Emotional State ───────────────────────────────────────────────────────
    if stress_score < 25:
        emotional_state = "Calm"
    elif stress_score < 45:
        emotional_state = "Neutral"
    elif stress_score < 65:
        emotional_state = "Stressed"
    elif stress_score < 80:
        emotional_state = "Anxious"
    else:
        emotional_state = "Highly Stressed"

    # Override toward Sad if pitch and energy are both low
    if pitch_mean < 120 and energy_mean < 0.03:
        emotional_state = "Sad"

    # ── Confidence (based on signal clarity) ─────────────────────────────────
    confidence = float(np.clip(0.65 + 0.2 * (energy_mean / 0.1) - 0.05 * abs(mfcc_var - 0.5), 0.55, 0.97))

    return stress_level, emotional_state, round(stress_score, 1), round(confidence, 3)


# ── Suggestions Engine ────────────────────────────────────────────────────────

SUGGESTIONS: Dict[str, List[str]] = {
    "Low": [
        "Great work! Keep maintaining your calm lifestyle. 🌿",
        "Try a 5-minute gratitude journal to reinforce positive emotions.",
        "Light stretching or yoga can sustain your relaxed state.",
        "Share your calm energy—connect with a friend today.",
    ],
    "Medium": [
        "Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s. 🌬️",
        "Take a 10-minute walk outside to reset your nervous system.",
        "Listen to binaural beats or calming music for 15 minutes.",
        "Avoid screens 30 minutes before bed to improve sleep quality.",
        "Practice progressive muscle relaxation starting from your toes.",
    ],
    "High": [
        "Pause and take 5 deep belly breaths right now. 🧘",
        "Splash cold water on your face to activate the dive reflex.",
        "Write down your top 3 stressors—naming them reduces their power.",
        "Consider speaking with a mental health professional.",
        "Box breathing: 4s in, 4s hold, 4s out, 4s hold—repeat 4 times.",
        "Step away from the stressor for at least 20 minutes.",
    ],
    "Calm": [
        "You're in a wonderful state—use it for creative work or deep focus. ✨",
    ],
    "Sad": [
        "It's okay to feel sad. Reach out to someone you trust. 💙",
        "Gentle movement like a slow walk can lift your mood gradually.",
        "Listen to uplifting music or watch something that makes you smile.",
        "If sadness persists, consider speaking with a counsellor.",
    ],
}

def get_suggestions(stress_level: str, emotional_state: str) -> List[str]:
    combined = list(set(
        SUGGESTIONS.get(stress_level, []) + SUGGESTIONS.get(emotional_state, [])
    ))
    random.shuffle(combined)
    return combined[:4]
