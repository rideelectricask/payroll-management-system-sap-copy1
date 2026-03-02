import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { ACCOUNT_API } from "@/endpoints";
import { LogIn, User, Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .lg-card { animation: fadeUp 0.3s ease; }
  .lg-input { transition: border-color 0.15s; font-family: inherit; }
  .lg-input:focus { outline: 2px solid #2563EB; outline-offset: 0; border-color: transparent; }
  .lg-input:hover:not(:focus):not(:disabled) { border-color: #94A3B8; }
  .lg-btn { transition: background 0.15s, opacity 0.15s; font-family: inherit; }
  .lg-btn:hover:not(:disabled) { background: #1D4ED8 !important; }
  .lg-btn:active:not(:disabled) { opacity: 0.9; }
  .lg-eye { transition: color 0.15s; background: none; border: none; cursor: pointer; display: flex; align-items: center; }
  .lg-eye:hover { color: #475569 !important; }
`;

const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: "100%",
  padding: "11px 12px 11px 40px",
  border: "1px solid #E2E8F0",
  borderRadius: 10,
  fontSize: 14,
  color: "#1E293B",
  background: "#F8FAFC",
  fontFamily: "inherit",
};

const iconStyle = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "#94A3B8",
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") setIsLoggedIn(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");
    try {
      const response = await fetch(ACCOUNT_API);
      const data = await response.json();
      const matchingUser = data.find((user) => user.jhon === username);
      if (matchingUser && matchingUser.bert === password) {
        Cookies.set("loggedIn", true, { secure: true, sameSite: "strict" });
        localStorage.setItem("isLoggedIn", "true");
        setIsLoggedIn(true);
        navigate("/");
      } else {
        Cookies.remove("loggedIn");
        localStorage.removeItem("isLoggedIn");
        setIsLoggedIn(false);
        setLoginError(!matchingUser ? "Username tidak ditemukan" : "Password salah");
      }
    } catch {
      setLoginError("Koneksi bermasalah, coba lagi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("loggedIn");
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  if (isLoggedIn) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", padding: 16 }}>
          <div className="lg-card" style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "#DCFCE7", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <CheckCircle size={28} color="#16A34A" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Selamat Datang!</h2>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>Anda sudah masuk ke sistem</p>
            <button
              onClick={handleLogout}
              className="lg-btn"
              style={{ padding: "10px 24px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#475569", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              Keluar
            </button>
          </div>
        </div>
      </>
    );
  }

  const isDisabled = isLoading || !username.trim() || !password.trim();

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", padding: 16 }}>
        <div className="lg-card" style={{ width: "100%", maxWidth: 400 }}>

          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, background: "#2563EB", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <LogIn size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Halo, Selamat Datang!</h1>
            <p style={{ fontSize: 13, color: "#94A3B8" }}>Masuk menggunakan username dan password Anda</p>
          </div>

          {loginError && (
            <div style={{ marginBottom: 16, padding: "12px 14px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertCircle size={15} color="#F43F5E" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "#BE123C", lineHeight: 1.5 }}>{loginError}</p>
            </div>
          )}

          <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Username">
              <div style={{ position: "relative" }}>
                <User size={15} style={iconStyle} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setLoginError(""); }}
                  placeholder="Masukkan username"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  className="lg-input"
                  style={inputStyle}
                />
              </div>
            </Field>

            <Field label="Password">
              <div style={{ position: "relative" }}>
                <Lock size={15} style={iconStyle} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  placeholder="Masukkan password"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="lg-input"
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="lg-eye"
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", padding: 2 }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <button
              type="submit"
              onClick={handleLogin}
              disabled={isDisabled}
              className="lg-btn"
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: isDisabled ? "#BFDBFE" : "#2563EB", color: isDisabled ? "#93C5FD" : "#fff", fontSize: 14, fontWeight: 700, cursor: isDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 2 }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  Masuk
                </>
              )}
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "#CBD5E1", marginTop: 16 }}>
            Dengan masuk, Anda menyetujui syarat dan ketentuan
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;