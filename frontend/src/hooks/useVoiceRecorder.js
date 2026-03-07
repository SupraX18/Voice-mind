import { useState, useRef, useCallback, useEffect } from 'react';

const MIN_DURATION = 5;   // seconds (relaxed from 20 for easy testing)
const MAX_DURATION = 30;  // seconds

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording]   = useState(false);
  const [isPaused, setIsPaused]         = useState(false);
  const [audioBlob, setAudioBlob]       = useState(null);
  const [duration, setDuration]         = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const [error, setError]               = useState(null);
  const [permission, setPermission]     = useState(null); // 'granted'|'denied'|null

  const mediaRecorder = useRef(null);
  const audioChunks   = useRef([]);
  const analyser      = useRef(null);
  const animFrame     = useRef(null);
  const timerRef      = useRef(null);
  const streamRef     = useRef(null);
  const audioCtx      = useRef(null);
  const startTime     = useRef(0);

  // ── Waveform animation ─────────────────────────────────────────────────────
  const drawWaveform = useCallback(() => {
    if (!analyser.current) return;
    const data = new Uint8Array(analyser.current.frequencyBinCount);
    analyser.current.getByteFrequencyData(data);

    // Downsample to 60 bars
    const barCount = 60;
    const step     = Math.floor(data.length / barCount);
    const bars     = [];
    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += data[i * step + j];
      bars.push(sum / step / 255);
    }
    setWaveformData(bars);
    animFrame.current = requestAnimationFrame(drawWaveform);
  }, []);

  // ── Start ──────────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setDuration(0);
    audioChunks.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setPermission('granted');

      // Audio context + analyser
      audioCtx.current  = new (window.AudioContext || window.webkitAudioContext)();
      const source      = audioCtx.current.createMediaStreamSource(stream);
      analyser.current  = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 256;
      source.connect(analyser.current);

      // Choose best MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg;codecs=opus';

      mediaRecorder.current = new MediaRecorder(stream, { mimeType });
      mediaRecorder.current.ondataavailable = e => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mimeType });
        setAudioBlob(blob);
      };

      mediaRecorder.current.start(100);
      setIsRecording(true);
      startTime.current = Date.now();

      // Timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime.current) / 1000;
        setDuration(elapsed);
        if (elapsed >= MAX_DURATION) stopRecording();
      }, 100);

      drawWaveform();

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPermission('denied');
        setError('Microphone access denied. Please allow microphone in browser settings.');
      } else {
        setError(`Could not start recording: ${err.message}`);
      }
    }
  }, [drawWaveform]);

  // ── Stop ───────────────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtx.current)  audioCtx.current.close();
    if (animFrame.current)  cancelAnimationFrame(animFrame.current);
    if (timerRef.current)   clearInterval(timerRef.current);

    setIsRecording(false);
    setIsPaused(false);
    setWaveformData([]);
  }, []);

  const reset = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    setDuration(0);
    setError(null);
  }, [stopRecording]);

  // Auto-stop on unmount
  useEffect(() => () => stopRecording(), [stopRecording]);

  return {
    isRecording,
    isPaused,
    audioBlob,
    duration,
    waveformData,
    error,
    permission,
    startRecording,
    stopRecording,
    reset,
    minDuration: MIN_DURATION,
    maxDuration: MAX_DURATION,
  };
};
