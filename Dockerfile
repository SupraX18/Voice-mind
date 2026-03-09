FROM python:3.11-slim

WORKDIR /app

# Install system deps for librosa / soundfile
RUN apt-get update && apt-get install -y \
    libsndfile1 libsndfile1-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Hugging Face Spaces requires port 7860
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
