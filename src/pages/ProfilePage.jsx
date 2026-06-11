// src/pages/ProfilePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, updatePassword } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [photoData, setPhotoData] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    setDisplayName(user.displayName || '');
    
    // Fetch photo from DB if exists
    get(ref(db, `users/${user.uid}/photoData`)).then((snap) => {
      if (snap.exists()) {
        setPhotoData(snap.val());
      }
    });
  }, [user, navigate]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 150;
        
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX_SIZE, MAX_SIZE);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoData(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }

      if (photoData) {
        // Save to RTDB for easy access in game
        await set(ref(db, `users/${user.uid}/photoData`), photoData);
        await updateProfile(user, { photoURL: photoData });
      }

      setSuccess('Profil berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      setError('Gagal memperbarui profil.');
    }
    setLoading(false);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(user, password);
      setSuccess('Password berhasil diubah!');
      setPassword('');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Sesi kedaluwarsa. Silakan logout dan login kembali untuk mengubah password.');
      } else {
        setError('Gagal mengubah password.');
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.displayName || user.email)}`;

  return (
    <div className="profile-page">
      <div className="game-deco-1" />
      <div className="game-deco-2" />
      
      <div className="profile-card">
        <button className="profile-back-btn" onClick={() => navigate('/')}>
          ⬅️ Kembali ke Beranda
        </button>

        <div className="profile-header">
          <div className="profile-title">Pengaturan Profil</div>
          <p style={{ color: 'var(--clr-text-muted)' }}>Sesuaikan identitas bermainmu!</p>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success" style={{ background: '#D1FAE5', color: '#065F46', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>{success}</div>}

        <div className="profile-section">
          <div className="profile-avatar-container">
            <img 
              src={photoData || user.photoURL || defaultAvatar} 
              alt="Avatar" 
              className="profile-avatar"
            />
            <button 
              className="profile-avatar-edit-btn"
              onClick={() => fileInputRef.current.click()}
              title="Ganti Foto"
            >
              📷
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="file-input-hidden" 
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Nama Tampilan</label>
              <input
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={20}
              />
            </div>
            <button type="submit" className="btn btn-blue" disabled={loading}>
              {loading ? 'Menyimpan...' : '💾 Simpan Profil'}
            </button>
          </form>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">🔒 Ganti Password</div>
          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <input
                type="password"
                className="form-input"
                placeholder="Password Baru (min. 6 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !password}>
              {loading ? 'Menyimpan...' : '🔑 Ubah Password'}
            </button>
          </form>
        </div>

        <div className="profile-section" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: '24px' }}>
          <button 
            className="btn" 
            onClick={handleLogout}
            style={{ width: '100%', background: '#FEE2E2', color: '#DC2626', fontWeight: 'bold' }}
          >
            🚪 Keluar dari Akun
          </button>
        </div>
      </div>
    </div>
  );
}
