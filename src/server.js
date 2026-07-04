require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('./models/User');
const { createDeck, isValidCapture, calculateRoundScores, getBestMove } = require('./gameLogic');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: ['http://localhost:5173', 'https://dila-alpha.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ მონაცემთა ბაზა წარმატებით დაუკავშირდა'))
  .catch(err => console.error('❌ ბაზასთან კავშირის შეცდომა:', err.message));

const io = new Server(server, {
  cors: { 
    origin: ['http://localhost:5173', 'https://dila-alpha.vercel.app'], 
    methods: ["GET", "POST"],
    credentials: true
  }
});

const rooms = {};
const roomTimers = {}; 
const disconnectTimeouts = {}; 
const onlineUsersMap = {};

io.on('connection', (socket) => {
  console.log(`🔌 ახალი კავშირი: ${socket.id}`);

  const broadcastOnlineUsers = () => {
    const usersList = Object.entries(onlineUsersMap).map(([id, name]) => ({ socketId: id, username: name }));
    io.emit('updateOnlineUsers', usersList);
  };

  socket.on('setOnlineUser', (username) => {
    onlineUsersMap[socket.id] = username;
    broadcastOnlineUsers();
  });

  // 🟢 სხვა მოთამაშის პროფილის ნახვა (Player Inspect)
  socket.on('getUserProfile', async ({ username }) => {
    try {
      const p = await User.findOne({ username });
      if (p) {
        socket.emit('receiveUserProfile', {
          username: p.username, level: p.level, xp: p.xp,
          stats: p.stats, achievements: p.achievements, avatar: p.avatar
        });
      }
    } catch(err) {}
  });

  // 🟢 უნივერსალური მაღაზია (ავატარები, მაგიდები, კარტები)
  socket.on('buyItem', async ({ type, itemId, price }) => {
    try {
      const uname = onlineUsersMap[socket.id];
      if(!uname) return;
      const user = await User.findOne({username: uname});
      if(user) {
        let unlockedArray = type === 'avatar' ? user.unlockedAvatars : type === 'table' ? user.unlockedTableThemes : user.unlockedCardBacks;
        if(unlockedArray.includes(itemId)) return socket.emit('error', 'ეს ნივთი უკვე გაქვს!');
        
        if(user.coins >= price) {
          user.coins -= price;
          unlockedArray.push(itemId);
          if (type === 'avatar') user.avatar = itemId;
          else if (type === 'table') user.tableTheme = itemId;
          else if (type === 'card') user.cardBack = itemId;
          
          await user.save();
          socket.emit('successMessage', 'წარმატებით შეიძინე!');
          socket.emit('friendListUpdated'); // ვააფდეითებთ ფრონტს
        } else {
          socket.emit('error', 'არასაკმარისი მონეტები!');
        }
      }
    } catch(err) { console.error(err); }
  });

  socket.on('equipItem', async ({ type, itemId }) => {
    try {
      const uname = onlineUsersMap[socket.id];
      if(!uname) return;
      const user = await User.findOne({username: uname});
      if(user) {
        let unlockedArray = type === 'avatar' ? user.unlockedAvatars : type === 'table' ? user.unlockedTableThemes : user.unlockedCardBacks;
        if(unlockedArray.includes(itemId)) {
          if (type === 'avatar') user.avatar = itemId;
          else if (type === 'table') user.tableTheme = itemId;
          else if (type === 'card') user.cardBack = itemId;
          
          await user.save();
          socket.emit('successMessage', 'დიზაინი დაყენებულია!');
          socket.emit('friendListUpdated');
        }
      }
    } catch(err) { console.error(err); }
  });

  // მეგობრების ლოგიკა
  socket.on('sendFriendRequest', async ({ targetUsername }) => {
    try {
      const senderName = onlineUsersMap[socket.id];
      if(!senderName || senderName === targetUsername) return;
      const targetUser = await User.findOne({ username: targetUsername });
      if(targetUser) {
        if (!targetUser.friends.includes(senderName) && !targetUser.friendRequests.includes(senderName)) {
          targetUser.friendRequests.push(senderName);
          await targetUser.save();
          const targetSocketEntry = Object.entries(onlineUsersMap).find(([id, name]) => name === targetUsername);
          if(targetSocketEntry) io.to(targetSocketEntry[0]).emit('friendRequestReceived', senderName);
          socket.emit('successMessage', 'თხოვნა გაიგზავნა!');
        } else { socket.emit('error', 'უკვე გაგზავნილია.'); }
      } else { socket.emit('error', 'მოთამაშე ვერ მოიძებნა.'); }
    } catch(err) { console.error(err); }
  });

  socket.on('acceptFriendRequest', async ({ senderUsername }) => {
    try {
      const myName = onlineUsersMap[socket.id];
      const me = await User.findOne({ username: myName });
      const sender = await User.findOne({ username: senderUsername });
      if(me && sender) {
        me.friendRequests = me.friendRequests.filter(u => u !== senderUsername);
        if(!me.friends.includes(senderUsername)) me.friends.push(senderUsername);
        if(!sender.friends.includes(myName)) sender.friends.push(myName);
        await me.save(); await sender.save();
        socket.emit('friendListUpdated');
        const senderSocketEntry = Object.entries(onlineUsersMap).find(([id, name]) => name === senderUsername);
        if(senderSocketEntry) {
          io.to(senderSocketEntry[0]).emit('friendListUpdated');
          io.to(senderSocketEntry[0]).emit('successMessage', `${myName}-მ დაგიმატა!`);
        }
      }
    } catch(err) { console.error(err); }
  });

  socket.on('rejectFriendRequest', async ({ senderUsername }) => {
    try {
      const myName = onlineUsersMap[socket.id];
      const me = await User.findOne({ username: myName });
      if(me) {
        me.friendRequests = me.friendRequests.filter(u => u !== senderUsername);
        await me.save();
        socket.emit('friendListUpdated');
      }
    } catch(err) { console.error(err); }
  });

  socket.on('sendInvite', ({ targetSocketId, roomId, password, fromName }) => {
    io.to(targetSocketId).emit('receiveInvite', { roomId, password, fromName });
  });

  const broadcastActiveRooms = () => {
    const activeLobbies = Object.values(rooms).filter(r => !r.gameStarted).map(r => ({
      id: r.id, hostName: r.players[0]?.name || 'უცნობი', hostAvatar: r.players[0]?.avatar || '😎',
      currentPlayers: r.players.length, maxPlayers: r.maxPlayers, targetScore: r.targetScore,
      allowBots: r.allowBots, isPrivate: r.isPrivate, isRanked: r.isRanked
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
          } else { io.to(roomId).emit('roomUpdated', room); }
        } else {
          const p = room.players[playerIndex];
          const originalName = p.name; 
          const isMatchOver = room.roundSummary && room.roundSummary.matchWinner;
          
          if (!p.isBot && room.isRanked && !isMatchOver) {
            User.findOneAndUpdate({ username: originalName },
              { $inc: { 'stats.gamesPlayed': 1, 'stats.totalPointsScored': -room.targetScore }, 
                $push: { gameHistory: { $each: [{ roomId: room.id, targetScore: room.targetScore, myFinalScore: -room.targetScore, isWinner: false, playedAt: new Date() }], $position: 0 } }
              }).catch(err => console.error(err));
          }

          p.isBot = true; p.name = `${originalName} (გავიდა 🤖)`; p.id = `bot_${Math.random().toString(36).substr(2, 5)}`; 
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
    });
    broadcastActiveRooms();
  };

  socket.on('reconnectUser', ({ oldSocketId, playerName, roomId }) => {
    if (oldSocketId && disconnectTimeouts[oldSocketId]) {
      clearTimeout(disconnectTimeouts[oldSocketId]); delete disconnectTimeouts[oldSocketId];
    }
    const room = rooms[roomId];
    if (room) {
      const player = room.players.find(p => p.name === playerName);
      if (player) {
        player.id = socket.id; 
        socket.join(roomId);
        io.to(roomId).emit('gameUpdated', room);
      } else { socket.emit('roomNotFound'); }
    } else { socket.emit('roomNotFound'); }
  });

  socket.on('joinRoom', async ({ roomId, playerName, roomPassword, maxPlayers, targetScore, allowBots, isRanked }) => {
    if (!roomId || !playerName) return socket.emit('error', 'მონაცემები არასრულია');
    socket.join(roomId);

    let userAvatar = '😎';
    let hostTheme = 'wood';
    let hostCardBack = 'classic';
    try {
        const dbUser = await User.findOne({ username: playerName });
        if (dbUser) {
          userAvatar = dbUser.avatar || '😎';
          hostTheme = dbUser.tableTheme || 'wood';
          hostCardBack = dbUser.cardBack || 'classic';
        }
    } catch(e) {}

    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId, players: [], gameStarted: false, deck: [], tableCards: [],
        currentTurn: 0, roundSummary: null, lastAction: null, lastCapturerId: null,
        targetScore: targetScore || 11, maxPlayers: maxPlayers || 4,
        allowBots: allowBots !== undefined ? allowBots : true,
        isRanked: allowBots ? false : (isRanked !== undefined ? isRanked : true), 
        readyForNextRound: [], turnExpiresAt: null,
        password: roomPassword ? roomPassword.trim() : null, isPrivate: !!roomPassword,
        hostTheme, hostCardBack // 🟢 ოთახი იმახსოვრებს Host-ის დიზაინს
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
      playerExists.avatar = userAvatar;
      if (room.gameStarted) socket.emit('gameStarted', room);
      else socket.emit('roomUpdated', room);
      broadcastActiveRooms();
      return;
    }

    if (room.players.length >= room.maxPlayers && !room.gameStarted) {
      return socket.emit('error', 'ოთახი უკვე სავსეა!');
    }

    room.players.push({ id: socket.id, name: playerName, avatar: userAvatar, cards: [], captured: [], totalScore: 0, isBot: false, achievementsEarned: [] });
    io.to(roomId).emit('roomUpdated', room);
    broadcastActiveRooms();
  });

  socket.on('getLiveRooms', () => broadcastActiveRooms());

  socket.on('updateConfig', ({ roomId, targetScore, maxPlayers, allowBots }) => {
    const room = rooms[roomId];
    if (!room || room.gameStarted) return;
    if (room.players[0] && room.players[0].id !== socket.id) return;
    room.targetScore = targetScore; room.maxPlayers = maxPlayers; room.allowBots = allowBots;
    if (allowBots) room.isRanked = false;
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
    io.to(roomId).emit('receiveMessage', { sender: player.name, senderId: player.id, text: message, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  });

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
        room.players.push({ id: `bot_${Math.random().toString(36).substr(2, 5)}`, name: `რობოტი ${i}`, avatar: '🤖', cards: [], captured: [], totalScore: 0, isBot: true, achievementsEarned: [] });
      }
    }
    room.deck = createDeck(); room.tableCards = [];
    while (room.tableCards.length < 4) {
      let card = room.deck.shift();
      if (card.rank === 'J') { room.deck.push(card); } else { room.tableCards.push(card); }
    }
    room.players.forEach(p => { p.cards = room.deck.splice(0, 4); p.captured = []; p.achievementsEarned = []; });
    room.currentTurn = 0; room.lastAction = null; room.roundSummary = null; room.lastCapturerId = null; 
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
      
      if (room.isRanked && cardFromHand.rank === 'J' && cardsFromTable.length >= 4) {
        if (!player.achievementsEarned) player.achievementsEarned = [];
        if (!player.achievementsEarned.includes('sweeper')) player.achievementsEarned.push('sweeper');
      }

      player.cards = player.cards.filter(c => !(c.rank === cardFromHand.rank && c.suit === cardFromHand.suit));
      player.captured.push(cardFromHand, ...cardsFromTable);
      const tableIds = cardsFromTable.map(c => `${c.rank}${c.suit}`);
      room.tableCards = room.tableCards.filter(c => !tableIds.includes(`${c.rank}${c.suit}`));
      room.lastAction = { playerName: player.name, cardFromHand, cardsFromTable, type: 'CAPTURE' };
      room.lastCapturerId = player.id; 
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
        room.gameStarted = false; room.deck = []; room.tableCards = []; room.roundSummary = null; room.lastAction = null; room.readyForNextRound = []; room.lastCapturerId = null;
        room.players = room.players.filter(p => !p.isBot);
        room.players.forEach(p => { p.cards = []; p.captured = []; p.totalScore = 0; p.achievementsEarned = []; });
        io.to(roomId).emit('roomUpdated', room);
        broadcastActiveRooms();
      } else {
        room.deck = createDeck(); room.tableCards = [];
        while (room.tableCards.length < 4) {
          let card = room.deck.shift();
          if (card.rank === 'J') { room.deck.push(card); } else { room.tableCards.push(card); }
        }
        room.players.forEach(p => { p.cards = room.deck.splice(0, 4); p.captured = []; });
        room.currentTurn = 0; room.lastAction = null; room.roundSummary = null; room.readyForNextRound = []; room.lastCapturerId = null; 
        startTurnTimer(room, roomId);
        io.to(roomId).emit('gameStarted', room);
        checkAndTriggerBotTurn(room, roomId);
      }
    } else { io.to(roomId).emit('gameUpdated', room); }
  });

  socket.on('disconnect', () => {
    console.log(`❌ მოთამაშე გაითიშა: ${socket.id}`);
    delete onlineUsersMap[socket.id];
    broadcastOnlineUsers();
    disconnectTimeouts[socket.id] = setTimeout(() => {
      handlePlayerLeave(socket.id); delete disconnectTimeouts[socket.id];
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
      if (room.tableCards.length > 0 && room.lastCapturerId) {
        const lastCapturer = room.players.find(p => p.id === room.lastCapturerId);
        if (lastCapturer) { lastCapturer.captured.push(...room.tableCards); room.tableCards = []; }
      }

      calculateRoundScores(room);
      
      if (room.isRanked && room.roundSummary.diamond10Winner !== "-") {
         const d10Player = room.players.find(p => p.name === room.roundSummary.diamond10Winner);
         if (d10Player && !d10Player.isBot) {
             if (!d10Player.achievementsEarned) d10Player.achievementsEarned = [];
             if (!d10Player.achievementsEarned.includes('diamond_10')) d10Player.achievementsEarned.push('diamond_10');
         }
      }
      if (room.isRanked && room.roundSummary.club2Winner !== "-") {
         const c2Player = room.players.find(p => p.name === room.roundSummary.club2Winner);
         if (c2Player && !c2Player.isBot) {
             if (!c2Player.achievementsEarned) c2Player.achievementsEarned = [];
             if (!c2Player.achievementsEarned.includes('club_2')) c2Player.achievementsEarned.push('club_2');
         }
      }

      room.readyForNextRound = [];
      room.players.forEach(p => { if (p.isBot) room.readyForNextRound.push(p.id); });

      let maxScore = -1; let winnerPlayer = null;
      room.players.forEach(p => { if (p.totalScore > maxScore) { maxScore = p.totalScore; winnerPlayer = p; } });

      if (maxScore >= room.targetScore) {
        room.roundSummary.matchWinner = winnerPlayer.name; 
        
        if (room.isRanked) {
          room.players.forEach(async (p) => {
            if (p.isBot) return; 
            try {
              const isWinner = p.name === room.roundSummary.matchWinner;
              let matchAchievements = p.achievementsEarned || [];
              if (isWinner && !matchAchievements.includes('first_win')) matchAchievements.push('first_win');

              const dbUser = await User.findOne({ username: p.name });
              if (dbUser) {
                  const now = new Date();
                  if (!dbUser.dailyQuests || dbUser.dailyQuests.length === 0 || (dbUser.lastQuestGeneration && (now - new Date(dbUser.lastQuestGeneration)) > 24 * 60 * 60 * 1000)) {
                      dbUser.dailyQuests = [
                          { questId: 'play_ranked', title: 'ითამაშე 3 რეიტინგული მატჩი', target: 3, progress: 0, xpReward: 300, isCompleted: false },
                          { questId: 'win_ranked', title: 'მოიგე 1 რეიტინგული მატჩი', target: 1, progress: 0, xpReward: 500, isCompleted: false },
                          { questId: 'get_10_diamond', title: 'მოიპოვე 10 აგური მატჩში', target: 1, progress: 0, xpReward: 400, isCompleted: false }
                      ];
                      dbUser.lastQuestGeneration = now;
                  }

                  let earnedXp = 100; let earnedCoins = 10;
                  if (isWinner) { earnedXp += 200; earnedCoins += 40; }

                  dbUser.dailyQuests.forEach(q => {
                      if (q.isCompleted) return;
                      if (q.questId === 'play_ranked') q.progress += 1;
                      if (q.questId === 'win_ranked' && isWinner) q.progress += 1;
                      if (q.questId === 'get_10_diamond' && matchAchievements.includes('diamond_10')) q.progress += 1;

                      if (q.progress >= q.target) {
                          q.progress = q.target; q.isCompleted = true;
                          earnedXp += q.xpReward; earnedCoins += 50; 
                      }
                  });

                  dbUser.xp += earnedXp; dbUser.coins = (dbUser.coins || 0) + earnedCoins;
                  
                  let levelThreshold = dbUser.level * 1000;
                  while (dbUser.xp >= levelThreshold) {
                      dbUser.xp -= levelThreshold; dbUser.level += 1;
                      levelThreshold = dbUser.level * 1000;
                  }

                  dbUser.stats.gamesPlayed += 1;
                  if (dbUser.stats.gamesPlayed >= 10 && !matchAchievements.includes('veteran')) matchAchievements.push('veteran');

                  if (isWinner) dbUser.stats.gamesWon += 1;
                  dbUser.stats.totalPointsScored += p.totalScore;
                  dbUser.gameHistory.unshift({ roomId: room.id, targetScore: room.targetScore, myFinalScore: p.totalScore, isWinner: isWinner, playedAt: new Date() });
                  
                  matchAchievements.forEach(ach => {
                      if (!dbUser.achievements.includes(ach)) dbUser.achievements.push(ach);
                  });

                  await dbUser.save();
              }
            } catch (dbErr) { console.error(dbErr.message); }
          });
        }
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
        room.lastCapturerId = activePlayer.id; 
      } else { room.tableCards.push(botMove.cardFromHand); }
      handleTurnTransition(room, roomId);
    }, 1500); 
  }
}

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`🚀 სერვერი წარმატებით მუშაობს პორტზე: ${PORT}`));