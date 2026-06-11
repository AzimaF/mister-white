// src/App.jsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import ProfilePage from './pages/ProfilePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/create-room" element={<CreateRoomPage />} />
          <Route path="/join" element={<JoinRoomPage />} />
          <Route path="/room/:code" element={<LobbyPage />} />
          <Route path="/room/:code/play" element={<ErrorBoundary><GamePage /></ErrorBoundary>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
