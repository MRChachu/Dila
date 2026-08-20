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
const { createDamkaBoard, validateDamkaMove, hasCaptureMoves, hasAnyValidMoves } = require('./damkaLogic');

const ALL_DAILY_QUESTS = [
    { questId: 'play_ranked', title: 'ითამაშე 3 რეიტინგული მატჩი', target: 3, xpReward: 15 },
    { questId: 'win_ranked', title: 'მოიგე 2 რეიტინგული მატჩი', target: 2, xpReward: 25 },
    { questId: 'get_10_diamond', title: 'მოიპოვე 10 აგური მატჩში', target: 1, xpReward: 20 },
    { questId: 'get_2_club', title: 'მოიპოვე 2 ჯვარი მატჩში', target: 1, xpReward: 20 },
    { questId: 'play_5_games', title: 'ითამაშე 5 მატჩი', target: 5, xpReward: 20 },
    { questId: 'win_3_games', title: 'მოიგე 3 მატჩი', target: 3, xpReward: 30 },
    { questId: 'sweep_table', title: 'გაასუფთავე მაგიდა (ვალეტით)', target: 1, xpReward: 15 }
];

const app = express();
const server = http.createServer(app);

// 🟢 1. Express CORS
app.use(cors({ 
    origin: [
        'http://localhost:5173', 
        'https://dila-alpha.vercel.app', 
        'https://phurti.ge', 
        'https://www.phurti.ge'
    ], 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    credentials: true 
}));

app.use(express.json());
app.use('/api/auth', require('./routes/auth'));

app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const globalStats = await User.aggregate([
            { $group: { _id: null, totalGamesPlayed: { $sum: "$stats.gamesPlayed" }, totalCoins: { $sum: "$coins" } } }
        ]);
        const topAvatars = await User.aggregate([
            { $match: { avatar: { $ne: null } } }, 
            { $group: { _id: "$avatar", count: { $sum: 1 } } }, 
            { $sort: { count: -1 } }, 
            { $limit: 3 }
        ]);
        const topThemes = await User.aggregate([
            { $match: { tableTheme: { $ne: null } } }, 
            { $group: { _id: "$tableTheme", count: { $sum: 1 } } }, 
            { $sort: { count: -1 } }, 
            { $limit: 3 }
        ]);
        
        res.json({ 
            totalUsers, 
            totalGamesPlayed: globalStats[0]?.totalGamesPlayed || 0, 
            totalCoins: globalStats[0]?.totalCoins || 0, 
            topAvatars, 
            topThemes 
        });
    } catch (err) { 
        res.status(500).json({ message: 'სერვერის შეცდომა' }); 
    }
});

app.post('/api/admin/advanced-action', async (req, res) => {
    try {
        const { adminPass, targetUser, action } = req.body;
        
        if (adminPass !== process.env.ADMIN_PASS && adminPass !== 'chachu123') {
            return res.status(403).json({ message: 'წვდომა აკრძალულია' });
        }
        
        if (action === 'delete') { 
            await User.deleteOne({ username: targetUser }); 
            return res.json({ success: true, message: 'ექაუნთი წაიშალა' }); 
        } else if (action === 'reset') {
            await User.updateOne({ username: targetUser }, { 
                $set: { 
                    coins: 0, 
                    xp: 0, 
                    level: 1, 
                    'stats.gamesPlayed': 0, 
                    'stats.gamesWon': 0, 
                    'stats.winStreak': 0, 
                    'stats.totalPointsScored': 0 
                } 
            });
            return res.json({ success: true, message: 'სტატისტიკა განულდა' });
        }
        
        res.status(400).json({ message: 'უცნობი მოქმედება' });
    } catch (err) { 
        res.status(500).json({ message: 'შეცდომა სერვერზე' }); 
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ ბაზა დაუკავშირდა'))
    .catch(err => console.error('❌ შეცდომა:', err.message));

// 🟢 2. Socket.IO CORS
const io = new Server(server, { 
    cors: { 
        origin: [
            'http://localhost:5173', 
            'https://dila-alpha.vercel.app', 
            'https://phurti.ge', 
            'https://www.phurti.ge'
        ], 
        methods: ["GET", "POST"], 
        credentials: true 
    } 
});

const rooms = {};
const roomTimers = {}; 
const disconnectTimeouts = {}; 
const onlineUsersMap = {};

const broadcastActiveRooms = () => {
    io.emit('activeRoomsList', Object.values(rooms).filter(r => !r.gameStarted).map(r => ({
        id: r.id, 
        hostName: r.players[0]?.name || 'უცნობი', 
        hostAvatar: r.players[0]?.avatar || '😎', 
        hostVip: r.players[0]?.vipUntil, 
        currentPlayers: r.players.length, 
        maxPlayers: r.maxPlayers, 
        targetScore: r.targetScore, 
        allowBots: r.allowBots, 
        isPrivate: r.isPrivate, 
        isRanked: r.isRanked, 
        gameType: r.gameType || 'phurti'
    }))); 
};

// 🟢 მომხმარებლების სტატუსის (თამაშობს თუ არა) გამომთვლელი და გამგზავნი
const broadcastOnlineUsers = () => {
    const usersList = Object.entries(onlineUsersMap).map(([id, name]) => {
        let inGame = false;
        for (const rId in rooms) {
            const r = rooms[rId];
            const isMatchOver = r.roundSummary && r.roundSummary.matchWinner;
            if (r.gameStarted && !isMatchOver && r.players.some(p => p.id === id)) {
                inGame = true; 
                break;
            }
        }
        return { socketId: id, username: name, inGame };
    });
    io.emit('updateOnlineUsers', usersList);
};

function getDamkaBotMove(board, playerIndex, multiCapturePos) {
    let validMoves = [];
    for (let r=0; r<8; r++) {
        for (let c=0; c<8; c++) {
            if (multiCapturePos && (r !== multiCapturePos.r || c !== multiCapturePos.c)) continue; 
            
            if (board[r][c] && board[r][c].player === playerIndex) {
                for (let tr=0; tr<8; tr++) {
                    for (let tc=0; tc<8; tc++) {
                        const val = validateDamkaMove(board, playerIndex, {r, c}, {r: tr, c: tc});
                        if (val.valid && (!multiCapturePos || val.isCapture)) {
                            validMoves.push({ from: {r, c}, to: {r: tr, c: tc} });
                        }
                    }
                }
            }
        }
    }
    
    if (validMoves.length > 0) {
        const caps = validMoves.filter(m => validateDamkaMove(board, playerIndex, m.from, m.to).isCapture);
        if(caps.length > 0) return caps[Math.floor(Math.random() * caps.length)];
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    return null;
}

function processDamkaMove(roomId, playerId, from, to, ioInst) {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'damka' || !room.gameStarted) return { error: 'Invalid room' };
    
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (room.currentTurn !== playerIndex) return { error: 'ახლა შენი სვლა არ არის!' };
    
    if (room.multiCapturePiece && (from.r !== room.multiCapturePiece.r || from.c !== room.multiCapturePiece.c)) {
        return { error: 'მოჭრა გააგრძელე!' };
    }
    
    const val = validateDamkaMove(room.damkaBoard, playerIndex, from, to);
    if (!val.valid) return { error: val.error || 'არასწორი სვლა!' };
    if (room.multiCapturePiece && !val.isCapture) return { error: 'სავალდებულოა მოჭრა!' };
    
    const piece = room.damkaBoard[from.r][from.c];
    piece.isKing = val.becomesKing;
    room.damkaBoard[to.r][to.c] = piece; 
    room.damkaBoard[from.r][from.c] = null;
    room.lastDamkaMove = { from, to };
    
    if (val.isCapture && val.capturedPos) {
        room.damkaBoard[val.capturedPos.r][val.capturedPos.c] = null;
    }
    
    let p0P = 0; 
    let p1P = 0;
    for(let r=0; r<8; r++) { 
        for(let c=0; c<8; c++) { 
            const p = room.damkaBoard[r][c]; 
            if(p && p.player === 0) p0P++; 
            if(p && p.player === 1) p1P++; 
        } 
    }
    
    let isOver = false; 
    let winName = null;
    
    if (p0P === 0) { 
        isOver = true; 
        winName = room.players[1].name; 
    } else if (p1P === 0) { 
        isOver = true; 
        winName = room.players[0].name; 
    } else {
        let multi = val.isCapture ? hasCaptureMoves(room.damkaBoard, playerIndex, to.r, to.c) : false;
        if (multi) {
            room.multiCapturePiece = { r: to.r, c: to.c }; 
            if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]); 
            room.turnExpiresAt = Date.now() + 30000;
        } else {
            room.multiCapturePiece = null; 
            const nextT = (room.currentTurn + 1) % 2;
            
            if (!hasAnyValidMoves(room.damkaBoard, nextT)) { 
                isOver = true; 
                winName = room.players[room.currentTurn].name; 
            } else {
                room.currentTurn = nextT; 
                if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]); 
                room.turnExpiresAt = Date.now() + 30000;
                roomTimers[roomId] = setTimeout(() => {
                   if (rooms[roomId] && rooms[roomId].gameStarted) {
                       rooms[roomId].currentTurn = (rooms[roomId].currentTurn + 1) % 2; 
                       rooms[roomId].multiCapturePiece = null; 
                       rooms[roomId].turnExpiresAt = Date.now() + 30000;
                       ioInst.to(roomId).emit('gameUpdated', rooms[roomId]); 
                       checkAndTriggerBotTurn(rooms[roomId], roomId);
                   }
                }, 30000);
            }
        }
    }
    
    if (isOver) {
        room.roundSummary = { matchWinner: winName };
        broadcastOnlineUsers(); // 🟢 თამაში დასრულდა
        
        if (room.isRanked) { 
            room.players.forEach(async (p) => {
                if (p.isBot) return; 
                try {
                    const isWin = p.name === winName; 
                    const dbU = await User.findOne({ username: p.name });
                    if (dbU) {
                        const isVip = dbU.vipUntil && new Date(dbU.vipUntil) > new Date();
                        let eXp = isWin ? (isVip ? 35 : 25) : (isVip ? -5 : -10); 
                        let eCoin = isWin ? (isVip ? 75 : 50) : (isVip ? -25 : -50);
                        
                        if (isWin) { 
                            dbU.stats.gamesWon++; 
                            dbU.stats.winStreak = (dbU.stats.winStreak || 0) + 1; 
                            if (dbU.stats.winStreak >= 10 && !dbU.achievements.includes('legionnaire')) {
                                dbU.achievements.push('legionnaire');
                            }
                            if (!dbU.achievements.includes('first_win')) {
                                dbU.achievements.push('first_win');
                            }
                            if (dbU.stats.gamesWon >= 100 && !dbU.achievements.includes('veteran')) {
                                dbU.achievements.push('veteran');
                            }
                        } else {
                            dbU.stats.winStreak = 0; 
                        }
                        
                        dbU.xp = Math.max(0, dbU.xp + eXp); 
                        dbU.coins = Math.max(0, (dbU.coins || 0) + eCoin);
                        let lThresh = dbU.level * 1000; 
                        
                        while (dbU.xp >= lThresh) { 
                            dbU.xp -= lThresh; 
                            dbU.level++; 
                            lThresh = dbU.level * 1000; 
                        }
                        
                        dbU.stats.gamesPlayed++;
                        dbU.gameHistory.unshift({ 
                            roomId: room.id, 
                            targetScore: 12, 
                            myFinalScore: isWin ? 12 : (p.name === room.players[0].name ? p0P : p1P), 
                            isWinner: isWin, 
                            playedAt: new Date(), 
                            opponents: room.players.filter(op => op.id !== p.id).map(op => op.name), 
                            gameType: 'damka' 
                        });
                        
                        if (dbU.gameHistory.length > 30) dbU.gameHistory.pop(); 
                        await dbU.save();
                    }
                } catch (e) {}
            });
        }
    }
    
    ioInst.to(roomId).emit('gameUpdated', room); 
    if (!isOver) checkAndTriggerBotTurn(room, roomId); 
    return { success: true };
}

function startGameLogic(roomId) {
    const room = rooms[roomId];
    if (!room || room.gameStarted) return;
    room.gameStarted = true; 
    room.readyForNextRound = [];

    if (room.allowBots) {
        room.isRanked = false; 
        const cRC = room.players.length;
        for (let i = cRC; i < room.maxPlayers; i++) {
            room.players.push({ 
                id: `bot_${Math.random().toString(36).substr(2, 5)}`, 
                name: `რობოტი ${i}`, 
                avatar: '🤖', 
                vipUntil: null, 
                xp: Math.floor(Math.random() * 5000), 
                cards: [], 
                captured: [], 
                totalScore: 0, 
                isBot: true, 
                achievementsEarned: [] 
            });
        }
    }

    if (room.gameType === 'damka') {
        room.damkaBoard = createDamkaBoard(); 
        room.currentTurn = 0; 
        room.lastAction = null; 
        room.roundSummary = null; 
        room.lastDamkaMove = null; 
        
        startTurnTimer(room, roomId); 
        io.to(roomId).emit('gameStarted', room); 
        broadcastActiveRooms(); 
        broadcastOnlineUsers(); 
        checkAndTriggerBotTurn(room, roomId); 
        return;
    }

    room.deck = createDeck(); 
    room.tableCards = [];
    while (room.tableCards.length < 4) {
        let c = room.deck.shift(); 
        if (c.rank === 'J') {
            room.deck.push(c); 
        } else {
            room.tableCards.push(c);
        }
    }
    
    room.players.forEach(p => { 
        p.cards = room.deck.splice(0, 4); 
        p.captured = []; 
        p.achievementsEarned = []; 
    });
    
    room.dealerIndex = 0; 
    room.currentTurn = 0; 
    room.lastAction = null; 
    room.roundSummary = null; 
    room.lastCapturerId = null; 
    
    startTurnTimer(room, roomId); 
    io.to(roomId).emit('gameStarted', room); 
    broadcastActiveRooms(); 
    broadcastOnlineUsers(); 
    checkAndTriggerBotTurn(room, roomId);
}

function checkAutoStart(roomId) {
    const room = rooms[roomId];
    if (room && !room.gameStarted && room.players.length === room.maxPlayers) {
        io.to(roomId).emit('gameStartingCountdown', 3);
        setTimeout(() => {
            const r = rooms[roomId];
            if (r && !r.gameStarted && r.players.length === r.maxPlayers) {
                startGameLogic(roomId);
            }
        }, 3000);
    }
}

io.on('connection', (socket) => {
    socket.on('adminBroadcast', (m) => io.emit('systemBroadcast', m));

    socket.on('setOnlineUser', async (username) => {
        onlineUsersMap[socket.id] = username; 
        broadcastOnlineUsers();
        
        try {
            const dbUser = await User.findOne({ username });
            if (dbUser) {
                const now = new Date(); 
                const lastGen = dbUser.lastQuestGeneration ? new Date(dbUser.lastQuestGeneration) : null;
                let needs = false; 
                const isVip = dbUser.vipUntil && new Date(dbUser.vipUntil) > new Date();
                
                if (!dbUser.dailyQuests || dbUser.dailyQuests.length === 0 || !lastGen) {
                    needs = true;
                } else if (new Date(now).toLocaleDateString('en-US', {timeZone: 'Asia/Tbilisi'}) !== new Date(lastGen).toLocaleDateString('en-US', {timeZone: 'Asia/Tbilisi'})) {
                    needs = true;
                }

                if (needs) {
                    const shuf = [...ALL_DAILY_QUESTS].sort(() => 0.5 - Math.random());
                    dbUser.dailyQuests = shuf.slice(0, 3).map(q => ({ 
                        questId: q.questId, 
                        title: q.title, 
                        target: q.target, 
                        progress: 0, 
                        xpReward: q.xpReward, 
                        isCompleted: false 
                    }));
                    dbUser.lastQuestGeneration = now; 
                    dbUser.markModified('dailyQuests');
                    
                    if (isVip) { 
                        dbUser.coins = (dbUser.coins || 0) + 100; 
                        socket.emit('vipBonusClaimed', 100); 
                    }
                    await dbUser.save(); 
                    socket.emit('friendListUpdated');
                }
            }
        } catch(e) {}
    });

    socket.on('getUserProfile', async ({ username }) => { 
        try { 
            const p = await User.findOne({ username }); 
            if (p) {
                socket.emit('receiveUserProfile', { 
                    username: p.username, 
                    level: p.level, 
                    xp: p.xp, 
                    stats: p.stats, 
                    achievements: p.achievements, 
                    avatar: p.avatar, 
                    vipUntil: p.vipUntil 
                }); 
            }
        } catch(err) {} 
    });

    socket.on('buyVip', async ({ days, price }) => { 
        try { 
            const uname = onlineUsersMap[socket.id]; 
            if(!uname) return; 
            
            const user = await User.findOne({username: uname}); 
            if(user && user.coins >= price) { 
                user.coins -= price; 
                const curr = user.vipUntil && user.vipUntil > new Date() ? user.vipUntil.getTime() : Date.now(); 
                user.vipUntil = new Date(curr + days * 86400000); 
                await user.save(); 
                socket.emit('successMessage', `VIP გააქტიურდა!`); 
                socket.emit('friendListUpdated'); 
            } else {
                socket.emit('error', 'არასაკმარისი მონეტები!'); 
            }
        } catch(err) {} 
    });

    socket.on('buyItem', async ({ type, itemId, price }) => { 
        try { 
            const uname = onlineUsersMap[socket.id]; 
            if(!uname) return; 
            
            const user = await User.findOne({username: uname}); 
            if(user) { 
                let arr = type === 'avatar' ? user.unlockedAvatars : type === 'table' ? user.unlockedTableThemes : user.unlockedCardBacks; 
                if(arr.includes(itemId)) return socket.emit('error', 'უკვე გაქვს!'); 
                
                if(user.coins >= price) { 
                    user.coins -= price; 
                    arr.push(itemId); 
                    
                    if (type === 'avatar') user.avatar = itemId; 
                    else if (type === 'table') user.tableTheme = itemId; 
                    else user.cardBack = itemId; 
                    
                    if (user.unlockedAvatars.length > 20 && !user.achievements.includes('collector')) {
                        user.achievements.push('collector'); 
                    }
                    
                    await user.save(); 
                    socket.emit('successMessage', 'წარმატებით შეიძინე!'); 
                    socket.emit('friendListUpdated'); 
                } else {
                    socket.emit('error', 'არასაკმარისი მონეტები!'); 
                }
            } 
        } catch(err) {} 
    });

    socket.on('equipItem', async ({ type, itemId }) => { 
        try { 
            const uname = onlineUsersMap[socket.id]; 
            if(!uname) return; 
            
            const user = await User.findOne({username: uname}); 
            if(user) { 
                const isVip = user.vipUntil && new Date(user.vipUntil) > new Date(); 
                if (type === 'table' && ['vip_gold', 'vip_diamond'].includes(itemId)) { 
                    if (!isVip) return socket.emit('error', 'მხოლოდ VIP-სთვის!'); 
                    user.tableTheme = itemId; 
                    await user.save(); 
                    socket.emit('successMessage', 'დაყენებულია!'); 
                    return socket.emit('friendListUpdated'); 
                } 
                
                let arr = type === 'avatar' ? user.unlockedAvatars : type === 'table' ? user.unlockedTableThemes : user.unlockedCardBacks; 
                if(arr.includes(itemId)) { 
                    if (type === 'avatar') user.avatar = itemId; 
                    else if (type === 'table') user.tableTheme = itemId; 
                    else user.cardBack = itemId; 
                    
                    await user.save(); 
                    socket.emit('successMessage', 'დაყენებულია!'); 
                    socket.emit('friendListUpdated'); 
                } 
            } 
        } catch(err) {} 
    });

    socket.on('sendFriendRequest', async ({ targetUsername }) => { 
        try { 
            const sName = onlineUsersMap[socket.id]; 
            if(!sName || sName === targetUsername) return; 
            
            const tU = await User.findOne({ username: targetUsername }); 
            if(tU) { 
                if (!tU.friends.includes(sName) && !tU.friendRequests.includes(sName)) { 
                    tU.friendRequests.push(sName); 
                    await tU.save(); 
                    const tS = Object.entries(onlineUsersMap).find(([id, name]) => name === targetUsername); 
                    if(tS) io.to(tS[0]).emit('friendRequestReceived', sName); 
                    socket.emit('successMessage', 'გაიგზავნა!'); 
                } else {
                    socket.emit('error', 'უკვე გაგზავნილია.'); 
                }
            } 
        } catch(err) {} 
    });

    socket.on('acceptFriendRequest', async ({ senderUsername }) => { 
        try { 
            const mName = onlineUsersMap[socket.id]; 
            const me = await User.findOne({ username: mName }); 
            const snd = await User.findOne({ username: senderUsername }); 
            if(me && snd) { 
                me.friendRequests = me.friendRequests.filter(u => u !== senderUsername); 
                if(!me.friends.includes(senderUsername)) me.friends.push(senderUsername); 
                if(!snd.friends.includes(mName)) snd.friends.push(mName); 
                await me.save(); 
                await snd.save(); 
                socket.emit('friendListUpdated'); 
                const ss = Object.entries(onlineUsersMap).find(([id, name]) => name === senderUsername); 
                if(ss) { 
                    io.to(ss[0]).emit('friendListUpdated'); 
                    io.to(ss[0]).emit('successMessage', `${mName}-მ დაგიმატა!`); 
                } 
            } 
        } catch(err) {} 
    });

    socket.on('rejectFriendRequest', async ({ senderUsername }) => { 
        try { 
            const mName = onlineUsersMap[socket.id]; 
            const me = await User.findOne({ username: mName }); 
            if(me) { 
                me.friendRequests = me.friendRequests.filter(u => u !== senderUsername); 
                await me.save(); 
                socket.emit('friendListUpdated'); 
            } 
        } catch(err) {} 
    });

    socket.on('sendInvite', ({ targetSocketId, roomId, password, fromName, gameType }) => { 
        io.to(targetSocketId).emit('receiveInvite', { 
            roomId, 
            password, 
            fromName, 
            senderSocketId: socket.id, 
            gameType: gameType || 'phurti' 
        }); 
    });

    socket.on('rejectInvite', ({ senderSocketId, rejecterName }) => { 
        io.to(senderSocketId).emit('inviteRejected', rejecterName); 
    });

    const handlePlayerLeave = (socketId) => {
        Object.keys(rooms).forEach(roomId => {
            const room = rooms[roomId]; 
            const pIdx = room.players.findIndex(p => p.id === socketId);
            
            if (pIdx !== -1) {
                if (!room.gameStarted) {
                    room.players.splice(pIdx, 1);
                    if (room.players.length === 0) { 
                        delete rooms[roomId]; 
                        if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]); 
                    } else { 
                        io.to(roomId).emit('roomUpdated', room); 
                        checkAutoStart(roomId); 
                    } 
                } else {
                    const p = room.players[pIdx]; 
                    const oName = p.name; 
                    const isOver = room.roundSummary && room.roundSummary.matchWinner;
                    
                    if (!p.isBot && room.isRanked && !isOver) {
                        User.findOne({ username: oName }).then(dbU => {
                            if (dbU) {
                                const isV = dbU.vipUntil && new Date(dbU.vipUntil) > new Date(); 
                                dbU.stats.gamesPlayed++; 
                                dbU.xp = Math.max(0, dbU.xp - (isV ? 5 : 10)); 
                                dbU.stats.totalPointsScored -= (room.targetScore || 0); 
                                dbU.stats.winStreak = 0; 
                                dbU.gameHistory.unshift({ 
                                    roomId: room.id, 
                                    targetScore: room.targetScore || 0, 
                                    myFinalScore: 0, 
                                    isWinner: false, 
                                    playedAt: new Date(), 
                                    opponents: room.players.filter(op=>op.id!==p.id).map(op=>op.name), 
                                    gameType: room.gameType 
                                });
                                if (dbU.gameHistory.length > 30) dbU.gameHistory.pop(); 
                                dbU.save();
                            }
                        }).catch(e => {});
                    }
                    p.isBot = true; 
                    p.name = `${oName} (გავიდა 🤖)`; 
                    p.id = `bot_${Math.random().toString(36).substr(2, 5)}`; 
                    
                    if (room.players.filter(pl => !pl.isBot).length === 0) { 
                        delete rooms[roomId]; 
                        if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]); 
                    } else { 
                        io.to(roomId).emit('gameUpdated', room); 
                        if (room.currentTurn === pIdx && room.gameType === 'phurti') { 
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
        broadcastOnlineUsers(); // 🟢 მოთამაშე გამოვიდა, უნდა განახლდეს ონლაინ სია
    };

    socket.on('reconnectUser', ({ oldSocketId, playerName, roomId }) => {
        if (oldSocketId && disconnectTimeouts[oldSocketId]) { 
            clearTimeout(disconnectTimeouts[oldSocketId]); 
            delete disconnectTimeouts[oldSocketId]; 
        }
        const r = rooms[roomId]; 
        if (r) { 
            const p = r.players.find(pl => pl.name === playerName); 
            if (p) { 
                p.id = socket.id; 
                socket.join(roomId); 
                io.to(roomId).emit('gameUpdated', r); 
            } else {
                socket.emit('roomNotFound'); 
            }
        } else {
            socket.emit('roomNotFound');
        }
    });

    socket.on('joinRoom', async ({ action, roomId, playerName, roomPassword, maxPlayers, targetScore, allowBots, isRanked, gameType }) => {
        if (!roomId || !playerName) return socket.emit('error', 'მონაცემები არასრულია');
        socket.join(roomId); 
        
        let uAv = '😎'; let hTh = 'wood'; let hCB = 'classic'; let uVip = null; let uXp = 0;
        try { 
            const dbU = await User.findOne({ username: playerName }); 
            if (dbU) { 
                uAv = dbU.avatar || '😎'; 
                hTh = dbU.tableTheme || 'wood'; 
                hCB = dbU.cardBack || 'classic'; 
                uVip = dbU.vipUntil; 
                uXp = dbU.xp || 0; 
            } 
        } catch(e) {}

        if (!rooms[roomId]) {
            if (action === 'join' || !maxPlayers) return socket.emit('joinError', 'ასეთი მაგიდა არ არსებობს!');
            rooms[roomId] = { 
                id: roomId, 
                players: [], 
                gameStarted: false, 
                deck: [], 
                tableCards: [], 
                currentTurn: 0, 
                roundSummary: null, 
                lastAction: null, 
                lastCapturerId: null, 
                targetScore: targetScore || 11, 
                maxPlayers: maxPlayers || 4, 
                allowBots: allowBots !== undefined ? allowBots : true, 
                isRanked: allowBots ? false : (isRanked !== undefined ? isRanked : true), 
                readyForNextRound: [], 
                turnExpiresAt: null, 
                password: roomPassword ? roomPassword.trim() : null, 
                isPrivate: !!roomPassword, 
                hostTheme: hTh, 
                hostCardBack: hCB, 
                gameType: gameType || 'phurti', 
                damkaBoard: null, 
                lastDamkaMove: null 
            };
        }
        
        const r = rooms[roomId];
        if (r.isPrivate && !r.gameStarted && !r.players.some(p => p.name === playerName) && r.password !== roomPassword?.trim()) {
            return socket.emit('joinError', 'არასწორი ოთახის პაროლი!');
        }
        
        const pEx = r.players.find(p => p.name === playerName);
        if (pEx) { 
            pEx.id = socket.id; 
            pEx.avatar = uAv; 
            pEx.vipUntil = uVip; 
            pEx.xp = uXp; 
            if (r.gameStarted) socket.emit('gameStarted', r); 
            else socket.emit('roomUpdated', r); 
            broadcastActiveRooms(); 
            return; 
        }
        
        if (r.players.length >= r.maxPlayers && !r.gameStarted) {
            return socket.emit('joinError', 'ოთახი უკვე სავსეა!');
        }
        
        r.players.push({ 
            id: socket.id, 
            name: playerName, 
            avatar: uAv, 
            vipUntil: uVip, 
            xp: uXp, 
            cards: [], 
            captured: [], 
            totalScore: 0, 
            isBot: false, 
            achievementsEarned: [] 
        });
        
        io.to(roomId).emit('roomUpdated', r); 
        broadcastActiveRooms();
        checkAutoStart(roomId); 
    });

    socket.on('tryFindMatch', async ({ playerName, gameType, maxPlayers, isRanked }) => {
        if (!playerName) return;
        let foundRoomId = null;
        for (const rId in rooms) {
            const r = rooms[rId];
            if (!r.gameStarted && !r.isPrivate && r.gameType === gameType && r.isRanked === isRanked && r.players.length < r.maxPlayers && !r.allowBots) {
                if (gameType === 'damka' || r.maxPlayers === maxPlayers) { 
                    foundRoomId = rId; 
                    break; 
                }
            }
        }
        
        if (foundRoomId) {
            const room = rooms[foundRoomId];
            if (room.players.find(p => p.name === playerName)) return; 
            
            let uAv = '😎'; let uVip = null; let uXp = 0;
            try { 
                const dbU = await User.findOne({ username: playerName }); 
                if (dbU) { 
                    uAv = dbU.avatar || '😎'; 
                    uVip = dbU.vipUntil; 
                    uXp = dbU.xp || 0; 
                } 
            } catch(e) {}
            
            room.players.push({ 
                id: socket.id, 
                name: playerName, 
                avatar: uAv, 
                vipUntil: uVip, 
                xp: uXp, 
                cards: [], 
                captured: [], 
                totalScore: 0, 
                isBot: false, 
                achievementsEarned: [] 
            });
            
            socket.join(foundRoomId); 
            io.to(foundRoomId).emit('roomUpdated', room); 
            broadcastActiveRooms();
            socket.emit('joinedMatchedRoom', foundRoomId);
            checkAutoStart(foundRoomId); 
        }
    });

    socket.on('getLiveRooms', () => broadcastActiveRooms());
    
    socket.on('updateConfig', ({ roomId, targetScore, maxPlayers, allowBots, isRanked }) => {
        const r = rooms[roomId]; 
        if (!r || r.gameStarted || (r.players[0] && r.players[0].id !== socket.id)) return;
        
        r.targetScore = targetScore; 
        r.maxPlayers = maxPlayers; 
        r.allowBots = allowBots; 
        r.isRanked = allowBots ? false : (isRanked !== undefined ? isRanked : r.isRanked);
        
        if (r.players.length > maxPlayers) r.players = r.players.slice(0, maxPlayers);
        
        io.to(roomId).emit('roomUpdated', r); 
        broadcastActiveRooms();
        checkAutoStart(roomId); 
    });

    socket.on('leaveRoom', () => { 
        handlePlayerLeave(socket.id); 
        socket.rooms.forEach(r => { 
            if (r !== socket.id) socket.leave(r); 
        }); 
    });
    
    socket.on('sendMessage', ({ roomId, message }) => { 
        const r = rooms[roomId]; 
        if (r) { 
            const p = r.players.find(pl => pl.id === socket.id); 
            if (p) {
                io.to(roomId).emit('receiveMessage', { 
                    sender: p.name, 
                    senderId: p.id, 
                    isVip: p.vipUntil, 
                    text: message, 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                }); 
            } 
        } 
    });
    
    socket.on('sendEmote', ({ roomId, emote }) => { 
        socket.to(roomId).emit('receiveEmote', { playerId: socket.id, emote }); 
    });

    socket.on('startGame', ({ roomId }) => { 
        const room = rooms[roomId];
        if (!room || room.gameStarted) return;
        if (!room.allowBots && room.players.length < room.maxPlayers) {
            return socket.emit('error', `საჭიროა ${room.maxPlayers} მოთამაშე!`); // 🟢 აქ დაბრუნდა დაცვის მექანიზმი
        }
        startGameLogic(roomId); 
    });

    socket.on('playCard', ({ roomId, cardFromHand, cardsFromTable }) => {
        const r = rooms[roomId]; 
        if (!r || !r.gameStarted || r.gameType !== 'phurti') return;
        const p = r.players[r.currentTurn]; 
        if (p.id !== socket.id) return socket.emit('error', 'ახლა შენი სვლა არ არის!');
        
        if (cardsFromTable && cardsFromTable.length > 0) {
            if (!isValidCapture(cardFromHand, cardsFromTable)) return socket.emit('error', 'არასწორი მოჭრა!');
            if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
            
            if (r.isRanked && cardFromHand.rank === 'J' && cardsFromTable.length >= 4 && !p.achievementsEarned.includes('sweeper')) {
                p.achievementsEarned.push('sweeper');
            }
            
            p.cards = p.cards.filter(c => !(c.rank === cardFromHand.rank && c.suit === cardFromHand.suit)); 
            p.captured.push(cardFromHand, ...cardsFromTable);
            
            const tIds = cardsFromTable.map(c => `${c.rank}${c.suit}`); 
            r.tableCards = r.tableCards.filter(c => !tIds.includes(`${c.rank}${c.suit}`));
            
            r.lastAction = { playerName: p.name, isVip: p.vipUntil, cardFromHand, cardsFromTable, type: 'CAPTURE' }; 
            r.lastCapturerId = p.id; 
        } else {
            if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
            p.cards = p.cards.filter(c => !(c.rank === cardFromHand.rank && c.suit === cardFromHand.suit)); 
            r.tableCards.push(cardFromHand);
            r.lastAction = { playerName: p.name, isVip: p.vipUntil, cardFromHand, cardsFromTable: [], type: 'DISCARD' };
        }
        handleTurnTransition(r, roomId);
    });

    socket.on('playDamkaMove', ({ roomId, from, to }) => { 
        const res = processDamkaMove(roomId, socket.id, from, to, io); 
        if (res && res.error) socket.emit('error', res.error); 
    });
    
    socket.on('surrender', ({ roomId }) => {
        const r = rooms[roomId]; 
        if (!r || !r.gameStarted) return;
        const sIdx = r.players.findIndex(p => p.id === socket.id); 
        if (sIdx === -1) return; 
        const s = r.players[sIdx];
        
        let wName = null;
        if (r.gameType === 'damka') { 
            const win = r.players.find(p => p.id !== socket.id); 
            wName = win ? win.name : 'მოწინააღმდეგე'; 
        } else { 
            let mS = -1; 
            r.players.forEach(p => { 
                if (p.id !== socket.id && p.totalScore > mS) { 
                    mS = p.totalScore; 
                    wName = p.name; 
                } 
            }); 
            if (!wName) { 
                const alt = r.players.find(p => p.id !== socket.id); 
                wName = alt ? alt.name : 'მოწინააღმდეგე'; 
            } 
        }
        
        r.roundSummary = { matchWinner: wName, surrendered: s.name }; 
        if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
        broadcastOnlineUsers(); // 🟢 მოთამაშემ დანებდა, ონლაინ სია განახლდეს
        
        if (r.isRanked) { 
            r.players.forEach(async (p) => {
                if (p.isBot) return; 
                try {
                    const isWin = p.name === wName; 
                    const dbU = await User.findOne({ username: p.name });
                    if (dbU) {
                        const isV = dbU.vipUntil && new Date(dbU.vipUntil) > new Date(); 
                        let eX = isWin ? (isV ? 35 : 25) : (isV ? -5 : -10); 
                        let eC = isWin ? (isV ? 75 : 50) : (isV ? -25 : -50);
                        if (p.name === s.name) { eX -= 10; eC -= 20; }
                        
                        if (isWin) { 
                            dbU.stats.gamesWon++; 
                            dbU.stats.winStreak = (dbU.stats.winStreak || 0) + 1; 
                            if (dbU.stats.winStreak >= 10 && !dbU.achievements.includes('legionnaire')) dbU.achievements.push('legionnaire'); 
                            if (!dbU.achievements.includes('first_win')) dbU.achievements.push('first_win'); 
                            if (dbU.stats.gamesWon >= 100 && !dbU.achievements.includes('veteran')) dbU.achievements.push('veteran'); 
                        } else {
                            dbU.stats.winStreak = 0; 
                        }
                        
                        dbU.xp = Math.max(0, dbU.xp + eX); 
                        dbU.coins = Math.max(0, (dbU.coins || 0) + eC);
                        let lT = dbU.level * 1000; 
                        while (dbU.xp >= lT) { 
                            dbU.xp -= lT; 
                            dbU.level++; 
                            lT = dbU.level * 1000; 
                        }
                        dbU.stats.gamesPlayed++;
                        dbU.gameHistory.unshift({ 
                            roomId: r.id, 
                            targetScore: r.targetScore || 11, 
                            myFinalScore: p.totalScore || 0, 
                            isWinner: isWin, 
                            playedAt: new Date(), 
                            opponents: r.players.filter(op=>op.id!==p.id).map(op=>op.name), 
                            gameType: r.gameType 
                        });
                        
                        if (dbU.gameHistory.length > 30) dbU.gameHistory.pop(); 
                        await dbU.save();
                    }
                } catch (e) {}
            });
        }
        io.to(roomId).emit('gameUpdated', r);
    });
    
    socket.on('nextRoundReady', ({ roomId }) => {
        const r = rooms[roomId]; 
        if (!r || !r.gameStarted || !r.roundSummary || r.roundSummary.matchWinner) return;
        
        if (!r.readyForNextRound.includes(socket.id)) r.readyForNextRound.push(socket.id);
        
        if (r.readyForNextRound.length >= r.players.length) {
            r.deck = createDeck(); 
            r.tableCards = [];
            while (r.tableCards.length < 4) { 
                let c = r.deck.shift(); 
                if (c.rank === 'J') r.deck.push(c); 
                else r.tableCards.push(c); 
            }
            r.players.forEach(p => { 
                p.cards = r.deck.splice(0, 4); 
                p.captured = []; 
                p.achievementsEarned = []; 
            });
            
            r.dealerIndex = (r.dealerIndex + 1) % r.players.length; 
            r.currentTurn = r.dealerIndex; 
            r.lastAction = null; 
            r.roundSummary = null; 
            r.lastCapturerId = null; 
            r.readyForNextRound = [];
            
            startTurnTimer(r, roomId); 
            io.to(roomId).emit('gameUpdated', r); 
            checkAndTriggerBotTurn(r, roomId);
        } else {
            io.to(roomId).emit('gameUpdated', r);
        }
    });

    socket.on('disconnect', () => { 
        delete onlineUsersMap[socket.id]; 
        broadcastOnlineUsers(); 
        disconnectTimeouts[socket.id] = setTimeout(() => { 
            handlePlayerLeave(socket.id); 
            delete disconnectTimeouts[socket.id]; 
        }, 5000); 
    });
});

function handleTurnTransition(room, roomId) {
    if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
    if (room.gameType === 'phurti') {
        const allEmpty = room.players.every(p => p.cards.length === 0);
        if (allEmpty) {
            if (room.deck.length > 0) { 
                room.players.forEach(p => p.cards = room.deck.splice(0, 4)); 
                if (room.dealerIndex === undefined) room.dealerIndex = 0; 
                room.currentTurn = room.dealerIndex; 
                startTurnTimer(room, roomId); 
                io.to(roomId).emit('gameUpdated', room); 
                checkAndTriggerBotTurn(room, roomId); 
            } else {
                if (room.tableCards.length > 0 && room.lastCapturerId) { 
                    const lc = room.players.find(p => p.id === room.lastCapturerId); 
                    if (lc) { 
                        lc.captured.push(...room.tableCards); 
                        room.tableCards = []; 
                    } 
                }
                calculateRoundScores(room);
                
                if (room.isRanked && room.roundSummary.diamond10Winner !== "-") { 
                    const p = room.players.find(pl => pl.name === room.roundSummary.diamond10Winner); 
                    if (p && !p.isBot && !p.achievementsEarned.includes('diamond_10')) {
                        p.achievementsEarned.push('diamond_10'); 
                    }
                }
                if (room.isRanked && room.roundSummary.club2Winner !== "-") { 
                    const p = room.players.find(pl => pl.name === room.roundSummary.club2Winner); 
                    if (p && !p.isBot && !p.achievementsEarned.includes('club_2')) {
                        p.achievementsEarned.push('club_2'); 
                    }
                }
                
                room.readyForNextRound = []; 
                room.players.forEach(p => { 
                    if (p.isBot) room.readyForNextRound.push(p.id); 
                });
                
                let mS = -1; 
                let winP = null; 
                room.players.forEach(p => { 
                    if (p.totalScore > mS) { 
                        mS = p.totalScore; 
                        winP = p; 
                    } 
                });
                
                if (mS >= room.targetScore) {
                    room.roundSummary.matchWinner = winP.name; 
                    broadcastOnlineUsers(); // 🟢 თამაში დასრულდა
                    
                    if (room.isRanked) {
                        room.players.forEach(async (p) => {
                            if (p.isBot) return; 
                            try {
                                const isW = p.name === room.roundSummary.matchWinner; 
                                const mA = p.achievementsEarned || []; 
                                const dbU = await User.findOne({ username: p.name });
                                if (dbU) {
                                    const isV = dbU.vipUntil && new Date(dbU.vipUntil) > new Date(); 
                                    let eX = isW ? (isV ? 35 : 25) : (isV ? -5 : -10); 
                                    let eC = isW ? (isV ? 75 : 50) : (isV ? -25 : -50);
                                    
                                    if (isW) { 
                                        dbU.stats.gamesWon++; 
                                        dbU.stats.winStreak = (dbU.stats.winStreak || 0) + 1; 
                                        if (dbU.stats.winStreak >= 10 && !dbU.achievements.includes('legionnaire')) dbU.achievements.push('legionnaire'); 
                                        if (!dbU.achievements.includes('first_win')) dbU.achievements.push('first_win'); 
                                        if (dbU.stats.gamesWon >= 100 && !dbU.achievements.includes('veteran')) dbU.achievements.push('veteran');
                                        
                                        if (!dbU.achievementProgress) dbU.achievementProgress = { diamond_10: 0, club_2: 0, sweeper: 0 };
                                        
                                        if (mA.includes('diamond_10') && !dbU.achievements.includes('diamond_10')) { 
                                            dbU.achievementProgress.diamond_10 = (dbU.achievementProgress.diamond_10 || 0) + 1; 
                                            if (dbU.achievementProgress.diamond_10 >= 50) dbU.achievements.push('diamond_10'); 
                                        }
                                        if (mA.includes('club_2') && !dbU.achievements.includes('club_2')) { 
                                            dbU.achievementProgress.club_2 = (dbU.achievementProgress.club_2 || 0) + 1; 
                                            if (dbU.achievementProgress.club_2 >= 50) dbU.achievements.push('club_2'); 
                                        }
                                        if (mA.includes('sweeper') && !dbU.achievements.includes('sweeper')) { 
                                            dbU.achievementProgress.sweeper = (dbU.achievementProgress.sweeper || 0) + 1; 
                                            if (dbU.achievementProgress.sweeper >= 50) dbU.achievements.push('sweeper'); 
                                        }
                                    } else {
                                        dbU.stats.winStreak = 0; 
                                    }
                                    
                                    if (dbU.dailyQuests && dbU.dailyQuests.length > 0) {
                                        dbU.dailyQuests.forEach(q => {
                                            if (q.isCompleted) return;
                                            if (q.questId === 'play_ranked' && room.isRanked) q.progress++; 
                                            if (q.questId === 'win_ranked' && room.isRanked && isW) q.progress++; 
                                            if (q.questId === 'get_10_diamond' && mA.includes('diamond_10')) q.progress++; 
                                            if (q.questId === 'get_2_club' && mA.includes('club_2')) q.progress++; 
                                            if (q.questId === 'play_5_games') q.progress++; 
                                            if (q.questId === 'win_3_games' && isW) q.progress++; 
                                            if (q.questId === 'sweep_table' && mA.includes('sweeper')) q.progress++;
                                            
                                            if (q.progress >= q.target) { 
                                                q.progress = q.target; 
                                                q.isCompleted = true; 
                                                eX += q.xpReward; 
                                                eC += 50; 
                                            }
                                        }); 
                                        dbU.markModified('dailyQuests');
                                    }
                                    
                                    dbU.xp = Math.max(0, dbU.xp + eX); 
                                    dbU.coins = Math.max(0, (dbU.coins || 0) + eC);
                                    let lT = dbU.level * 1000; 
                                    while (dbU.xp >= lT) { 
                                        dbU.xp -= lT; 
                                        dbU.level++; 
                                        lT = dbU.level * 1000; 
                                    }
                                    dbU.stats.gamesPlayed++; 
                                    dbU.stats.totalPointsScored += p.totalScore;
                                    dbU.gameHistory.unshift({ 
                                        roomId: room.id, 
                                        targetScore: room.targetScore, 
                                        myFinalScore: p.totalScore, 
                                        isWinner: isW, 
                                        playedAt: new Date(), 
                                        opponents: room.players.filter(op=>op.id!==p.id).map(op=>op.name), 
                                        gameType: 'phurti' 
                                    });
                                    
                                    if (dbU.gameHistory.length > 30) dbU.gameHistory.pop(); 
                                    await dbU.save();
                                }
                            } catch (e) {}
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
}

function startTurnTimer(room, roomId) {
    if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
    if (!room.gameStarted) return;
    const aP = room.players[room.currentTurn]; 
    if (aP && aP.isBot) { 
        room.turnExpiresAt = null; 
        return; 
    }
    
    room.turnExpiresAt = Date.now() + 30000; 
    roomTimers[roomId] = setTimeout(() => {
        if (!room.gameStarted || room.currentTurn === null) return;
        const tP = room.players[room.currentTurn]; 
        if (!tP || tP.isBot) return;
        
        if (room.gameType === 'phurti') {
            if (tP.cards.length === 0) { 
                handleTurnTransition(room, roomId); 
                return; 
            }
            const aC = tP.cards[0]; 
            tP.cards = tP.cards.filter(c => !(c.rank === aC.rank && c.suit === aC.suit));
            room.tableCards.push(aC); 
            room.lastAction = { 
                playerName: `${tP.name} (🕒)`, 
                isVip: tP.vipUntil, 
                cardFromHand: aC, 
                cardsFromTable: [], 
                type: 'DISCARD' 
            };
            handleTurnTransition(room, roomId);
        } else if (room.gameType === 'damka') {
            room.currentTurn = (room.currentTurn + 1) % 2; 
            startTurnTimer(room, roomId); 
            io.to(roomId).emit('gameUpdated', room); 
            checkAndTriggerBotTurn(room, roomId);
        }
    }, 30000);
}

function checkAndTriggerBotTurn(room, roomId) {
    if (!room || !room.gameStarted) return;
    const aP = room.players[room.currentTurn];
    if (aP && aP.isBot) {
        setTimeout(() => {
            if (room.gameType === 'phurti') {
                const bM = getBestMove(aP.cards, room.tableCards); 
                if (!bM) return;
                
                aP.cards = aP.cards.filter(c => !(c.rank === bM.cardFromHand.rank && c.suit === bM.cardFromHand.suit));
                room.lastAction = { 
                    playerName: aP.name, 
                    isVip: null, 
                    cardFromHand: bM.cardFromHand, 
                    cardsFromTable: bM.cardsFromTable, 
                    type: bM.type 
                };
                
                if (bM.type === 'CAPTURE' && bM.cardsFromTable.length > 0) {
                    aP.captured.push(bM.cardFromHand, ...bM.cardsFromTable); 
                    const tIds = bM.cardsFromTable.map(c => `${c.rank}${c.suit}`);
                    room.tableCards = room.tableCards.filter(c => !tIds.includes(`${c.rank}${c.suit}`)); 
                    room.lastCapturerId = aP.id; 
                } else {
                    room.tableCards.push(bM.cardFromHand);
                }
                
                handleTurnTransition(room, roomId);
            } else if (room.gameType === 'damka') {
                const bM = getDamkaBotMove(room.damkaBoard, room.currentTurn, room.multiCapturePiece);
                if (bM) processDamkaMove(roomId, aP.id, bM.from, bM.to, io);
            }
        }, 1500); 
    }
}

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`🚀 სერვერი: ${PORT}`));