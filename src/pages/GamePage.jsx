// src/pages/GamePage.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  listenToRoom,
  submitClue,
  nextTurn,
  submitVote,
  processVotes,
  nextRound,
  setPlayerOnline,
} from '../firebase/game';
import './GamePage.css';

export default function GamePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clue, setClue] = useState('');
  const [myVote, setMyVote] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const timerRef = useRef(null);

  const guestId = sessionStorage.getItem('guestId');
  const myId = user?.uid || guestId;

  useEffect(() => {
    const unsubscribe = listenToRoom(code, (data) => {
      if (!data) { navigate('/'); return; }
      setRoom(data);
      setLoading(false);

      // Reset submitted when round changes
      setSubmitted(false);
      setClue('');
      setMyVote(null);
      setShowWord(false);

      if (data.status === 'lobby') navigate(`/room/${code}`);
    });

    if (myId) setPlayerOnline(code, myId, true);

    return () => {
      unsubscribe();
      if (myId) setPlayerOnline(code, myId, false);
    };
  }, [code]);

  // Timer logic
  useEffect(() => {
    if (!room || room.status !== 'playing') {
      clearInterval(timerRef.current);
      return;
    }
    const seconds = room.settings?.timerSeconds || 60;
    const elapsed = Math.floor((Date.now() - (room.timerStart || Date.now())) / 1000);
    const remaining = Math.max(0, seconds - elapsed);
    setTimeLeft(remaining);

    clearInterval(timerRef.current);
    if (!timerPaused && remaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [room?.timerStart, room?.status, timerPaused]);

  // Voice to text logic
  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung fitur mikrofon Voice-to-Text. Silakan gunakan Google Chrome.");
      return;
    }

    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = room?.settings?.language === 'en' ? 'en-US' : 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setClue((prev) => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [isListening, room?.settings?.language]);

  if (loading || !room) {
    return (
      <div className="page-centered">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--clr-text-muted)' }}>Memuat game...</p>
        </div>
      </div>
    );
  }

  const players = Object.values(room.players || {});
  const myAssignment = room.assignments?.[myId];
  const myRole = myAssignment?.role;
  const myWord = myAssignment?.word;
  const isHost = room.hostId === myId;
  const turnOrder = room.turnOrder || [];
  const currentTurnId = turnOrder[room.currentTurnIndex || 0];
  const isMyTurn = currentTurnId === myId;
  const clues = room.clues || {};
  const votes = room.votes || {};

  // ---- RENDER: Word Reveal Screen ----
  if (room.status === 'playing' && !showWord) {
    return (
      <div className="game-page">
        <div className="game-deco-1" />
        <div className="word-reveal-screen">
          <div className="word-reveal-card">
            <div className="word-reveal-round">Ronde {room.round}</div>
            <div className="word-reveal-title">Peranmu adalah...</div>
            <div className={`role-badge-big ${myRole}`}>
              {myRole === 'civilian' ? '👤 Civilian' : '🕵️ Mr. White'}
            </div>
            {myRole === 'civilian' && (
              <div className="word-reveal-word-section">
                <div className="word-reveal-label">Katamu:</div>
                <div className="word-reveal-word">{myWord}</div>
              </div>
            )}
            {myRole === 'mrwhite' && myWord && (
              <div className="word-reveal-word-section">
                <div className="word-reveal-label">Katamu (Mungkin berbeda!):</div>
                <div className="word-reveal-word mrwhite-word">{myWord}</div>
              </div>
            )}
            {myRole === 'mrwhite' && !myWord && (
              <div className="word-reveal-word-section">
                <div className="word-reveal-label" style={{ color: 'var(--clr-mrwhite-light)' }}>
                  Kamu tidak mendapat kata! Tebak dari petunjuk orang lain.
                </div>
              </div>
            )}
            <p className="word-reveal-hint">
              ⚠️ Jangan perlihatkan layarmu ke orang lain!
            </p>
            <button
              id="btn-ready"
              className="word-reveal-ready-btn"
              onClick={() => setShowWord(true)}
            >
              ✅ Saya Sudah Menghafal!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- RENDER: Voting ----
  if (room.status === 'voting') {
    const hasVoted = !!votes[myId];
    const totalVoters = players.length;
    const votesCast = Object.keys(votes).length;

    return (
      <div className="game-page">
        <div className="game-deco-1" />
        <div className="voting-screen">
          <div className="voting-header">
            <div className="voting-title">🗳️ Waktu Voting!</div>
            <div className="voting-subtitle">Siapa yang menurutmu Mr. White?</div>
            <div className="vote-counter">{votesCast}/{totalVoters} telah memilih</div>
          </div>

          <div className="clues-recap">
            <div className="clues-recap-title">📝 Rekap Petunjuk</div>
            <div className="clues-list">
              {players.map((p) => (
                clues[p.uid] && (
                  <div key={p.uid} className="clue-recap-item">
                    <span className="clue-player-name">{p.name}:</span>
                    <span className="clue-text">"{clues[p.uid].clue}"</span>
                  </div>
                )
              ))}
            </div>
          </div>

          {!hasVoted ? (
            <div className="vote-options">
              <div className="vote-options-title">Pilih siapa Mr. White:</div>
              <div className="vote-grid">
                {players.filter(p => p.uid !== myId).map((p) => (
                  <button
                    key={p.uid}
                    id={`vote-${p.uid}`}
                    className={`vote-player-btn ${myVote === p.uid ? 'selected' : ''}`}
                    onClick={() => setMyVote(p.uid)}
                  >
                    <div className="vote-player-emoji">🎭</div>
                    <div className="vote-player-name">{p.name}</div>
                    {myVote === p.uid && <div className="vote-check">✓</div>}
                  </button>
                ))}
              </div>
              <button
                id="btn-submit-vote"
                className="vote-submit-btn"
                disabled={!myVote}
                onClick={async () => {
                  await submitVote(code, myId, myVote);
                }}
              >
                🗳️ Kirim Vote!
              </button>
            </div>
          ) : (
            <div className="vote-submitted">
              <div className="vote-submitted-icon">✅</div>
              <div className="vote-submitted-text">Vote kamu sudah terkirim!</div>
              <div className="vote-submitted-sub">Menunggu pemain lain...</div>
              <div className="waiting-dots" style={{ justifyContent: 'center', marginTop: 12 }}>
                <span /><span /><span />
              </div>
            </div>
          )}

          {isHost && votesCast === totalVoters && (
            <div className="host-process-votes">
              <button
                id="btn-process-votes"
                className="host-process-btn"
                onClick={() => processVotes(code, user.uid)}
              >
                🔍 Singkap Hasilnya!
              </button>
            </div>
          )}

          {isHost && votesCast < totalVoters && (
            <div className="host-process-votes">
              <button
                id="btn-force-process-votes"
                className="btn btn-outline-white btn-sm"
                onClick={() => processVotes(code, user.uid)}
              >
                ⏩ Paksa Proses ({votesCast}/{totalVoters} vote)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- RENDER: Results ----
  if (room.status === 'results' || room.status === 'finished') {
    const kickedPlayer = room.players?.[room.kickedPlayerId];
    const isWin = room.roundResult === 'civilian_win';
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const winner = room.winner ? room.players?.[room.winner] : null;

    return (
      <div className="game-page">
        <div className="game-deco-1" />
        <div className="results-screen">
          {/* Result Banner */}
          <div className={`result-banner ${isWin ? 'civilian-win' : 'mrwhite-win'}`}>
            <div className="result-emoji">{isWin ? '🎉' : '🕵️'}</div>
            <div className="result-title">
              {isWin ? 'Civilian Menang!' : 'Mr. White Lolos!'}
            </div>
            <div className="result-subtitle">
              {kickedPlayer ? `${kickedPlayer.name} (${room.kickedRole === 'mrwhite' ? 'Mr. White' : 'Civilian'}) dikeluarkan!` : ''}
            </div>
          </div>

          {/* Word Reveal */}
          <div className="words-reveal-card">
            <div className="words-reveal-title">🔐 Kata Rahasia</div>
            <div className="words-reveal-grid">
              <div className="word-reveal-item civilian">
                <div className="word-item-label">👤 Kata Civilian</div>
                <div className="word-item-word">{room.civilianWord}</div>
              </div>
              <div className="word-reveal-item mrwhite">
                <div className="word-item-label">🕵️ Kata Mr. White</div>
                <div className="word-item-word">{room.mrWhiteWord || '(Tidak ada kata)'}</div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="leaderboard-card">
            <div className="leaderboard-title">🏆 Skor Sementara</div>
            <div className="leaderboard-list">
              {sortedPlayers.map((p, i) => (
                <div key={p.uid} className={`leaderboard-item ${p.uid === myId ? 'me' : ''}`}>
                  <div className="leaderboard-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</div>
                  <div className="leaderboard-player-name">{p.name}</div>
                  <div className="leaderboard-score">{p.score || 0} poin</div>
                </div>
              ))}
            </div>
          </div>

          {/* Finished or Next Round */}
          {room.status === 'finished' && winner && (
            <div className="champion-card">
              <div className="champion-emoji">🏆</div>
              <div className="champion-title">Pemenang: {winner.name}!</div>
              <div className="champion-score">{winner.score} poin</div>
              <button className="next-round-btn" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
                🏠 Kembali ke Beranda
              </button>
            </div>
          )}

          {room.status === 'results' && isHost && (
            <button
              id="btn-next-round"
              className="next-round-btn"
              onClick={() => nextRound(code, user.uid)}
            >
              🔄 Ronde Berikutnya!
            </button>
          )}

          {room.status === 'results' && !isHost && (
            <div className="waiting-message" style={{ marginTop: 16 }}>
              <div className="waiting-dots"><span /><span /><span /></div>
              <p>Menunggu host memulai ronde berikutnya...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- RENDER: Playing ----
  const timerPercent = timeLeft !== null && room.settings?.timerSeconds
    ? (timeLeft / room.settings.timerSeconds) * 100
    : 100;

  return (
    <div className="game-page">
      <div className="game-deco-1" />

      <div className="game-container">
        {/* Header */}
        <div className="game-header">
          <div className="game-round-badge">Ronde {room.round}</div>
          <div className="game-title">🎮 Mister White</div>
          <div className={`my-role-badge ${myRole}`}>
            {myRole === 'civilian' ? '👤 Civilian' : '🕵️ Mr. White'}
          </div>
        </div>

        <div className="game-grid">
          {/* Left: My Word + Turn */}
          <div className="game-left">
            {/* My Word Card */}
            <div className={`my-word-card ${myRole}`}>
              <div className="my-word-label">Katamu</div>
              <div className="my-word-text">
                {myWord || (myRole === 'mrwhite' ? '❓ Tebak dari petunjuk!' : '—')}
              </div>
              <div className={`my-word-role ${myRole}`}>
                {myRole === 'civilian' ? '✅ Kamu adalah Civilian' : '🕵️ Kamu adalah Mr. White'}
              </div>
            </div>

            {/* Timer */}
            {isMyTurn && (
              <div className="timer-card">
                <div className="timer-ring-wrapper">
                  <svg className="timer-ring" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="timer-ring-bg" />
                    <circle
                      cx="50" cy="50" r="45"
                      className={`timer-ring-progress ${timeLeft <= 10 ? 'danger' : ''}`}
                      style={{
                        strokeDashoffset: `${283 * (1 - timerPercent / 100)}`,
                      }}
                    />
                  </svg>
                  <div className="timer-number">{timeLeft ?? '--'}</div>
                </div>
                <div className="timer-label">detik tersisa</div>
                {isHost && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setTimerPaused(p => !p)}
                  >
                    {timerPaused ? '▶️ Lanjut' : '⏸️ Pause'}
                  </button>
                )}
              </div>
            )}

            {/* Clue Input */}
            {isMyTurn && !submitted && (
              <div className="clue-input-card">
                <div className="clue-input-title">🎯 Giliran kamu! Berikan petunjuk:</div>
                <div style={{ position: 'relative' }}>
                  <textarea
                    id="clue-input"
                    className="form-input clue-textarea"
                    placeholder="Tulis petunjuk... atau tekan mic 🎤 untuk bicara!"
                    value={clue}
                    onChange={(e) => setClue(e.target.value)}
                    rows={3}
                    maxLength={100}
                    style={{ paddingRight: '50px' }}
                  />
                  <button
                    type="button"
                    className={`mic-btn ${isListening ? 'listening' : ''}`}
                    onClick={handleVoiceInput}
                    title="Gunakan suara"
                  >
                    🎤
                  </button>
                </div>
                <div className="clue-char-count">{clue.length}/100</div>
                <button
                  id="btn-submit-clue"
                  className="clue-submit-btn"
                  disabled={!clue.trim()}
                  onClick={async () => {
                    await submitClue(code, myId, clue.trim());
                    setSubmitted(true);
                  }}
                >
                  ✅ Kirim Petunjuk
                </button>
              </div>
            )}

            {isMyTurn && submitted && (
              <div className="clue-submitted-notice">
                ✅ Petunjuk terkirim! Menunggu host lanjut...
              </div>
            )}

            {!isMyTurn && (
              <div className="waiting-turn">
                <div className="waiting-turn-text">
                  Menunggu giliran <strong>{room.players?.[currentTurnId]?.name || '...'}</strong>
                </div>
              </div>
            )}

            {/* Host next turn button */}
            {isHost && (
              <button
                id="btn-next-turn"
                className="host-next-btn"
                onClick={() => nextTurn(code, user.uid)}
              >
                ⏩ Lanjut Giliran Berikutnya
              </button>
            )}
          </div>

          {/* Right: Players + Clues */}
          <div className="game-right">
            {/* Turn Order */}
            <div className="turn-order-card">
              <div className="turn-order-title">🔄 Urutan Giliran</div>
              <div className="turn-order-list">
                {turnOrder.map((pid, i) => {
                  const p = room.players?.[pid];
                  const isCurrent = i === (room.currentTurnIndex || 0);
                  const isDone = i < (room.currentTurnIndex || 0);
                  const hasClue = !!clues[pid];
                  return (
                    <div key={pid} className={`turn-item ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}>
                      <div className="turn-number">{i + 1}</div>
                      <div className="turn-player-name">
                        {p?.name}
                        {pid === myId && <span style={{ opacity: 0.6, fontSize: '0.75rem' }}> (Saya)</span>}
                      </div>
                      <div className="turn-status">
                        {hasClue ? '✅' : isCurrent ? '🎤' : '⏳'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clues Given */}
            {Object.keys(clues).length > 0 && (
              <div className="clues-board">
                <div className="clues-board-title">💬 Petunjuk yang Diberikan</div>
                <div className="clues-board-list">
                  {Object.entries(clues).map(([pid, data]) => {
                    const p = room.players?.[pid];
                    return (
                      <div key={pid} className="clue-item">
                        <div className="clue-item-player">{p?.name || pid}</div>
                        <div className="clue-item-text">"{data.clue}"</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
