import React, { useState } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { api } from '../context/AuthContext';
import {
  Mic, Square, RotateCcw, Send,
  AlertCircle, CheckCircle, Zap, Heart, Wind, Brain,
} from 'lucide-react';

const EMOTION_COLORS = {
  Calm:             '#34d399',
  Neutral:          '#94a3b8',
  Stressed:         '#fbbf24',
  Anxious:          '#f97316',
  'Highly Stressed':'#f43f5e',
  Sad:              '#a78bfa',
};

const LEVEL_COLORS = { Low:'#34d399', Medium:'#fbbf24', High:'#f43f5e' };

export default function RecordPage() {
  const recorder               = useVoiceRecorder();
  const [analyzing, setAnaly]  = useState(false);
  const [result, setResult]    = useState(null);
  const [uploadErr, setUpErr]  = useState('');

  const analyze = async () => {
    if (!recorder.audioBlob) return;
    setAnaly(true); setUpErr(''); setResult(null);
    try {
      const form = new FormData();
      form.append('file', recorder.audioBlob, 'recording.webm');
      const { data } = await api.post('/api/analysis/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err) {
      setUpErr(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setAnaly(false);
    }
  };

  const reset = () => { recorder.reset(); setResult(null); setUpErr(''); };

  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2,'0')}`;

  return (
    <div style={{ maxWidth:780, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, color:'var(--text)', marginBottom:6 }}>
          Voice Analysis
        </h1>
        <p style={{ color:'var(--text-dim)', fontSize:14 }}>
          Record 5–30 seconds of natural speech to detect your stress level.
        </p>
      </div>

      {/* Recording card */}
      <div className="card" style={{ marginBottom:24, position:'relative', overflow:'hidden' }}>
        {/* Background gradient */}
        <div style={{
          position:'absolute', inset:0,
          background: recorder.isRecording
            ? 'radial-gradient(ellipse at 50% 50%, rgba(244,63,94,0.06) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(20,184,166,0.05) 0%, transparent 70%)',
          pointerEvents:'none',
          transition:'background 1s',
        }} />

        {/* Waveform */}
        <div style={{
          height:100, display:'flex', alignItems:'center', justifyContent:'center', gap:3,
          marginBottom:24, position:'relative',
        }}>
          {recorder.isRecording && recorder.waveformData.length > 0 ? (
            recorder.waveformData.map((v, i) => (
              <div key={i} style={{
                width:3, borderRadius:2,
                height: `${Math.max(4, v * 80)}px`,
                background: `hsl(${170 - v * 40}, 70%, 55%)`,
                transition:'height 0.05s ease',
              }} />
            ))
          ) : (
            // Static idle bars
            Array.from({ length:60 }, (_, i) => (
              <div key={i} style={{
                width:3, height: recorder.audioBlob ? `${20 + Math.sin(i * 0.4) * 15}px` : '4px',
                borderRadius:2,
                background: recorder.audioBlob ? 'var(--teal-600)' : 'var(--border)',
                transition:'height 0.3s',
              }} />
            ))
          )}
        </div>

        {/* Timer */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <span style={{
            fontFamily:'var(--font-display)', fontSize:52,
            color: recorder.isRecording ? 'var(--rose-400)' : 'var(--text-dim)',
            letterSpacing:-2,
          }}>
            {fmt(recorder.duration)}
          </span>
          {recorder.isRecording && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:4 }}>
              <div style={{
                width:8, height:8, borderRadius:'50%', background:'var(--rose-400)',
                animation:'pulse-ring 1s ease infinite',
              }} />
              <span style={{ fontSize:12, color:'var(--rose-400)', fontWeight:500 }}>RECORDING</span>
            </div>
          )}
          {recorder.audioBlob && !recorder.isRecording && (
            <div style={{ color:'var(--teal-400)', fontSize:13, marginTop:4, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
              <CheckCircle size={14}/> Recording complete · {fmt(recorder.duration)}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {recorder.isRecording && (
          <div style={{ height:3, background:'var(--surface2)', borderRadius:2, marginBottom:24, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:2,
              background:'linear-gradient(90deg,var(--teal-500),var(--rose-400))',
              width:`${(recorder.duration / recorder.maxDuration) * 100}%`,
              transition:'width 0.1s',
            }} />
          </div>
        )}

        {/* Controls */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          {!recorder.isRecording && !recorder.audioBlob && (
            <button className="btn btn-primary" onClick={recorder.startRecording}
              style={{ padding:'14px 32px', fontSize:15 }}>
              <Mic size={17}/> Start Recording
            </button>
          )}

          {recorder.isRecording && (
            <button className="btn btn-danger" onClick={recorder.stopRecording}
              style={{ padding:'14px 32px', fontSize:15 }}>
              <Square size={17} fill="currentColor"/> Stop Recording
            </button>
          )}

          {recorder.audioBlob && !recorder.isRecording && (
            <>
              <button className="btn btn-primary" onClick={analyze} disabled={analyzing}
                style={{ padding:'14px 28px', fontSize:15 }}>
                {analyzing
                  ? <><span className="spinner" style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block' }}/> Analyzing…</>
                  : <><Send size={16}/> Analyze Voice</>
                }
              </button>
              <button className="btn btn-ghost" onClick={reset}>
                <RotateCcw size={15}/> Record Again
              </button>
            </>
          )}
        </div>

        {/* Error */}
        {(recorder.error || uploadErr) && (
          <div style={{
            marginTop:16, background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.25)',
            borderRadius:8, padding:'10px 14px',
            display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--rose-400)',
          }}>
            <AlertCircle size={14}/> {recorder.error || uploadErr}
          </div>
        )}

        {/* Tips */}
        {!recorder.isRecording && !recorder.audioBlob && (
          <p style={{ textAlign:'center', color:'var(--text-dim)', fontSize:12, marginTop:16 }}>
            💡 Speak naturally for 5–30 seconds. Talk about your day for best results.
          </p>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {result && (
        <div className="animate-fade-up">
          {/* Score hero */}
          <div className="card" style={{
            marginBottom:16, textAlign:'center', position:'relative', overflow:'hidden',
            border:`1px solid ${LEVEL_COLORS[result.stress_level]}40`,
          }}>
            <div style={{
              position:'absolute', inset:0,
              background:`radial-gradient(ellipse at 50% 0%, ${LEVEL_COLORS[result.stress_level]}12 0%, transparent 70%)`,
            }} />
            <div style={{ position:'relative' }}>
              <div style={{ marginBottom:8 }}>
                <span style={{
                  fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase',
                  color: LEVEL_COLORS[result.stress_level],
                }}>
                  Stress Level: {result.stress_level}
                </span>
              </div>
              {/* Score ring */}
              <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                <svg width={140} height={140} viewBox="0 0 140 140">
                  <circle cx={70} cy={70} r={58} fill="none" stroke="var(--surface2)" strokeWidth={10}/>
                  <circle cx={70} cy={70} r={58} fill="none"
                    stroke={LEVEL_COLORS[result.stress_level]} strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 58}`}
                    strokeDashoffset={`${2 * Math.PI * 58 * (1 - result.stress_score / 100)}`}
                    transform="rotate(-90 70 70)"
                    style={{ transition:'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div style={{ position:'absolute', textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:36, color:'var(--text)', lineHeight:1 }}>
                    {Math.round(result.stress_score)}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-dim)' }}>/ 100</div>
                </div>
              </div>

              <div style={{ fontSize:20, fontWeight:600, color: EMOTION_COLORS[result.emotional_state] || 'var(--text)', marginBottom:4 }}>
                {result.emotional_state}
              </div>
              <div style={{ fontSize:13, color:'var(--text-dim)' }}>
                Confidence: {(result.confidence_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Audio feature stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
            {[
              { label:'Pitch', value: result.pitch_mean ? `${result.pitch_mean.toFixed(0)} Hz` : 'N/A', icon:Zap, color:'var(--violet-400)' },
              { label:'Energy', value: result.energy_mean ? result.energy_mean.toFixed(3) : 'N/A', icon:Heart, color:'var(--rose-400)' },
              { label:'Duration', value: `${result.audio_duration.toFixed(1)}s`, icon:Wind, color:'var(--teal-400)' },
            ].map(({ label, value, icon:Icon, color }) => (
              <div key={label} className="card" style={{ textAlign:'center', padding:16 }}>
                <Icon size={20} color={color} style={{ marginBottom:6 }} />
                <div style={{ fontSize:16, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{value}</div>
                <div style={{ fontSize:11, color:'var(--text-dim)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          {result.suggestions?.length > 0 && (
            <div className="card">
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <Brain size={16} color="var(--teal-400)"/>
                <span style={{ fontWeight:600, fontSize:15, color:'var(--text)' }}>Personalised Suggestions</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {result.suggestions.map((s, i) => (
                  <div key={i} style={{
                    display:'flex', gap:12, alignItems:'flex-start',
                    background:'var(--surface2)', borderRadius:8, padding:'10px 14px',
                  }}>
                    <div style={{
                      width:22, height:22, borderRadius:'50%',
                      background:'var(--teal-700)', display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:11, fontWeight:600, color:'#fff', flexShrink:0,
                    }}>{i+1}</div>
                    <span style={{ fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={reset} style={{ marginTop:16, width:'100%', justifyContent:'center' }}>
                <RotateCcw size={14}/> New Recording
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
