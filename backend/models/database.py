"""
Database Models - SQLAlchemy ORM
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./voice_stress.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    analyses = relationship("VoiceAnalysis", back_populates="user", cascade="all, delete-orphan")


class VoiceAnalysis(Base):
    __tablename__ = "voice_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Analysis Results
    stress_level = Column(String)         # Low / Medium / High
    emotional_state = Column(String)      # Calm, Neutral, Stressed, Anxious, Sad
    stress_score = Column(Float)          # 0-100
    confidence_score = Column(Float)      # 0-1
    
    # Audio Features
    pitch_mean = Column(Float)
    pitch_std = Column(Float)
    energy_mean = Column(Float)
    speech_rate = Column(Float)
    mfcc_features = Column(JSON)          # List of MFCC coefficients
    spectral_contrast = Column(Float)
    
    # Metadata
    audio_duration = Column(Float)        # seconds
    recording_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)

    user = relationship("User", back_populates="analyses")


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
