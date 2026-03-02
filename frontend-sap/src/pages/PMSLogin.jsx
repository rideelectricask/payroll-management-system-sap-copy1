import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { LogIn, User, Mail, Loader2, AlertCircle } from 'lucide-react';

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .pl-card { animation: fadeUp 0.3s ease; }
  .pl-input { transition: border-color 0.15s; }
  .pl-input:focus { outline: 2px solid #2563EB; outline-offset: 0; border-color: transparent; }
  .pl-input:hover:not(:focus) { border-color: #94A3B8; }
  .pl-tab { transition: background 0.15s, color 0.15s; }
  .pl-btn { transition: background 0.15s, opacity 0.15s; }
  .pl-btn:hover:not(:disabled) { background: #1D4ED8 !important; }
  .pl-btn:active:not(:disabled) { opacity: 0.9; }
`;

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </label>
    {children}
  </div>
);

export default function PMSLogin() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loginMethod, setLoginMethod] = useState('username');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/pms', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(
        loginMethod === 'username' ? username.trim() : null,
        loginMethod === 'email' ? email.trim() : null
      );
      if (result.success) {
        navigate('/pms', { replace: true });
      } else {
        setError(result.message || 'Login gagal. Periksa kredensial Anda.');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const currentValue = loginMethod === 'username' ? username : email;
  const isDisabled = loading || !currentValue.trim();

  const inputStyle = {
    width: '100%',
    padding: '11px 12px 11px 40px',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    fontSize: 14,
    color: '#1E293B',
    background: '#F8FAFC',
    fontFamily: 'inherit',
  };

  const iconStyle = {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#94A3B8',
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', padding: 16 }}>
        <div className="pl-card" style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, background: '#2563EB', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <LogIn size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Payroll Management System</h1>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>Masuk menggunakan username atau email terdaftar</p>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={15} color="#F43F5E" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#BE123C', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: '#F1F5F9', borderRadius: 10, padding: 4 }}>
              {[
                { id: 'username', label: 'Username', icon: <User size={13} /> },
                { id: 'email', label: 'Email', icon: <Mail size={13} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setLoginMethod(tab.id); setError(''); }}
                  className="pl-tab"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 8px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: loginMethod === tab.id ? '#FFFFFF' : 'transparent', color: loginMethod === tab.id ? '#2563EB' : '#64748B', boxShadow: loginMethod === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {loginMethod === 'username' ? (
              <Field label="Username">
                <div style={{ position: 'relative' }}>
                  <User size={15} style={iconStyle} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    required
                    autoComplete="username"
                    className="pl-input"
                    style={inputStyle}
                  />
                </div>
              </Field>
            ) : (
              <Field label="Alamat Email">
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={iconStyle} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    autoComplete="email"
                    className="pl-input"
                    style={inputStyle}
                  />
                </div>
              </Field>
            )}

            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              className="pl-btn"
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: isDisabled ? '#BFDBFE' : '#2563EB', color: isDisabled ? '#93C5FD' : '#fff', fontSize: 14, fontWeight: 700, cursor: isDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                  Masuk...
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  Masuk ke Sistem
                </>
              )}
            </button>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <a href="/login-mitra" style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none', fontWeight: 500 }}>
              Login sebagai Driver →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}