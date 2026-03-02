import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMitraAuth } from '../contexts/mitraAuthContext';
import { Truck, User, Phone, Loader2, AlertCircle, ChevronDown } from 'lucide-react';

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .ml-card { animation: fadeUp 0.3s ease; }
  .ml-input:focus { outline: 2px solid #2563EB; outline-offset: 0; border-color: transparent; }
  .ml-input { transition: border-color 0.15s; }
  .ml-input:hover:not(:focus) { border-color: #94A3B8; }
  .ml-btn { transition: background 0.15s, opacity 0.15s; }
  .ml-btn:hover:not(:disabled) { background: #1D4ED8 !important; }
  .ml-btn:active:not(:disabled) { opacity: 0.9; }
  .ml-select { appearance: none; -webkit-appearance: none; }
`;

const projects = [
  { value: 'jne', label: 'JNE' },
  { value: 'mup', label: 'MUP' },
  { value: 'indomaret', label: 'Indomaret' },
  { value: 'unilever', label: 'Unilever' },
  { value: 'wings', label: 'Wings' },
];

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </label>
    {children}
  </div>
);

export default function MitraLogin() {
  const [driverId, setDriverId] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [project, setProject] = useState('jne');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useMitraAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/mitra', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(driverId.trim(), driverPhone.trim(), project);
      if (result.success) {
        navigate('/mitra', { replace: true });
      } else {
        setError(result.message || 'Login gagal. Periksa ID dan nomor telepon Anda.');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 12px 11px 40px',
    border: '1px solid #334155',
    borderRadius: 10,
    fontSize: 14,
    color: '#F1F5F9',
    background: '#0F172A',
    fontFamily: 'inherit',
  };

  const iconStyle = {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#475569',
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', padding: 16 }}>
        <div className="ml-card" style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, background: '#2563EB', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Truck size={24} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Mitra Driver Portal</h1>
            <p style={{ fontSize: 13, color: '#64748B' }}>Masuk menggunakan Driver ID dan nomor telepon terdaftar</p>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: '#1E0A0A', border: '1px solid #7F1D1D', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#FCA5A5', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid #334155', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Project">
              <div style={{ position: 'relative' }}>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="ml-input ml-select"
                  style={{ ...inputStyle, paddingLeft: 12, paddingRight: 36, cursor: 'pointer' }}
                >
                  {projects.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="#475569" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </Field>

            <Field label="Driver ID">
              <div style={{ position: 'relative' }}>
                <User size={15} style={iconStyle} />
                <input
                  type="text"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  placeholder="Masukkan Driver ID"
                  required
                  className="ml-input"
                  style={{ ...inputStyle, fontFamily: "'DM Mono', monospace" }}
                  autoComplete="username"
                />
              </div>
            </Field>

            <Field label="Nomor Telepon">
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={iconStyle} />
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="Contoh: 8xxxxxxxxxx"
                  required
                  className="ml-input"
                  style={inputStyle}
                  autoComplete="tel"
                />
              </div>
            </Field>

            <button
              onClick={handleSubmit}
              disabled={loading || !driverId.trim() || !driverPhone.trim()}
              className="ml-btn"
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading || !driverId.trim() || !driverPhone.trim() ? '#1E3A6E' : '#2563EB', color: loading || !driverId.trim() || !driverPhone.trim() ? '#64748B' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading || !driverId.trim() || !driverPhone.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                  Masuk...
                </>
              ) : (
                <>
                  <Truck size={15} />
                  Masuk sebagai Driver
                </>
              )}
            </button>
          </div>

          <div style={{ marginTop: 16, padding: '12px 14px', background: '#0C1A2E', border: '1px solid #1E3A5F', borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
              <span style={{ color: '#3B82F6', fontWeight: 600 }}>Pastikan</span> status Anda <span style={{ color: '#22C55E', fontWeight: 600 }}>ONLINE</span> di aplikasi Blitz sebelum melakukan assign order.
            </p>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <a href="/login-pms" style={{ fontSize: 13, color: '#475569', textDecoration: 'none', fontWeight: 500 }}>
              Login sebagai Admin →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}