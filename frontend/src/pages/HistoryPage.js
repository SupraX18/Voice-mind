import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Trash2, ChevronDown, ChevronUp, History as HistIcon, AlertCircle } from 'lucide-react';

const LEVEL_BG   = { Low:'rgba(52,211,153,0.1)',  Medium:'rgba(251,191,36,0.1)',  High:'rgba(244,63,94,0.1)'  };
const LEVEL_COL  = { Low:'var(--emerald-400)',     Medium:'var(--amber-400)',      High:'var(--rose-400)'      };
const EMOT_EMOJI = { Calm:'😌', Neutral:'😐', Stressed:'😤', Anxious:'😰', 'Highly Stressed':'😫', Sad:'😢' };

function AnalysisCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(item.recording_date);
  const dateStr = date.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

  return (
    <div className="card" style={{
      marginBottom:10, border:`1px solid ${LEVEL_COL[item.stress_level]}30`,
      padding:0, overflow:'hidden',
    }}>
      {/* Header row */}
      <div
        style={{
          display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
          cursor:'pointer', userSelect:'none',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{
          width:40, height:40, borderRadius:10, flexShrink:0,
          background: LEVEL_BG[item.stress_level],
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
        }}>
          {EMOT_EMOJI[item.emotional_state] || '🧠'}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
            <span style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{item.emotional_state}</span>
            <span style={{
              fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4,
              background: LEVEL_BG[item.stress_level],
              color: LEVEL_COL[item.stress_level],
            }}>{item.stress_level}</span>
          </div>
          <div style={{ fontSize:11, color:'var(--text-dim)' }}>{dateStr} · {timeStr}</div>
        </div>

        {/* Score bar */}
        <div style={{ width:80, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
          <span style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-display)', color: LEVEL_COL[item.stress_level] }}>
            {Math.round(item.stress_score)}
          </span>
          <div style={{ width:60, height:4, background:'var(--surface2)', borderRadius:2 }}>
            <div style={{
              height:'100%', borderRadius:2,
              background: LEVEL_COL[item.stress_level],
              width:`${item.stress_score}%`,
            }}/>
          </div>
        </div>

        <div style={{ color:'var(--text-dim)', marginLeft:4 }}>
          {expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          borderTop:'1px solid var(--border)', padding:'14px 18px',
          background:'var(--surface2)',
        }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:14 }}>
            {[
              { label:'Confidence', value:`${(item.confidence_score*100).toFixed(0)}%` },
              { label:'Pitch',      value: item.pitch_mean ? `${item.pitch_mean.toFixed(0)} Hz` : 'N/A' },
              { label:'Energy',     value: item.energy_mean ? item.energy_mean.toFixed(3) : 'N/A' },
              { label:'Duration',   value:`${item.audio_duration?.toFixed(1) ?? '?'}s` },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign:'center', padding:'8px 4px', background:'var(--surface)', borderRadius:8 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{value}</div>
                <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          {item.suggestions?.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text-dim)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Suggestions
              </div>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:5 }}>
                {item.suggestions.map((s, i) => (
                  <li key={i} style={{ fontSize:12, color:'var(--text)', display:'flex', gap:8 }}>
                    <span style={{ color:'var(--teal-500)', fontWeight:600 }}>·</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            className="btn btn-danger"
            style={{ fontSize:12, padding:'6px 12px' }}
            onClick={() => onDelete(item.id)}
          >
            <Trash2 size={12}/> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');

  const load = () => {
    setLoading(true);
    api.get('/api/analysis/history?limit=100')
      .then(r => setAnalyses(r.data.analyses))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this analysis?')) return;
    await api.delete(`/api/analysis/${id}`);
    setAnalyses(prev => prev.filter(a => a.id !== id));
  };

  const levels   = ['All', 'Low', 'Medium', 'High'];
  const filtered = filter === 'All' ? analyses : analyses.filter(a => a.stress_level === filter);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <div className="spinner" style={{ width:32, height:32, border:'3px solid var(--surface2)', borderTopColor:'var(--teal-500)', borderRadius:'50%' }}/>
    </div>
  );

  return (
    <div style={{ maxWidth:740, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, marginBottom:4 }}>History</h1>
          <p style={{ color:'var(--text-dim)', fontSize:13 }}>
            {analyses.length} recording{analyses.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {/* Filter pills */}
        <div style={{ display:'flex', gap:6 }}>
          {levels.map(l => (
            <button key={l} onClick={() => setFilter(l)} style={{
              padding:'5px 14px', borderRadius:20, border:'1px solid',
              borderColor: filter===l ? 'var(--teal-500)' : 'var(--border)',
              background:  filter===l ? 'rgba(20,184,166,0.1)' : 'transparent',
              color:       filter===l ? 'var(--teal-400)' : 'var(--text-dim)',
              fontSize:12, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:500,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', paddingTop:60, color:'var(--text-dim)' }}>
          <HistIcon size={40} style={{ marginBottom:12, opacity:0.3 }}/>
          <p>No recordings found{filter !== 'All' ? ` for "${filter}" stress level` : ''}.</p>
        </div>
      ) : (
        filtered.map(item => (
          <AnalysisCard key={item.id} item={item} onDelete={remove} />
        ))
      )}
    </div>
  );
}
