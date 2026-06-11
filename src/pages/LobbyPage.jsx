// src/pages/LobbyPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listenToRoom, startGame, deleteRoom, setPlayerOnline } from '../firebase/game';
import './LobbyPage.css';

export default function LobbyPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const guestId = sessionStorage.getItem('guestId');
  const myId = user?.uid || guestId;
  const isHost = room?.hostId === myId;

  useEffect(() => {
    const unsubscribe = listenToRoom(code, (data) => {
      if (!data) {
        navigate('/');
        return;
      }
      setRoom(data);
      setLoading(false);

      // Redirect to game if started
      if (data.status === 'playing' || data.status === 'voting' || data.status === 'results' || data.status === 'finished') {
        navigate(`/room/${code}/play`);
      }
    });

    // Mark player as online
    if (myId) setPlayerOnline(code, myId, true);

    return () => {
      unsubscribe();
      if (myId) setPlayerOnline(code, myId, false);
    };
  }, [code]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleStartGame = async () => {
    if (!isHost) return;
    const playerCount = Object.keys(room.players || {}).length;
    if (playerCount < 2) {
      setError('Minimal 2 pemain untuk mulai!');
      return;
    }
    setStarting(true);
    setError('');
    try {
      await startGame(code, user.uid);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  };

  const handleLeave = () => {
    if (isHost) {
      if (window.confirm('Kamu adalah host. Hapus room ini?')) {
        deleteRoom(code);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="page-centered">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--clr-text-muted)' }}>Memuat room...</p>
        </div>
      </div>
    );
  }

  const players = Object.values(room?.players || {});

  return (
    <div className="lobby-page">
      <div className="lobby-deco-1" />

      <div className="lobby-container">
        {/* Header */}
        <div className="lobby-header">
          <button className="lobby-back-btn" onClick={handleLeave}>
            ← {isHost ? 'Hapus Room' : 'Keluar'}
          </button>
          <div className="lobby-title">🎮 Ruang Tunggu</div>
          <div />
        </div>

        <div className="lobby-grid">
          {/* Left: Room Code & Info */}
          <div className="lobby-left">
            {/* Room Code Card */}
            <div className="room-code-card">
              <div className="room-code-eyebrow">Kode Room</div>
              <div className="room-code-display">{code}</div>
              <button
                id="btn-copy-code"
                className={`btn btn-sm ${copied ? 'btn-ghost' : 'btn-blue'}`}
                onClick={handleCopyCode}
              >
                {copied ? '✅ Tersalin!' : '📋 Salin Kode'}
              </button>
              <p className="room-code-hint">Bagikan kode ini ke temanmu!</p>
            </div>

            {/* Settings Summary */}
            <div className="lobby-settings-card">
              <div className="settings-card-title">⚙️ Pengaturan Game</div>
              <div className="settings-summary">
                {[
                  { icon: '👥', label: 'Maks. Pemain', value: room.settings?.maxPlayers },
                  { icon: '🕵️', label: 'Mr. White', value: `${room.settings?.mrWhiteCount} orang` },
                  { icon: '🎯', label: 'Mode', value: room.settings?.wordMode === 'normal' ? 'Normal' : 'Diacak' },
                  { icon: '🌍', label: 'Bahasa', value: room.settings?.language === 'id' ? '🇮🇩 Indonesia' : room.settings?.language === 'en' ? '🇬🇧 English' : '🌍 Semua' },
                  { icon: '⏱️', label: 'Timer', value: `${room.settings?.timerSeconds}s` },
                  { icon: '📂', label: 'Kategori', value: room.settings?.category || 'Semua' },
                ].map((item, i) => (
                  <div key={i} className="setting-row">
                    <span className="setting-icon">{item.icon}</span>
                    <span className="setting-label">{item.label}</span>
                    <span className="setting-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Players List */}
          <div className="lobby-right">
            <div className="players-card">
              <div className="players-card-header">
                <div className="settings-card-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
                  👥 Pemain
                </div>
                <div className="players-count-badge">
                  {players.length}/{room.settings?.maxPlayers}
                </div>
              </div>

              <div className="players-list">
                {players.map((p, i) => (
                  <div key={p.uid} className={`player-item ${p.uid === myId ? 'me' : ''}`}
                    style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="player-avatar">
                      {getEmoji(i)}
                    </div>
                    <div className="player-info">
                      <div className="player-name">
                        {p.name}
                        {p.uid === myId && <span className="badge-me">Saya</span>}
                        {p.isHost && <span className="badge-host">Host 👑</span>}
                      </div>
                      <div className="player-score">🏆 {p.score || 0} poin</div>
                    </div>
                    <div className={`player-online ${p.isOnline ? 'online' : 'offline'}`} />
                  </div>
                ))}
              </div>

              {isHost && (
                <div className="host-controls">
                  {error && <div className="alert alert-error">{error}</div>}
                  <button
                    id="btn-start-game"
                    className="host-start-btn"
                    onClick={handleStartGame}
                    disabled={starting || players.length < 2}
                  >
                    {starting ? (
                      <>
                        <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                        Memulai...
                      </>
                    ) : players.length < 2 ? (
                      '⏳ Menunggu pemain lain...'
                    ) : (
                      '🚀 Mulai Game!'
                    )}
                  </button>
                  <p className="host-tip">
                    💡 Game akan mulai saat kamu klik tombol di atas.
                  </p>
                </div>
              )}

              {!isHost && (
                <div className="waiting-message">
                  <div className="waiting-dots">
                    <span /><span /><span />
                  </div>
                  <p>Menunggu host memulai game...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const emojis = ['🧑', '👱', '👩', '🧔', '👩‍🦱', '👨‍🦰', '👩‍🦳', '🧑‍🦱', '👱‍♀️', '🧕', '👨‍🦲', '🧑‍🦳'];
const getEmoji = (i) => emojis[i % emojis.length];
