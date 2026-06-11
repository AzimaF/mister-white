// src/pages/AuthPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { registerHost, loginHost } from '../firebase/auth';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const redirectTo = searchParams.get('redirect') || '';
  const initialMode = searchParams.get('mode') || 'login';

  const [mode, setMode] = useState(initialMode); // login | register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  // Redirect jika sudah login
  useEffect(() => {
    if (user) {
      navigate(redirectTo ? `/${redirectTo}` : '/create-room');
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (form.password !== form.confirmPassword) {
          throw new Error('Password tidak cocok!');
        }
        if (form.password.length < 6) {
          throw new Error('Password minimal 6 karakter!');
        }
        if (!form.username.trim()) {
          throw new Error('Username tidak boleh kosong!');
        }
        await registerHost(form.email, form.password, form.username.trim());
      } else {
        await loginHost(form.email, form.password);
      }
      navigate(redirectTo ? `/${redirectTo}` : '/create-room');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('email-already-in-use')) setError('Email sudah terdaftar!');
      else if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
        setError('Email atau password salah!');
      else if (msg.includes('invalid-email')) setError('Format email tidak valid!');
      else setError(msg || 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-deco-1" />
      <div className="auth-deco-2" />

      <div className="auth-container">
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🕵️</span>
          <div className="auth-logo-name">Mister White</div>
        </div>

        {/* Card */}
        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              id="tab-login"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Masuk
            </button>
            <button
              id="tab-register"
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Daftar
            </button>
          </div>

          {/* Notice */}
          <div className="auth-notice">
            🏠 <strong>Khusus untuk Host.</strong> Hanya pembuat room yang perlu login. Pemain biasa cukup masukkan kode room dan username!
          </div>

          <h2 className="auth-title">
            {mode === 'login' ? 'Selamat Datang Kembali!' : 'Buat Akun Host'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Masuk untuk membuat dan mengelola room game.'
              : 'Daftar untuk mulai membuat room game Mister White.'}
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <input
                  id="username"
                  className={`form-input ${error && !form.username ? 'error' : ''}`}
                  type="text"
                  name="username"
                  placeholder="Nama yang tampil di game"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="form-input"
                type="email"
                name="email"
                placeholder="email@contoh.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: 'var(--clr-text-muted)'
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Konfirmasi Password</label>
                <input
                  id="confirmPassword"
                  className="form-input"
                  type="password"
                  name="confirmPassword"
                  placeholder="Ulangi password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  {mode === 'login' ? 'Masuk...' : 'Mendaftar...'}
                </>
              ) : (
                mode === 'login' ? '🚀 Masuk & Buat Room' : '✨ Daftar Sekarang'
              )}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          <span onClick={() => navigate('/')}>← Kembali ke Beranda</span>
          <span onClick={() => navigate('/join')}>Gabung sebagai pemain tanpa login →</span>
        </div>
      </div>
    </div>
  );
}
