// src/pages/JoinRoomPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { joinRoom } from '../firebase/game';
import './JoinRoomPage.css';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Avatar selector for guests
  const avatarThemes = ['bottts', 'adventurer', 'avataaars', 'fun-emoji', 'lorelei', 'micah'];
  const [avatarTheme, setAvatarTheme] = useState('bottts');
  const [avatarSeed, setAvatarSeed] = useState(Math.random().toString(36).substring(7));

  const handleRandomAvatar = () => {
    const randomTheme = avatarThemes[Math.floor(Math.random() * avatarThemes.length)];
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarTheme(randomTheme);
    setAvatarSeed(randomSeed);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) {
      setError('Isi kode room dan username!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const customAvatarUrl = !user ? `https://api.dicebear.com/7.x/${avatarTheme}/svg?seed=${avatarSeed}` : null;
      const { code, guestId } = await joinRoom(roomCode.trim(), playerName.trim(), user?.uid, customAvatarUrl);
      if (!user) {
        sessionStorage.setItem('guestId', guestId);
        sessionStorage.setItem('guestName', playerName.trim());
      }
      sessionStorage.setItem('roomCode', code);
      navigate(`/room/${code}`);
    } catch (err) {
      setError(err.message || 'Gagal bergabung!');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
    setError('');
  };

  return (
    <div className="join-page">
      <div className="join-deco-1" />
      <div className="join-deco-2" />

      <div className="join-container">
        {/* Logo */}
        <div className="join-logo">
          <span className="join-logo-icon">🔑</span>
          <div className="join-logo-name">Gabung Room</div>
          <p className="join-logo-sub">Masukkan kode dari host untuk bergabung!</p>
        </div>

        {/* Card */}
        <div className="join-card">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form className="join-form" onSubmit={handleJoin}>
            {/* Code input */}
            <div className="join-code-section">
              <label className="code-input-label">Kode Room (6 Karakter)</label>
              <div 
                className="code-input-wrapper"
                onClick={() => document.getElementById('room-code')?.focus()}
              >
                {[0,1,2,3,4,5].map((i) => (
                  <div
                    key={i}
                    className={`code-box ${roomCode[i] ? 'filled' : ''} ${i === roomCode.length ? 'active' : ''}`}
                  >
                    {roomCode[i] || ''}
                  </div>
                ))}
                <input
                  className="code-hidden-input"
                  type="text"
                  value={roomCode}
                  onChange={handleCodeChange}
                  maxLength={6}
                  autoComplete="off"
                  autoFocus
                  id="room-code"
                />
              </div>
            </div>

            {!user && (
              <div className="join-avatar-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <label className="form-label">Avatar Kamu</label>
                <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--clr-surface)', margin: '10px 0', border: '3px solid var(--clr-bg)' }}>
                  <img 
                    src={`https://api.dicebear.com/7.x/${avatarTheme}/svg?seed=${avatarSeed}`} 
                    alt="Guest Avatar Preview" 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                </div>
                <button type="button" className="btn btn-outline-white btn-sm" onClick={handleRandomAvatar} style={{ color: 'var(--clr-text-secondary)', borderColor: 'var(--clr-border)', background: 'white' }}>
                  🎲 Acak Profil
                </button>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="player-name">Username Kamu</label>
              <input
                id="player-name"
                className="form-input"
                type="text"
                placeholder="Masukkan namamu..."
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                maxLength={20}
                required
              />
            </div>

            <button
              id="btn-join-submit"
              type="submit"
              className="join-submit"
              disabled={loading || roomCode.length < 6 || !playerName.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2.5 }} />
                  Bergabung...
                </>
              ) : '🚀 Gabung Sekarang!'}
            </button>
          </form>
        </div>

        <div className="join-footer">
          <span onClick={() => navigate('/')}>← Kembali ke Beranda</span>
          <span onClick={() => navigate('/auth?mode=login&redirect=create-room')}>
            Ingin buat room? Masuk sebagai Host →
          </span>
        </div>
      </div>
    </div>
  );
}
