const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  
  // 🟢 ამოვიღეთ required: true, რათა ძველი ექაუნთების შენახვაც უპრობლემოდ მოხდეს
  dateOfBirth: { type: String },
  secretWord: { type: String },
  
  password: { type: String, required: true },
  
  isBanned: { type: Boolean, default: false },
  
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalPointsScored: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 } // 🟢 დაემატა ზედიზედ მოგებების მთვლელი
  },
  gameHistory: [{
      roomId: { type: String },
      targetScore: { type: Number },
      myFinalScore: { type: Number },
      isWinner: { type: Boolean },
      playedAt: { type: Date, default: Date.now },
      opponents: { type: [String], default: [] } // 🟢 დაემატა მოწინააღმდეგეების სია
  }],
  achievements: [{ type: String }],
  achievementProgress: {
    diamond_10: { type: Number, default: 0 },
    club_2: { type: Number, default: 0 },
    sweeper: { type: Number, default: 0 }
  },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  dailyQuests: [{
      questId: { type: String }, title: { type: String }, progress: { type: Number, default: 0 },
      target: { type: Number }, xpReward: { type: Number }, isCompleted: { type: Boolean, default: false }
  }],
  lastQuestGeneration: { type: Date },
  friends: [{ type: String }],
  friendRequests: [{ type: String }],
  coins: { type: Number, default: 0 },
  dailyStreak: { type: Number, default: 0 },
  lastRewardDate: { type: Date, default: null },
  avatar: { type: String, default: '😎' },
  unlockedAvatars: { type: [String], default: ['😎'] },
  tableTheme: { type: String, default: 'wood' },
  unlockedTableThemes: { type: [String], default: ['wood', 'lavender'] },
  cardBack: { type: String, default: 'classic' },
  unlockedCardBacks: { type: [String], default: ['classic'] },
  vipUntil: { type: Date, default: null }
  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);