import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode]       = useState('login');
  const [form, setForm]       = useState({ email:'', password:'', username:'', full_name:'' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.username) { setError('Username is required'); setLoading(false); return; }
        await register(form);
      }
      navigate('/record');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = e => { if (e.key === 'Enter') submit(); };

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24,
    }}>
      {/* Background orb */}
      <div style={{
        position:'fixed', top:'20%', left:'50%', transform:'translateX(-50%)',
        width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      <div className="animate-fade-up" style={{
        width:'100%', maxWidth:400,
        background:'var(--surface)',
        border:'1px solid var(--border)',
        borderRadius:'var(--radius-xl)',
        padding:40,
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:56, height:56, borderRadius:16,
            background:'linear-gradient(135deg,var(--teal-500),var(--teal-700))',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            marginBottom:16, boxShadow:'var(--shadow-glow-teal)',
          }}>
            <Brain size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, color:'var(--text)', marginBottom:4 }}>
            VoiceMind
          </h1>
          <p style={{ color:'var(--text-dim)', fontSize:13 }}>
            {mode === 'login' ? 'Sign in to track your mental health' : 'Create your wellness account'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr',
          background:'var(--surface2)', borderRadius:10, padding:4, marginBottom:24,
        }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{
                padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer',
                background: mode===m ? 'var(--teal-700)' : 'transparent',
                color: mode===m ? '#fff' : 'var(--text-dim)',
                fontFamily:'var(--font-body)', fontSize:13, fontWeight:500,
                transition:'all 0.15s',
              }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)',
            borderRadius:8, padding:'10px 14px', marginBottom:16,
            display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--rose-400)',
          }}>
            <AlertCircle size={14} style={{ flexShrink:0 }} />
            {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {mode === 'register' && (
            <>
              <div>
                <label style={{ fontSize:12, color:'var(--text-dim)', marginBottom:4, display:'block' }}>Username *</label>
                <input className="input-field" name="username" placeholder="yourname"
                  value={form.username} onChange={handle} onKeyDown={onKeyDown} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text-dim)', marginBottom:4, display:'block' }}>Full Name</label>
                <input className="input-field" name="full_name" placeholder="Your Name"
                  value={form.full_name} onChange={handle} onKeyDown={onKeyDown} />
              </div>
            </>
          )}
          <div>
            <label style={{ fontSize:12, color:'var(--text-dim)', marginBottom:4, display:'block' }}>Email *</label>
            <input className="input-field" name="email" type="email" placeholder="you@example.com"
              value={form.email} onChange={handle} onKeyDown={onKeyDown} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text-dim)', marginBottom:4, display:'block' }}>Password *</label>
            <div style={{ position:'relative' }}>
              <input className="input-field" name="password" type={showPw ? 'text' : 'password'}
                placeholder="••••••••" value={form.password} onChange={handle} onKeyDown={onKeyDown}
                style={{ paddingRight:40 }} />
              <button onClick={() => setShowPw(v=>!v)} style={{
                position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', display:'flex',
              }}>
                {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          <button className="btn btn-primary" onClick={submit} disabled={loading}
            style={{ marginTop:8, justifyContent:'center', padding:'12px 0', fontSize:14 }}>
            {loading
              ? <><span className="spinner" style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block' }}/> Please wait…</>
              : mode === 'login' ? 'Sign In' : 'Create Account'
            }
          </button>
        </div>

        <p style={{ textAlign:'center', color:'var(--text-dim)', fontSize:12, marginTop:20 }}>
          {mode === 'login'
            ? <>No account? <button onClick={() => setMode('register')} style={{ background:'none', border:'none', color:'var(--teal-400)', cursor:'pointer', fontSize:12 }}>Register free</button></>
            : <>Already registered? <button onClick={() => setMode('login')} style={{ background:'none', border:'none', color:'var(--teal-400)', cursor:'pointer', fontSize:12 }}>Sign in</button></>
          }
        </p>
      </div>
    </div>
  );
}
