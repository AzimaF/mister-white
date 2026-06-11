// src/pages/LandingPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const mockPlayers = [
  { name: 'Andi', emoji: '🧑', status: 'civilian' },
  { name: 'Budi', emoji: '👱', status: 'civilian' },
  { name: 'Citra', emoji: '👩', status: 'unknown' },
  { name: 'Dito', emoji: '🧔', status: 'civilian' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoom = () => {
    if (user) navigate('/create-room');
    else navigate('/auth?mode=login&redirect=create-room');
  };

  return (
    <div style={{ background: 'var(--clr-bg)', minHeight: '100vh' }}>

      {/* ---- Navbar ---- */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="nav-logo-pill" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="nav-logo-dot">🕵️</div>
            <span className="nav-logo-text">Mister White</span>
          </div>

          <div className="nav-links">
            <a href="#cara-bermain" className="nav-link">Cara Bermain</a>
            <a href="#fitur" className="nav-link">Fitur</a>
          </div>

          <div className="nav-actions desktop-only">
            {user ? (
              <>
                <button className="btn btn-white btn-sm" onClick={() => navigate('/create-room')}>
                  🏠 Buat Room
                </button>
                <button className="btn btn-white btn-sm" onClick={() => navigate('/profile')}>
                  👤 Profil
                </button>
                <button className="btn btn-green btn-sm" onClick={handleLogout}>
                  🚪 Keluar
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-white btn-sm" onClick={() => navigate('/auth?mode=login')}>
                  Masuk
                </button>
                <button className="btn btn-green btn-sm" onClick={() => navigate('/join')}>
                  Gabung Game
                </button>
              </>
            )}
          </div>
            
          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)}>
            ☰
          </button>
        </div>

        {/* Mobile Sidebar */}
        <div className={`mobile-sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
        <div className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="nav-logo-dot" style={{ width: 32, height: 32, fontSize: '1rem' }}>🕵️</div>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Mister White</span>
            </div>
            <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>✕</button>
          </div>
          
          <div className="mobile-sidebar-links">
            <div className="mobile-sidebar-title">Menu Utama</div>
            <a href="#cara-bermain" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Cara Bermain</a>
            <a href="#fitur" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Fitur</a>
          </div>

          <div className="mobile-sidebar-actions">
            <div className="mobile-sidebar-title">Aksi</div>
            {user ? (
              <>
                <button className="btn btn-white" onClick={() => { navigate('/create-room'); setMobileMenuOpen(false); }}>
                  🏠 Buat Room
                </button>
                <button className="btn btn-white" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                  👤 Profil
                </button>
                <button className="btn btn-green" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                  🚪 Keluar
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-white" onClick={() => { navigate('/auth?mode=login'); setMobileMenuOpen(false); }}>
                  Masuk
                </button>
                <button className="btn btn-green" onClick={() => { navigate('/join'); setMobileMenuOpen(false); }}>
                  Gabung Game
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-card">
            <div className="hero-card-content">
              {/* Text Side */}
              <div className="hero-text animate-fade-up">
                <div className="hero-eyebrow">
                  🎮 Game Sosial Multiplayer
                </div>
                <h1 className="hero-title">
                  Siapa <span className="highlight">Mr. White</span><br />di Antara Kalian?
                </h1>
                <p className="hero-subtitle">
                  Game detektif seru untuk dimainkan bersama teman! Civilian mendapat kata rahasia,
                  Mr. White harus menebaknya. Temukan impostornya sebelum terlambat!
                </p>
                <div className="hero-actions">
                  <button id="btn-create-room-hero" className="btn btn-primary btn-lg" onClick={handleCreateRoom}>
                    🏠 Buat Room
                  </button>
                  <button id="btn-join-hero" className="btn btn-blue btn-lg" onClick={() => navigate('/join')}>
                    🔑 Gabung Room
                  </button>
                </div>

                {/* Stats */}
                <div className="hero-stats-row">
                  {[
                    { num: '2–20', label: 'Pemain per Room', color: '' },
                    { num: '500+', label: 'Kata Tersedia', color: '' },
                    { num: '100%', label: 'Gratis & Online', color: '' },
                  ].map((s) => (
                    <div key={s.label} className="hero-stat">
                      <div className="hero-stat-num">{s.num}</div>
                      <div className="hero-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual/Mockup Side */}
              <div className="hero-visual">
                <div className="hero-mockup animate-fade-up" style={{ animationDelay: '0.15s' }}>
                  <div className="hero-mockup-title">👥 Pemain dalam Room</div>
                  <div className="hero-players-row">
                    {mockPlayers.map((p) => (
                      <div key={p.name} className="hero-player-row">
                        <div className="hero-player-emo">{p.emoji}</div>
                        <div className="hero-player-name">{p.name}</div>
                        <div className={`hero-player-status ${p.status}`}>
                          {p.status === 'civilian' ? 'Siap ✓' : '?'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hero-word-chip">
                    <div>
                      <div className="hero-word-chip-label">🔐 Katamu</div>
                      <div className="hero-word-chip-word">Kucing 🐱</div>
                    </div>
                    <div style={{ fontSize: '1.5rem' }}>✅</div>
                  </div>
                </div>
                <div className="hero-deco-1" />
                <div className="hero-deco-2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- How to Play ---- */}
      <section id="cara-bermain" className="howto-section">
        <div className="howto-inner">
          <div className="howto-header animate-fade-up">
            <h2 className="howto-title">Cara Bermain?</h2>
            <p className="howto-subtitle">4 langkah mudah untuk mulai bermain bersama teman</p>
          </div>
          <div className="howto-grid">
            {[
              {
                icon: '🏠',
                title: 'Buat atau Gabung Room',
                desc: 'Host login dan buat room, bagikan kode 6 digit ke teman. Teman cukup masukkan kode + username.',
              },
              {
                icon: '🎭',
                title: 'Terima Peran & Kata',
                desc: 'Setiap pemain dapat peran rahasia. Civilian dapat kata, Mr. White mungkin tidak mendapat kata!',
              },
              {
                icon: '🎤',
                title: 'Berikan Petunjuk',
                desc: 'Bergiliran beri clue tanpa menyebut kata langsung. Mr. White harus berpura-pura tahu!',
              },
              {
                icon: '🗳️',
                title: 'Vote & Singkap Impostor',
                desc: 'Vote siapa Mr. White. Yang terpilih dikeluarkan. Poin dibagi sesuai hasilnya!',
              },
            ].map((step, i) => (
              <div key={i} className="howto-card animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="howto-card-accent" />
                <div className="howto-step-num">{i + 1}</div>
                <span className="howto-icon">{step.icon}</span>
                <div className="howto-card-title">{step.title}</div>
                <div className="howto-card-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Features ---- */}
      <section id="fitur" className="features-section">
        <div className="features-inner">
          <div className="features-header animate-fade-up">
            <h2 className="features-title">Kenapa Mister White?</h2>
          </div>
          <div className="features-grid">
            {[
              { icon: '⚡', title: 'Tanpa Download', desc: 'Mainkan langsung di browser, tidak perlu install apapun!' },
              { icon: '🔗', title: 'Kode Room Instan', desc: 'Cukup masukkan kode 6 digit dan langsung masuk room.' },
              { icon: '🌍', title: 'Multi Bahasa', desc: 'Kata tersedia dalam Bahasa Indonesia dan Inggris.' },
              { icon: '🕵️', title: 'Mode Diacak', desc: 'Mr. White bisa dapat kata mirip. Semakin menantang!' },
              { icon: '⏱️', title: 'Timer Terintegrasi', desc: 'Timer per giliran dengan pause oleh host.' },
              { icon: '🏆', title: 'Sistem Poin', desc: 'Kumpulkan 100 poin untuk menang! Bermain ronde demi ronde.' },
            ].map((f, i) => (
              <div key={i} className="feature-card animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="feature-icon-wrap">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-card animate-fade-up">
            <div className="cta-blob-1" />
            <div className="cta-blob-2" />
            <span className="cta-emoji">🎮</span>
            <h2 className="cta-title">Siap Bermain Sekarang?</h2>
            <p className="cta-subtitle">Tidak perlu daftar untuk bergabung. Cukup minta kode room dari host!</p>
            <div className="cta-buttons">
              <button id="btn-create-room-cta" className="btn btn-primary btn-lg" onClick={handleCreateRoom}>
                🏠 Buat Room (Host)
              </button>
              <button id="btn-join-cta" className="btn btn-blue btn-lg" onClick={() => navigate('/join')}>
                🔑 Gabung Game
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="landing-footer">
        <div className="container">
          <p>© 2025 Mister White Game — Dibuat dengan ❤️ untuk bersenang-senang bersama.</p>
        </div>
      </footer>
    </div>
  );
}
