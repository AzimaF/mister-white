// src/firebase/game.js
import {
  ref,
  set,
  get,
  update,
  onValue,
  push,
  serverTimestamp,
  remove,
  off,
} from 'firebase/database';
import { db } from './config';
import { getRandomWord } from '../data/words';

// Generate kode room 6 karakter
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Assign kata ke semua pemain
const assignWords = (players, wordMode, mrWhiteCount, language, category) => {
  const playerIds = Object.keys(players);
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const mrWhiteIds = shuffled.slice(0, mrWhiteCount);

  const wordPair = getRandomWord(language, category);
  const assignments = {};

  playerIds.forEach((pid) => {
    const isMrWhite = mrWhiteIds.includes(pid);
    if (isMrWhite) {
      assignments[pid] = {
        role: 'mrwhite',
        word: wordMode === 'random' ? wordPair.mrwhite : '',
      };
    } else {
      assignments[pid] = {
        role: 'civilian',
        word: wordPair.civilian,
      };
    }
  });

  return { assignments, civilianWord: wordPair.civilian, mrWhiteWord: wordPair.mrwhite };
};

// Buat room baru
export const createRoom = async (hostUser, settings) => {
  let code = generateRoomCode();
  // Pastikan kode unik
  let existing = await get(ref(db, `rooms/${code}`));
  while (existing.exists()) {
    code = generateRoomCode();
    existing = await get(ref(db, `rooms/${code}`));
  }

  let avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(hostUser.displayName || hostUser.email || 'Host')}`;
  try {
    const photoSnap = await get(ref(db, `users/${hostUser.uid}/photoData`));
    if (photoSnap.exists()) avatarUrl = photoSnap.val();
  } catch (e) {}

  const roomData = {
    code,
    hostId: hostUser.uid,
    hostName: hostUser.displayName || hostUser.email,
    status: 'lobby', // lobby | playing | voting | results | finished
    settings: {
      maxPlayers: settings.maxPlayers || 10,
      mrWhiteCount: settings.mrWhiteCount || 1,
      wordMode: settings.wordMode || 'normal', // normal | random
      language: settings.language || 'id', // id | en | all
      category: settings.category || null,
      timerSeconds: settings.timerSeconds || 60,
    },
    players: {
      [hostUser.uid]: {
        uid: hostUser.uid,
        name: hostUser.displayName || 'Host',
        isHost: true,
        score: 0,
        joinedAt: Date.now(),
        isOnline: true,
        avatar: avatarUrl,
      },
    },
    round: 0,
    createdAt: Date.now(),
  };

  await set(ref(db, `rooms/${code}`), roomData);
  return code;
};

// Gabung room sebagai guest / auth user
export const joinRoom = async (roomCode, playerName, authUid = null, customAvatarUrl = null) => {
  const code = roomCode.toUpperCase();
  const roomRef = ref(db, `rooms/${code}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) throw new Error('Room tidak ditemukan!');
  const room = snapshot.val();
  if (room.status !== 'lobby') throw new Error('Game sudah dimulai!');

  const playerCount = Object.keys(room.players || {}).length;
  if (playerCount >= room.settings.maxPlayers) throw new Error('Room penuh!');

  const playerId = authUid || 'guest_' + Math.random().toString(36).substr(2, 9);

  let avatarUrl = '';
  try {
    if (authUid) {
      const photoSnap = await get(ref(db, `users/${authUid}/photoData`));
      if (photoSnap.exists()) {
        avatarUrl = photoSnap.val();
      }
    }
  } catch (err) {}

  if (customAvatarUrl) {
    avatarUrl = customAvatarUrl;
  } else if (!avatarUrl) {
    avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(playerName)}`;
  }

  await update(ref(db, `rooms/${code}/players/${playerId}`), {
    uid: playerId,
    name: playerName,
    isHost: false,
    score: 0,
    joinedAt: Date.now(),
    isOnline: true,
    avatar: avatarUrl,
  });

  return { code, guestId: playerId };
};

// Keluar dari room
export const leaveRoom = async (roomCode, playerId) => {
  await remove(ref(db, `rooms/${roomCode}/players/${playerId}`));
};

// Update avatar pemain
export const updatePlayerAvatar = async (roomCode, playerId, avatarUrl) => {
  await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { avatar: avatarUrl });
};

// Mulai game
export const startGame = async (roomCode, hostId) => {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) throw new Error('Room tidak ditemukan!');

  const room = snapshot.val();
  if (room.hostId !== hostId) throw new Error('Hanya host yang bisa memulai!');

  const { settings, players } = room;

  const { assignments, civilianWord, mrWhiteWord } = assignWords(
    players,
    settings.wordMode,
    settings.mrWhiteCount,
    settings.language,
    settings.category
  );

  // Tentukan urutan giliran (acak)
  const turnOrder = Object.keys(players).sort(() => Math.random() - 0.5);

  const updates = {};
  Object.keys(players).forEach(pid => {
    updates[`rooms/${roomCode}/players/${pid}/isEliminated`] = false;
  });

  await update(ref(db, '/'), {
    ...updates,
    [`rooms/${roomCode}/status`]: 'playing',
    [`rooms/${roomCode}/round`]: 1,
    [`rooms/${roomCode}/currentTurnIndex`]: 0,
    [`rooms/${roomCode}/turnOrder`]: turnOrder,
    [`rooms/${roomCode}/assignments`]: assignments,
    [`rooms/${roomCode}/civilianWord`]: civilianWord,
    [`rooms/${roomCode}/mrWhiteWord`]: mrWhiteWord,
    [`rooms/${roomCode}/clues`]: {},
    [`rooms/${roomCode}/votes`]: {},
    [`rooms/${roomCode}/timerStart`]: Date.now(),
  });
};

// Submit clue dari pemain
export const submitClue = async (roomCode, playerId, clue) => {
  const roomRef = ref(db, `rooms/${roomCode}/clues/${playerId}`);
  const snap = await get(roomRef);
  const existing = snap.val();
  const newClueText = existing ? `${existing.clue} • ${clue}` : clue;

  await set(roomRef, {
    clue: newClueText,
    submittedAt: Date.now(),
  });
};

// Advance ke giliran berikutnya atau mulai diskusi
export const nextTurn = async (roomCode) => {
  const snapshot = await get(ref(db, `rooms/${roomCode}`));
  const room = snapshot.val();

  const nextIndex = (room.currentTurnIndex || 0) + 1;
  if (nextIndex >= room.turnOrder.length) {
    // Semua sudah clue, masuk sesi diskusi
    await update(ref(db, `rooms/${roomCode}`), {
      status: 'discuss',
      currentTurnIndex: nextIndex,
      timerStart: Date.now(),
    });
  } else {
    await update(ref(db, `rooms/${roomCode}`), {
      currentTurnIndex: nextIndex,
      timerStart: Date.now(),
    });
  }
};

// Mulai putaran petunjuk tambahan
export const startExtraClueRound = async (roomCode) => {
  const snapshot = await get(ref(db, `rooms/${roomCode}`));
  const room = snapshot.val();

  await update(ref(db, `rooms/${roomCode}`), {
    status: 'playing',
    currentTurnIndex: 0,
    clueRound: (room.clueRound || 1) + 1,
    timerStart: Date.now(),
    discussVotes: null,
  });
};

// Lanjut ke fase voting dari diskusi
export const startVoting = async (roomCode) => {
  const snapshot = await get(ref(db, `rooms/${roomCode}`));
  const room = snapshot.val();

  await update(ref(db, `rooms/${roomCode}`), {
    status: 'voting',
    timerStart: Date.now(),
    discussVotes: null,
  });
};

// Submit vote diskusi (tambah petunjuk vs mulai voting)
export const submitDiscussVote = async (roomCode, playerId, choice) => {
  await set(ref(db, `rooms/${roomCode}/discussVotes/${playerId}`), choice);
};

// Proses hasil vote diskusi
export const processDiscussVotes = async (roomCode) => {
  const snapshot = await get(ref(db, `rooms/${roomCode}`));
  const room = snapshot.val();
  if (!room || room.status !== 'discuss') return;

  const votes = room.discussVotes || {};
  let clueVotes = 0;
  let voteVotes = 0;

  Object.values(votes).forEach(choice => {
    if (choice === 'clue') clueVotes++;
    if (choice === 'vote') voteVotes++;
  });

  if (clueVotes >= voteVotes) {
    await startExtraClueRound(roomCode);
  } else {
    await startVoting(roomCode);
  }
};

// Submit vote
export const submitVote = async (roomCode, voterId, targetId) => {
  await set(ref(db, `rooms/${roomCode}/votes/${voterId}`), targetId);
};

// Proses hasil voting & kick pemain
export const processVotes = async (roomCode, hostId) => {
  const snapshot = await get(ref(db, `rooms/${roomCode}`));
  const room = snapshot.val();
  if (room.hostId !== hostId) throw new Error('Hanya host yang bisa proses!');

  const votes = room.votes || {};
  const voteCounts = {};
  Object.values(votes).forEach((targetId) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const kickedId = Object.keys(voteCounts).sort((a, b) => voteCounts[b] - voteCounts[a])[0];
  const kickedPlayer = room.players[kickedId];
  const assignments = room.assignments || {};
  const kickedRole = assignments[kickedId]?.role;

  if (kickedRole === 'mrwhite') {
    await update(ref(db, '/'), {
      [`rooms/${roomCode}/status`]: 'mrwhite_guessing',
      [`rooms/${roomCode}/kickedPlayerId`]: kickedId,
      [`rooms/${roomCode}/kickedRole`]: kickedRole,
      [`rooms/${roomCode}/timerStart`]: Date.now(),
    });
    return;
  }

  // Jika Civilian yang kena kick:
  const scoreUpdates = {};
  // Civilian gagal (kick civilian): +30 poin Mr. White, -5 civilian
  Object.keys(room.players).forEach((pid) => {
    if (assignments[pid]?.role === 'mrwhite') {
      scoreUpdates[`rooms/${roomCode}/players/${pid}/score`] =
        (room.players[pid].score || 0) + 30;
    } else {
      scoreUpdates[`rooms/${roomCode}/players/${pid}/score`] =
        Math.max(0, (room.players[pid].score || 0) - 5);
    }
  });

  // Cek apakah ada yang mencapai 100 poin
  const updatedScores = {};
  Object.keys(room.players).forEach((pid) => {
    updatedScores[pid] = scoreUpdates[`rooms/${roomCode}/players/${pid}/score`] || room.players[pid].score || 0;
  });
  const maxScore = Math.max(...Object.values(updatedScores));
  const hasWinner = maxScore >= 100;

  await update(ref(db, '/'), {
    ...scoreUpdates,
    [`rooms/${roomCode}/status`]: hasWinner ? 'finished' : 'results',
    [`rooms/${roomCode}/kickedPlayerId`]: kickedId,
    [`rooms/${roomCode}/kickedRole`]: kickedRole,
    [`rooms/${roomCode}/roundResult`]: 'mrwhite_win',
    [`rooms/${roomCode}/winner`]: hasWinner
      ? Object.keys(updatedScores).sort((a, b) => updatedScores[b] - updatedScores[a])[0]
      : null,
  });
};

// Submit tebakan Mr. White
export const submitMrWhiteGuess = async (roomCode, guess) => {
  const snapshot = await get(ref(db, `rooms/${roomCode}`));
  const room = snapshot.val();
  
  const isCorrect = guess.trim().toLowerCase() === room.civilianWord.trim().toLowerCase();
  
  const kickedId = room.kickedPlayerId;
  const playersArr = Object.values(room.players);
  
  if (isCorrect) {
    // Mr. White menang karena menebak benar: +30 poin Mr. White, -5 civilian
    const scoreUpdates = {};
    Object.keys(room.players).forEach((pid) => {
      if (room.assignments[pid]?.role === 'mrwhite') {
        scoreUpdates[`rooms/${roomCode}/players/${pid}/score`] = (room.players[pid].score || 0) + 30;
      } else {
        scoreUpdates[`rooms/${roomCode}/players/${pid}/score`] = Math.max(0, (room.players[pid].score || 0) - 5);
      }
    });

    const updatedScores = {};
    Object.keys(room.players).forEach((pid) => {
      updatedScores[pid] = scoreUpdates[`rooms/${roomCode}/players/${pid}/score`] || room.players[pid].score || 0;
    });
    const maxScore = Math.max(...Object.values(updatedScores));
    const hasWinner = maxScore >= 100;

    await update(ref(db, '/'), {
      ...scoreUpdates,
      [`rooms/${roomCode}/status`]: hasWinner ? 'finished' : 'results',
      [`rooms/${roomCode}/roundResult`]: 'mrwhite_win',
      [`rooms/${roomCode}/mrWhiteGuess`]: guess,
      [`rooms/${roomCode}/mrWhiteGuessCorrect`]: true,
      [`rooms/${roomCode}/winner`]: hasWinner ? Object.keys(updatedScores).sort((a, b) => updatedScores[b] - updatedScores[a])[0] : null,
    });
  } else {
    // Tebakan salah. Mr. White mati.
    const aliveMrWhites = playersArr.filter(p => p.uid !== kickedId && !p.isEliminated && room.assignments[p.uid]?.role === 'mrwhite');
    
    if (aliveMrWhites.length === 0) {
      // Tidak ada Mr. White tersisa. Civilian menang.
      const scoreUpdates = {};
      Object.keys(room.players).forEach((pid) => {
        if (room.assignments[pid]?.role === 'civilian') {
          scoreUpdates[`rooms/${roomCode}/players/${pid}/score`] = (room.players[pid].score || 0) + 20;
        } else {
          scoreUpdates[`rooms/${roomCode}/players/${pid}/score`] = Math.max(0, (room.players[pid].score || 0) - 10);
        }
      });

      const updatedScores = {};
      Object.keys(room.players).forEach((pid) => {
        updatedScores[pid] = scoreUpdates[`rooms/${roomCode}/players/${pid}/score`] || room.players[pid].score || 0;
      });
      const maxScore = Math.max(...Object.values(updatedScores));
      const hasWinner = maxScore >= 100;

      await update(ref(db, '/'), {
        ...scoreUpdates,
        [`rooms/${roomCode}/players/${kickedId}/isEliminated`]: true,
        [`rooms/${roomCode}/status`]: hasWinner ? 'finished' : 'results',
        [`rooms/${roomCode}/roundResult`]: 'civilian_win',
        [`rooms/${roomCode}/mrWhiteGuess`]: guess,
        [`rooms/${roomCode}/mrWhiteGuessCorrect`]: false,
        [`rooms/${roomCode}/winner`]: hasWinner ? Object.keys(updatedScores).sort((a, b) => updatedScores[b] - updatedScores[a])[0] : null,
      });
    } else {
      // Masih ada Mr. White! Lanjut ke sub-ronde berikutnya (eliminasi bertahap)
      const alivePlayers = playersArr.filter(p => p.uid !== kickedId && !p.isEliminated).map(p => p.uid);
      const turnOrder = alivePlayers.sort(() => Math.random() - 0.5);
      
      await update(ref(db, '/'), {
        [`rooms/${roomCode}/players/${kickedId}/isEliminated`]: true,
        [`rooms/${roomCode}/status`]: 'playing',
        [`rooms/${roomCode}/currentTurnIndex`]: 0,
        [`rooms/${roomCode}/turnOrder`]: turnOrder,
        [`rooms/${roomCode}/clues`]: {},
        [`rooms/${roomCode}/votes`]: {},
        [`rooms/${roomCode}/discussVotes`]: null,
        [`rooms/${roomCode}/kickedPlayerId`]: null,
        [`rooms/${roomCode}/kickedRole`]: null,
        [`rooms/${roomCode}/mrWhiteGuess`]: null,
        [`rooms/${roomCode}/mrWhiteGuessCorrect`]: null,
        [`rooms/${roomCode}/clueRound`]: (room.clueRound || 1) + 1,
        [`rooms/${roomCode}/timerStart`]: Date.now(),
      });
    }
  }
};

// Akhiri game paksa oleh host
export const forceEndGame = async (roomCode, hostId) => {
  const snapshot = await get(ref(db, `rooms/${roomCode}`));
  const room = snapshot.val();
  if (room.hostId !== hostId) throw new Error('Hanya host yang bisa mengakhiri game!');

  const updatedScores = {};
  Object.keys(room.players).forEach((pid) => {
    updatedScores[pid] = room.players[pid].score || 0;
  });

  const maxScore = Math.max(...Object.values(updatedScores));
  let winnerId = null;
  
  if (Object.keys(updatedScores).length > 0 && maxScore > 0) {
    winnerId = Object.keys(updatedScores).sort((a, b) => updatedScores[b] - updatedScores[a])[0];
  } else if (Object.keys(updatedScores).length > 0) {
    // Jika semua skor 0, pemenangnya acak atau host
    winnerId = hostId;
  }

  await update(ref(db, `rooms/${roomCode}`), {
    status: 'finished',
    winner: winnerId,
    kickedPlayerId: null,
    kickedRole: null,
    roundResult: null,
  });
};

// Lanjut ke ronde berikutnya
export const nextRound = async (roomCode, hostId) => {
  const snapshot = await get(ref(db, `rooms/${roomCode}`));
  const room = snapshot.val();
  if (room.hostId !== hostId) throw new Error('Hanya host yang bisa lanjut!');

  const { settings, players } = room;
  const { assignments, civilianWord, mrWhiteWord } = assignWords(
    players,
    settings.wordMode,
    settings.mrWhiteCount,
    settings.language,
    settings.category
  );

  const turnOrder = Object.keys(players).sort(() => Math.random() - 0.5);

  const updates = {};
  Object.keys(players).forEach(pid => {
    updates[`rooms/${roomCode}/players/${pid}/isEliminated`] = false;
  });

  await update(ref(db, '/'), {
    ...updates,
    [`rooms/${roomCode}/status`]: 'playing',
    [`rooms/${roomCode}/round`]: (room.round || 0) + 1,
    [`rooms/${roomCode}/currentTurnIndex`]: 0,
    [`rooms/${roomCode}/turnOrder`]: turnOrder,
    [`rooms/${roomCode}/assignments`]: assignments,
    [`rooms/${roomCode}/civilianWord`]: civilianWord,
    [`rooms/${roomCode}/mrWhiteWord`]: mrWhiteWord,
    [`rooms/${roomCode}/clues`]: {},
    [`rooms/${roomCode}/votes`]: {},
    [`rooms/${roomCode}/kickedPlayerId`]: null,
    [`rooms/${roomCode}/kickedRole`]: null,
    [`rooms/${roomCode}/roundResult`]: null,
    [`rooms/${roomCode}/mrWhiteGuess`]: null,
    [`rooms/${roomCode}/mrWhiteGuessCorrect`]: null,
    [`rooms/${roomCode}/timerStart`]: Date.now(),
  });
};

// Dengarkan perubahan room secara real-time
export const listenToRoom = (roomCode, callback) => {
  const roomRef = ref(db, `rooms/${roomCode}`);
  onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
  return () => off(roomRef);
};

// Hapus room
export const deleteRoom = async (roomCode) => {
  await remove(ref(db, `rooms/${roomCode}`));
};

// Update status online pemain
export const setPlayerOnline = async (roomCode, playerId, isOnline) => {
  await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { isOnline });
};

// Update status siap pemain
export const setPlayerReady = async (roomCode, playerId, isReady) => {
  await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { isReady });
};
