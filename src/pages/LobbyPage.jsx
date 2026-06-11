// src/pages/LobbyPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listenToRoom, startGame, deleteRoom, setPlayerOnline, setPlayerReady, leaveRoom, updatePlayerAvatar } from '../firebase/game';
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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

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
      await startGame(code, myId);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  };

  const handleToggleReady = async () => {
    if (isHost) return; // Host tak perlu klik siap
    const myPlayer = room?.players?.[myId];
    if (myPlayer) {
      await setPlayerReady(code, myId, !myPlayer.isReady);
    }
  };

  const handleLeave = async () => {
    if (isHost) {
      if (window.confirm('Kamu adalah host. Hapus room ini?')) {
        await deleteRoom(code);
        navigate('/');
      }
    } else {
      if (window.confirm('Yakin ingin keluar dari room?')) {
        await leaveRoom(code, myId);
        navigate('/');
      }
    }
  };

  const PRESET_AVATARS = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Lucky',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Bella',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    'https://api.dicebear.com/7.x/micah/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Zoe',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    'https://api.dicebear.com/7.x/micah/svg?seed=Mia'
  ];

  const handleSelectAvatar = async (url) => {
    await updatePlayerAvatar(code, myId, url);
    setShowAvatarPicker(false);
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
                    <div className="player-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                      {p.avatar ? (
                        <img src={p.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getEmoji(i)
                      )}
                    </div>
                    <div className="player-info">
                      <div className="player-name">
                        {p.name}
                        {p.uid === myId && <span className="badge-me">Saya</span>}
                        {p.isHost && <span className="badge-host">Host 👑</span>}
                      </div>
                      <div className="player-score">🏆 {p.score || 0} poin</div>
                    </div>
                    <div className="player-status-wrap">
                      {!p.isHost && (
                        <div className={`ready-badge ${p.isReady ? 'ready' : 'not-ready'}`}>
                          {p.isReady ? '✅ Siap' : '⏳ Wait'}
                        </div>
                      )}
                      <div className={`player-online ${p.isOnline ? 'online' : 'offline'}`} />
                    </div>
                  </div>
                ))}
              </div>

              {isHost && (() => {
                const allReady = players.every(p => p.isHost || p.isReady);
                const readyCount = players.filter(p => !p.isHost && p.isReady).length;
                const guestCount = players.length - 1;
                return (
                  <div className="host-controls">
                    {error && <div className="alert alert-error">{error}</div>}
                    <button
                      id="btn-start-game"
                      className="host-start-btn"
                      onClick={handleStartGame}
                      disabled={starting || players.length < 2 || !allReady}
                    >
                      {starting ? (
                        <>
                          <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                          Memulai...
                        </>
                      ) : players.length < 2 ? (
                        '⏳ Menunggu pemain lain...'
                      ) : !allReady ? (
                        `⏳ Menunggu Pemain Siap (${readyCount}/${guestCount})`
                      ) : (
                        '🚀 Mulai Game!'
                      )}
                    </button>
                    <p className="host-tip">
                      💡 Game hanya bisa dimulai jika semua pemain sudah mengeklik "Siap".
                    </p>
                  </div>
                );
              })()}

              {!isHost && (() => {
                const myPlayer = room?.players?.[myId];
                const isReady = myPlayer?.isReady;
                return (
                  <div className="guest-controls" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        className={`btn-ready-toggle ${isReady ? 'is-ready' : ''}`}
                        style={{ flex: 1 }}
                        onClick={handleToggleReady}
                      >
                        {isReady ? '❌ Batal Siap' : '✅ Saya Siap!'}
                      </button>
                      
                      {!user && (
                        <button 
                          className="btn btn-outline-white"
                          style={{ color: 'var(--clr-text-secondary)', borderColor: 'var(--clr-border)', background: 'white', flex: 1, fontWeight: 'bold' }}
                          onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                        >
                          {showAvatarPicker ? 'Tutup Pilihan' : '🖼️ Pilih Avatar'}
                        </button>
                      )}
                    </div>

                    {showAvatarPicker && !user && (
                      <div className="avatar-picker-grid" style={{ 
                        position: 'absolute', bottom: '100%', right: '0', 
                        background: 'var(--clr-card)', padding: '16px', borderRadius: 'var(--radius-lg)', 
                        boxShadow: 'var(--shadow-card)', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px', width: '280px'
                      }}>
                        {PRESET_AVATARS.map((url, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleSelectAvatar(url)}
                            style={{
                              width: '48px', height: '48px', borderRadius: '50%', background: 'var(--clr-surface)', cursor: 'pointer',
                              border: myPlayer?.avatar === url ? '3px solid var(--clr-primary)' : '2px solid transparent',
                              padding: '2px', transition: 'all 0.2s'
                            }}
                          >
                            <img src={url} alt={`preset-${idx}`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="waiting-message" style={{ marginTop: '12px' }}>
                      <div className="waiting-dots">
                        <span /><span /><span />
                      </div>
                      <p>Menunggu host memulai game...</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const emojis = ['🧑', '👱', '👩', '🧔', '👩‍🦱', '👨‍🦰', '👩‍🦳', '🧑‍🦱', '👱‍♀️', '🧕', '👨‍🦲', '🧑‍🦳'];
const getEmoji = (i) => emojis[i % emojis.length];
