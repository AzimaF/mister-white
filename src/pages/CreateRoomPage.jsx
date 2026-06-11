// src/pages/CreateRoomPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRoom } from '../firebase/game';
import { categories } from '../data/words';
import './CreateRoomPage.css';

const defaultSettings = {
  maxPlayers: 10,
  mrWhiteCount: 1,
  wordMode: 'normal',
  language: 'id',
  category: '',
  timerSeconds: 60,
};

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) navigate('/auth?mode=login&redirect=create-room');
  }, [user]);

  const handleChange = (key, value) => {
    setSettings((prev) => {
      const nextSettings = { ...prev, [key]: value };
      
      if (key === 'maxPlayers') {
        let maxAllowed = 1;
        if (value >= 6) maxAllowed = 2;
        if (value >= 10) maxAllowed = 3;
        
        if (nextSettings.mrWhiteCount > maxAllowed) {
          nextSettings.mrWhiteCount = maxAllowed;
        }
      }
      
      return nextSettings;
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const code = await createRoom(user, {
        ...settings,
        category: settings.category || null,
      });
      // Simpan info host
      sessionStorage.setItem('guestId', user.uid);
      sessionStorage.setItem('roomCode', code);
      navigate(`/room/${code}`);
    } catch (err) {
      setError(err.message || 'Gagal membuat room!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      <div className="create-deco-1" />

      <div className="create-container">
        {/* Header */}
        <div className="create-header">
          <button className="create-back-btn" onClick={() => navigate('/')}>
            ← Kembali
          </button>
          <div className="create-title">
            🏠 Buat Room Baru
          </div>
          <div className="create-host-pill">
            👤 {user?.displayName || user?.email}
          </div>
        </div>

        <form className="create-form" onSubmit={handleCreate}>
          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          {/* Card: Pengaturan Dasar */}
          <div className="settings-card">
            <div className="settings-card-title">⚙️ Pengaturan Room</div>

            <div className="settings-grid">
              {/* Max Players */}
              <div className="form-group">
                <label className="form-label">Maks. Pemain</label>
                <select
                  className="form-input form-select"
                  value={settings.maxPlayers}
                  onChange={(e) => handleChange('maxPlayers', Number(e.target.value))}
                >
                  {[4,6,8,10,12,15,20].map(n => (
                    <option key={n} value={n}>{n} Pemain</option>
                  ))}
                </select>
              </div>

              {/* Mr. White Count */}
              <div className="form-group">
                <label className="form-label">Jumlah Mr. White</label>
                <select
                  className="form-input form-select"
                  value={settings.mrWhiteCount}
                  onChange={(e) => handleChange('mrWhiteCount', Number(e.target.value))}
                >
                  {[1,2,3].filter(n => {
                    if (settings.maxPlayers < 6) return n <= 1;
                    if (settings.maxPlayers < 10) return n <= 2;
                    return true;
                  }).map(n => (
                    <option key={n} value={n}>{n} Mr. White</option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="form-group">
                <label className="form-label">Bahasa Kata</label>
                <select
                  className="form-input form-select"
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                >
                  <option value="id">🇮🇩 Bahasa Indonesia</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="all">🌍 Semua Bahasa</option>
                </select>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Kategori Kata</label>
                <select
                  className="form-input form-select"
                  value={settings.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="">🎲 Acak (Semua Kategori)</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timer */}
              <div className="form-group">
                <label className="form-label">Timer per Giliran</label>
                <select
                  className="form-input form-select"
                  value={settings.timerSeconds}
                  onChange={(e) => handleChange('timerSeconds', Number(e.target.value))}
                >
                  <option value={30}>30 detik</option>
                  <option value={45}>45 detik</option>
                  <option value={60}>60 detik</option>
                  <option value={90}>90 detik</option>
                  <option value={120}>2 menit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Mode Kata */}
          <div className="settings-card">
            <div className="settings-card-title">🎯 Mode Kata</div>
            <div className="word-mode-options">
              <label
                className={`word-mode-option ${settings.wordMode === 'normal' ? 'selected' : ''}`}
                onClick={() => handleChange('wordMode', 'normal')}
              >
                <input type="radio" name="wordMode" value="normal" checked={settings.wordMode === 'normal'} readOnly />
                <div className="word-mode-icon">🔒</div>
                <div className="word-mode-info">
                  <div className="word-mode-name">Normal (Aman)</div>
                  <div className="word-mode-desc">Hanya Civilian yang mendapat kata. Mr. White bermain tanpa kata!</div>
                </div>
              </label>
              <label
                className={`word-mode-option ${settings.wordMode === 'random' ? 'selected' : ''}`}
                onClick={() => handleChange('wordMode', 'random')}
              >
                <input type="radio" name="wordMode" value="random" checked={settings.wordMode === 'random'} readOnly />
                <div className="word-mode-icon">🎲</div>
                <div className="word-mode-info">
                  <div className="word-mode-name">Diacak (Sulit)</div>
                  <div className="word-mode-desc">Mr. White mendapat kata yang hampir mirip. Game jadi lebih menantang!</div>
                </div>
              </label>
            </div>
          </div>

          <button
            id="btn-create-room-submit"
            type="submit"
            className="create-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                Membuat Room...
              </>
            ) : (
              '🚀 Buat Room Sekarang!'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
