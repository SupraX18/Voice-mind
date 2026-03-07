import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, Target, Flame, Brain } from 'lucide-react';

const EMOTION_PALETTE = {
  Calm:            '#34d399',
  Neutral:         '#94a3b8',
  Stressed:        '#fbbf24',
  Anxious:         '#f97316',
  'Highly Stressed':'#f43f5e',
  Sad:             '#a78bfa',
  'N/A':           '#475569',
};

const TREND_ICONS = {
  improving: <TrendingDown size={14} color="#34d399" />,
  worsening: <TrendingUp  size={14} color="#f43f5e" />,
  stable:    <Minus       size={14} color="#94a3b8" />,
};

const WELLNESS_TIPS = [
  "Take 3 deep breaths before starting your workday 🌬️",
  "Drink a glass of water — hydration reduces cortisol 💧",
  "A 10-min walk boosts serotonin naturally 🚶",
  "Try box breathing: 4s in · 4s hold · 4s out · 4s hold 🧘",
  "Journaling for 5 minutes can reduce anxiety by 28% 📓",
  "Limit caffeine after 2 PM for better sleep quality ☕",
  "Progress — not perfection — is the goal today 🌱",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'var(--surface2)', border:'1px solid var(--border)',
      borderRadius:8, padding:'8px 12px', fontSize:12,
    }}>
      <div style={{ color:'var(--text-dim)', marginBottom:4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--teal-400)', fontWeight:500 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tip]                 = useState(() => WELLNESS_TIPS[Math.floor(Math.random() * WELLNESS_TIPS.length)]);

  useEffect(() => {
    api.get('/api/dashboard/')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <div className="spinner" style={{ width:36, height:36, border:'3px solid var(--surface2)', borderTopColor:'var(--teal-500)', borderRadius:'50%' }}/>
    </div>
  );

  if (!data || data.stats.total_sessions === 0) return (
    <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center', paddingTop:80 }}>
      <Brain size={56} color="var(--teal-600)" style={{ marginBottom:20 }}/>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:28, marginBottom:12 }}>No data yet</h2>
      <p style={{ color:'var(--text-dim)', marginBottom:28 }}>
        Record your voice to start tracking your mental wellness journey.
      </p>
      <a href="/record" className="btn btn-primary" style={{ padding:'12px 28px', fontSize:15 }}>
        Start Recording
      </a>
    </div>
  );

  const { stats, trend_data, weekly_patterns, emotion_distribution } = data;

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, marginBottom:6 }}>Dashboard</h1>
        <p style={{ color:'var(--text-dim)', fontSize:14 }}>Your mental wellness overview</p>
      </div>

      {/* Tip banner */}
      <div style={{
        background:'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(139,92,246,0.08))',
        border:'1px solid rgba(20,184,166,0.2)', borderRadius:'var(--radius-lg)',
        padding:'14px 20px', marginBottom:24, fontSize:13, color:'var(--text)',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <span style={{ fontSize:18 }}>💡</span>
        <span><strong>Daily tip: </strong>{tip}</span>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:24 }}>
        {[
          { label:'7-Day Avg Stress', value:`${stats.avg_stress_7d}`, sub:'/ 100', icon:Target, color:'var(--teal-400)' },
          { label:'30-Day Avg',       value:`${stats.avg_stress_30d}`, sub:'/ 100', icon:Calendar, color:'var(--violet-400)' },
          { label:'Total Sessions',   value:`${stats.total_sessions}`,  sub:'recordings', icon:Brain, color:'var(--amber-400)' },
          { label:'Check-in Streak',  value:`${stats.streak_days}`,     sub:'days', icon:Flame, color:'var(--rose-400)' },
        ].map(({ label, value, sub, icon:Icon, color }) => (
          <div key={label} className="card card-hover" style={{ padding:'16px 18px' }}>
            <Icon size={16} color={color} style={{ marginBottom:8 }}/>
            <div style={{ fontFamily:'var(--font-display)', fontSize:28, color:'var(--text)', lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:10, color, fontWeight:600, letterSpacing:'0.05em', marginTop:2, textTransform:'uppercase' }}>{sub}</div>
            <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Trend info */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <div className="card" style={{ flex:1, minWidth:160, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
          {TREND_ICONS[stats.trend]}
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', textTransform:'capitalize' }}>{stats.trend}</div>
            <div style={{ fontSize:11, color:'var(--text-dim)' }}>7-day trend</div>
          </div>
        </div>
        <div className="card" style={{ flex:1, minWidth:160, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background: EMOTION_PALETTE[stats.dominant_emotion] || 'var(--teal-500)' }}/>
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{stats.dominant_emotion}</div>
            <div style={{ fontSize:11, color:'var(--text-dim)' }}>Dominant emotion</div>
          </div>
        </div>
      </div>

      {/* Stress trend chart */}
      {trend_data.length > 0 && (
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:20, color:'var(--text)' }}>
            Stress Level Over Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend_data}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3"/>
              <XAxis dataKey="date" tick={{ fontSize:11, fill:'var(--text-dim)' }} tickLine={false} axisLine={false}/>
              <YAxis domain={[0,100]} tick={{ fontSize:11, fill:'var(--text-dim)' }} tickLine={false} axisLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Line
                type="monotone" dataKey="stress_score" name="Stress Score"
                stroke="var(--teal-400)" strokeWidth={2.5}
                dot={{ fill:'var(--teal-500)', r:3 }} activeDot={{ r:5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        {/* Weekly pattern */}
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:20, color:'var(--text)' }}>Weekly Patterns</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekly_patterns} barSize={20}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="day" tick={{ fontSize:11, fill:'var(--text-dim)' }} tickLine={false} axisLine={false}/>
              <YAxis domain={[0,100]} tick={{ fontSize:11, fill:'var(--text-dim)' }} tickLine={false} axisLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="avg_stress" name="Avg Stress" fill="var(--teal-600)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Emotion distribution */}
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:16, color:'var(--text)' }}>Emotion Distribution</h3>
          {emotion_distribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={emotion_distribution} dataKey="count" cx="50%" cy="50%"
                    innerRadius={35} outerRadius={52} paddingAngle={3}>
                    {emotion_distribution.map(e => (
                      <Cell key={e.emotion} fill={EMOTION_PALETTE[e.emotion] || '#475569'}/>
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
                {emotion_distribution.map(e => (
                  <div key={e.emotion} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: EMOTION_PALETTE[e.emotion] || '#475569' }}/>
                    <span style={{ color:'var(--text-dim)' }}>{e.emotion} ({e.percentage}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color:'var(--text-dim)', fontSize:13, marginTop:20 }}>No emotion data yet.</p>
          )}
        </div>
      </div>

      {/* Latest result */}
      {data.latest_analysis && (
        <div className="card" style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:4 }}>Latest Analysis</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--text)' }}>
              {data.latest_analysis.emotional_state}
            </div>
            <div style={{ fontSize:13, color:'var(--text-dim)' }}>
              Stress: {data.latest_analysis.stress_score} · {data.latest_analysis.stress_level}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:40, color: EMOTION_PALETTE[data.latest_analysis.emotional_state] }}>
              {data.latest_analysis.stress_score}
            </div>
            <div style={{ fontSize:11, color:'var(--text-dim)' }}>stress score</div>
          </div>
        </div>
      )}
    </div>
  );
}
