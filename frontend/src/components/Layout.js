import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, BarChart2, History, LogOut, Brain, Menu, X } from 'lucide-react';

const NAV = [
  { to: '/record',    label: 'Record',    icon: Mic },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/history',   label: 'History',   icon: History },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        padding: '24px 16px',
        zIndex: 10,
      }}
      className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40, padding:'0 8px' }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:'linear-gradient(135deg,var(--teal-500),var(--teal-700))',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <Brain size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:15, color:'var(--text)', lineHeight:1.2 }}>VoiceMind</div>
            <div style={{ fontSize:10, color:'var(--text-dim)', letterSpacing:'0.05em' }}>STRESS DETECTOR</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px', borderRadius:'var(--radius-sm)',
                textDecoration:'none', fontSize:14, fontWeight:500,
                transition:'all 0.15s',
                background: isActive ? 'rgba(20,184,166,0.12)' : 'transparent',
                color:       isActive ? 'var(--teal-400)' : 'var(--text-dim)',
                borderLeft:  isActive ? '2px solid var(--teal-500)' : '2px solid transparent',
              })}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{
          padding:'12px 8px', borderTop:'1px solid var(--border)',
          display:'flex', alignItems:'center', gap:10,
        }}>
          <div style={{
            width:32, height:32, borderRadius:'50%',
            background:'linear-gradient(135deg,var(--teal-600),var(--violet-500))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:13, fontWeight:600, color:'#fff', flexShrink:0,
          }}>
            {(user?.username || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {user?.username}
            </div>
            <div style={{ fontSize:11, color:'var(--text-dim)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', padding:4, borderRadius:6, display:'flex' }}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── Mobile toggle ───────────────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(v => !v)}
        style={{
          display:'none', position:'fixed', top:16, left:16, zIndex:20,
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:8, padding:8, cursor:'pointer', color:'var(--text)',
        }}
        className="mobile-menu-btn"
      >
        {mobileOpen ? <X size={18}/> : <Menu size={18}/>}
      </button>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main style={{ flex:1, overflow:'auto', padding:'32px 40px', maxWidth:1200 }}>
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { position:fixed; left:-260px; transition:left 0.25s; }
          .sidebar.mobile-open { left:0; }
          .mobile-menu-btn { display:flex !important; }
          main { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  );
}
