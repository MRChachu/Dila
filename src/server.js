require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');

// DNS-ის დაფიქსირება კავშირის სტაბილურობისთვის
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('./models/User');
const { createDeck, isValidCapture, calculateRoundScores, getBestMove } = require('./gameLogic');

const app = express();
const server = http.createServer(app);

// ✨ სრულყოფილი CORS კონფიგურაცია ინტერნეტისთვის
app.use(cors({
  origin: ['http://localhost:5173', 'https://dila-alpha.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// API როუტები
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ბაზასთან კავშირი
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ მონაცემთა ბაზა წარმატებით დაუკავშირდა (MongoDB Connected)'))
  .catch(err => console.error('❌ ბაზასთან კავშირის შეცდომა:', err.message));

// სოკეტების სერვერი თავისი CORS-ით
const io = new Server(server, {
  cors: { 
    origin: ['http://localhost:5173', 'https://dila-alpha.vercel.app'], 
    methods: ["GET", "POST"],
    credentials: true
  }
});

const rooms = {};
const roomTimers = {}; 
const disconnectTimeouts = {}; // რეფრეშის დაყოვნების ობიექტი

io.on('connection', (socket) => {
  console.log(`🔌 ახალი მოთამაშე: ${socket.id}`);

  const broadcastActiveRooms = () => {
    const activeLobbies = Object.values(rooms)
      .filter(r => !r.gameStarted) 
      .map(r => ({
        id: r.id,
        hostName: r.players[0]?.name || 'უცნობი',
        currentPlayers: r.players.length,
        maxPlayers: r.maxPlayers,
        targetScore: r.targetScore,
        allowBots: r.allowBots,
        isPrivate: r.isPrivate
      }));
    io.emit('activeRoomsList', activeLobbies); 
  };

  const handlePlayerLeave = (socketId) => {
    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socketId);
      
      if (playerIndex !== -1) {
        if (!room.gameStarted) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            delete rooms[roomId];
            if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
          } else {
            io.to(roomId).emit('roomUpdated', room);
          }
        } else {
          const p = room.players[playerIndex];
          if (!p.isBot) {
            const originalName = p.name; 
            
            // მომენტალური წაგების ჩაწერა მონაცემთა ბაზაში
            User.findOneAndUpdate(
              { username: originalName },
              {
                $inc: { 'stats.gamesPlayed': 1 }, 
                $push: {
                  gameHistory: {
                    $each: [{ roomId: room.id, targetScore: room.targetScore, myFinalScore: p.totalScore, isWinner: false, playedAt: new Date() }],
                    $position: 0 
                  }
                }
              }
            ).catch(err => console.error("წაგების ჩაწერის შეცდომა:", err));

            p.isBot = true;
            p.name = `${originalName} (გავიდა 🤖)`;
            p.id = `bot_${Math.random().toString(36).substr(2, 5)}`; 

            const realPlayers = room.players.filter(pl => !pl.isBot);
            if (realPlayers.length === 0) {
              delete rooms[roomId];
              if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
            } else {
              io.to(roomId).emit('gameUpdated', room);
              if (room.currentTurn === playerIndex) {
                if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
                room.turnExpiresAt = null;
                io.to(roomId).emit('gameUpdated', room);
                checkAndTriggerBotTurn(room, roomId);
              }
            }
          }
        }
      }
    });
    broadcastActiveRooms();
  };

  // ♻️ რეფრეშის დროს კავშირის აღდგენა
  socket.on('reconnectUser', ({ oldSocketId, playerName, roomId }) => {
    if (disconnectTimeouts[oldSocketId]) {
      clearTimeout(disconnectTimeouts[oldSocketId]); // ვაუქმებთ წაგებას
      delete disconnectTimeouts[oldSocketId];
      
      const room = rooms[roomId];
      if (room) {
        const player = room.players.find(p => p.name === playerName);
        if (player) {
          player.id = socket.id; 
          socket.join(roomId);
          io.to(roomId).emit('gameUpdated', room);
          console.log(`✅ მოთამაშე დაბრუნდა რეფრეშის მერე: ${playerName}`);
        }
      }
    }
  });

  socket.on('joinRoom', ({ roomId, playerName, roomPassword, maxPlayers, targetScore, allowBots }) => {
    if (!roomId || !playerName) return socket.emit('error', 'მონაცემები არასრულია');
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId, players: [], gameStarted: false, deck: [], tableCards: [],
        currentTurn: 0, roundSummary: null, lastAction: null,
        targetScore: targetScore || 11, maxPlayers: maxPlayers || 4,
        allowBots: allowBots !== undefined ? allowBots : true,
        readyForNextRound: [], turnExpiresAt: null,
        password: roomPassword ? roomPassword.trim() : null, isPrivate: !!roomPassword 
      };
    }

    const room = rooms[roomId];

    if (room.isPrivate && !room.gameStarted) {
      const isAlreadyIn = room.players.some(p => p.name === playerName);
      if (!isAlreadyIn && room.password !== roomPassword?.trim()) {
        return socket.emit('error', 'არასწორი ოთახის პაროლი!');
      }
    }

    const playerExists = room.players.find(p => p.name === playerName);
    if (playerExists) {
      playerExists.id = socket.id; 
      if (room.gameStarted) socket.emit('gameStarted', room);
      else socket.emit('roomUpdated', room);
      broadcastActiveRooms();
      return;
    }

    if (room.players.length >= room.maxPlayers && !room.gameStarted) {
      return socket.emit('error', 'ეს ოთახი უკვე სავსეა მოთამაშეებით!');
    }

    room.players.push({ id: socket.id, name: playerName, cards: [], captured: [], totalScore: 0, isBot: false });
    io.to(roomId).emit('roomUpdated', room);
    broadcastActiveRooms();
  });

  socket.on('getLiveRooms', () => broadcastActiveRooms());

  socket.on('updateConfig', ({ roomId, targetScore, maxPlayers, allowBots }) => {
    const room = rooms[roomId];
    if (!room || room.gameStarted) return;
    if (room.players[0] && room.players[0].id !== socket.id) return;
    room.targetScore = targetScore; room.maxPlayers = maxPlayers; room.allowBots = allowBots;
    if (room.players.length > maxPlayers) room.players = room.players.slice(0, maxPlayers);
    io.to(roomId).emit('roomUpdated', room);
    broadcastActiveRooms();
  });

  socket.on('leaveRoom', () => {
    handlePlayerLeave(socket.id);
    socket.rooms.forEach(r => { if (r !== socket.id) socket.leave(r); });
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    io.to(roomId).emit('receiveMessage', {
      sender: player.name, senderId: player.id, text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // 🎭 ემოციების (Live Emotes) სინქრონიზაცია ოთახში
  socket.on('sendEmote', ({ roomId, emote }) => {
    socket.to(roomId).emit('receiveEmote', { playerId: socket.id, emote });
  });

  socket.on('startGame', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameStarted) return;
    if (!room.allowBots && room.players.length < room.maxPlayers) return socket.emit('error', `საჭიროა ${room.maxPlayers} მოთამაშე!`);

    room.gameStarted = true; room.readyForNextRound = [];
    if (room.allowBots) {
      const currentRealCount = room.players.length;
      for (let i = currentRealCount; i < room.maxPlayers; i++) {
        room.players.push({ id: `bot_${Math.random().toString(36).substr(2, 5)}`, name: `რობოტი ${i}`, cards: [], captured: [], totalScore: 0, isBot: true });
      }
    }
    room.deck = createDeck(); room.tableCards = room.deck.splice(0, 4);
    room.players.forEach(p => { p.cards = room.deck.splice(0, 4); p.captured = []; });
    room.currentTurn = 0; room.lastAction = null; room.roundSummary = null;
    startTurnTimer(room, roomId);
    io.to(roomId).emit('gameStarted', room);
    broadcastActiveRooms(); 
    checkAndTriggerBotTurn(room, roomId);
  });

  socket.on('playCard', ({ roomId, cardFromHand, cardsFromTable }) => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;
    const player = room.players[room.currentTurn];
    if (player.id !== socket.id) return socket.emit('error', 'ახლა შენი სვლა არ არის!');

    if (cardsFromTable && cardsFromTable.length > 0) {
      if (!isValidCapture(cardFromHand, cardsFromTable)) return socket.emit('error', 'არასწორი მოჭრა!');
      if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
      player.cards = player.cards.filter(c => !(c.rank === cardFromHand.rank && c.suit === cardFromHand.suit));
      player.captured.push(cardFromHand, ...cardsFromTable);
      const tableIds = cardsFromTable.map(c => `${c.rank}${c.suit}`);
      room.tableCards = room.tableCards.filter(c => !tableIds.includes(`${c.rank}${c.suit}`));
      room.lastAction = { playerName: player.name, cardFromHand, cardsFromTable, type: 'CAPTURE' };
    } else {
      if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
      player.cards = player.cards.filter(c => !(c.rank === cardFromHand.rank && c.suit === cardFromHand.suit));
      room.tableCards.push(cardFromHand);
      room.lastAction = { playerName: player.name, cardFromHand, cardsFromTable: [], type: 'DISCARD' };
    }
    handleTurnTransition(room, roomId);
  });

  socket.on('nextRoundReady', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.roundSummary) return;
    if (!room.readyForNextRound) room.readyForNextRound = [];
    if (room.readyForNextRound.includes(socket.id)) return;
    room.readyForNextRound.push(socket.id);

    const realPlayers = room.players.filter(p => !p.isBot);
    const allRealReady = realPlayers.every(p => room.readyForNextRound.includes(p.id));

    if (allRealReady) {
      if (room.roundSummary.matchWinner) {
        room.gameStarted = false; room.deck = []; room.tableCards = []; room.roundSummary = null; room.lastAction = null; room.readyForNextRound = [];
        room.players = room.players.filter(p => !p.isBot);
        room.players.forEach(p => { p.cards = []; p.captured = []; p.totalScore = 0; });
        io.to(roomId).emit('roomUpdated', room);
        broadcastActiveRooms();
      } else {
        room.deck = createDeck(); room.tableCards = room.deck.splice(0, 4);
        room.players.forEach(p => { p.cards = room.deck.splice(0, 4); p.captured = []; });
        room.currentTurn = 0; room.lastAction = null; room.roundSummary = null; room.readyForNextRound = [];
        startTurnTimer(room, roomId);
        io.to(roomId).emit('gameStarted', room);
        checkAndTriggerBotTurn(room, roomId);
      }
    } else {
      io.to(roomId).emit('gameUpdated', room);
    }
  });

  // 🛡️ რეფრეშის 5 წამიანი დაყოვნება გათიშვისას
  socket.on('disconnect', () => {
    console.log(`❌ მოთამაშე გაითიშა: ${socket.id}`);
    disconnectTimeouts[socket.id] = setTimeout(() => {
      handlePlayerLeave(socket.id);
      delete disconnectTimeouts[socket.id];
    }, 5000);
  });
});

function handleTurnTransition(room, roomId) {
  if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
  const allHandsEmpty = room.players.every(p => p.cards.length === 0);

  if (allHandsEmpty) {
    if (room.deck.length > 0) {
      room.players.forEach(p => { p.cards = room.deck.splice(0, 4); });
      room.currentTurn = (room.currentTurn + 1) % room.players.length;
      startTurnTimer(room, roomId);
      io.to(roomId).emit('gameUpdated', room);
      checkAndTriggerBotTurn(room, roomId);
    } else {
      calculateRoundScores(room);
      room.readyForNextRound = [];
      room.players.forEach(p => { if (p.isBot) room.readyForNextRound.push(p.id); });

      let maxScore = -1; let winnerPlayer = null;
      room.players.forEach(p => { if (p.totalScore > maxScore) { maxScore = p.totalScore; winnerPlayer = p; } });

      if (maxScore >= room.targetScore) {
        room.roundSummary.matchWinner = winnerPlayer.name; 
        room.players.forEach(async (p) => {
          if (p.isBot) return; 
          try {
            const isWinner = p.name === room.roundSummary.matchWinner;
            await User.findOneAndUpdate({ username: p.name }, { $inc: { 'stats.gamesPlayed': 1, 'stats.gamesWon': isWinner ? 1 : 0, 'stats.totalPointsScored': p.totalScore }, $push: { gameHistory: { $each: [{ roomId: room.id, targetScore: room.targetScore, myFinalScore: p.totalScore, isWinner: isWinner, playedAt: new Date() }], $position: 0 } } });
          } catch (dbErr) { console.error(dbErr.message); }
        });
      }
      io.to(roomId).emit('gameUpdated', room); 
      return;
    }
  } else {
    room.currentTurn = (room.currentTurn + 1) % room.players.length;
    startTurnTimer(room, roomId);
    io.to(roomId).emit('gameUpdated', room);
    checkAndTriggerBotTurn(room, roomId);
  }
}

function startTurnTimer(room, roomId) {
  if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
  if (!room.gameStarted) return;
  const activePlayer = room.players[room.currentTurn];
  if (activePlayer && activePlayer.isBot) { room.turnExpiresAt = null; return; }

  room.turnExpiresAt = Date.now() + 20000;
  roomTimers[roomId] = setTimeout(() => {
    if (!room.gameStarted || room.currentTurn === null) return;
    const timeoutPlayer = room.players[room.currentTurn];
    if (!timeoutPlayer || timeoutPlayer.isBot) return;
    if (timeoutPlayer.cards.length === 0) { handleTurnTransition(room, roomId); return; }

    const autoCard = timeoutPlayer.cards[0];
    timeoutPlayer.cards = timeoutPlayer.cards.filter(c => !(c.rank === autoCard.rank && c.suit === autoCard.suit));
    room.tableCards.push(autoCard);
    room.lastAction = { playerName: `${timeoutPlayer.name} (🕒 დრო)`, cardFromHand: autoCard, cardsFromTable: [], type: 'DISCARD' };
    handleTurnTransition(room, roomId);
  }, 20000);
}

function checkAndTriggerBotTurn(room, roomId) {
  if (!room || !room.gameStarted) return;
  const activePlayer = room.players[room.currentTurn];
  if (activePlayer && activePlayer.isBot) {
    setTimeout(() => {
      const botMove = getBestMove(activePlayer.cards, room.tableCards);
      if (!botMove) return;
      activePlayer.cards = activePlayer.cards.filter(c => !(c.rank === botMove.cardFromHand.rank && c.suit === botMove.cardFromHand.suit));
      room.lastAction = { playerName: activePlayer.name, cardFromHand: botMove.cardFromHand, cardsFromTable: botMove.cardsFromTable, type: botMove.type };
      if (botMove.type === 'CAPTURE' && botMove.cardsFromTable.length > 0) {
        activePlayer.captured.push(botMove.cardFromHand, ...botMove.cardsFromTable);
        const tableIds = botMove.cardsFromTable.map(c => `${c.rank}${c.suit}`);
        room.tableCards = room.tableCards.filter(c => !tableIds.includes(`${c.rank}${c.suit}`));
      } else { room.tableCards.push(botMove.cardFromHand); }
      handleTurnTransition(room, roomId);
    }, 1500); 
  }
}

const PORT = 5002;
server.listen(PORT, () => console.log(`🚀 სერვერი წარმატებით მუშაობს პორტზე: ${PORT}`));