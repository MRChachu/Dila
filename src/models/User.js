const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  email: { 
    type: String, 
    required: false,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalPointsScored: { type: Number, default: 0 }
  },
  gameHistory: [
    {
      roomId: { type: String },
      targetScore: { type: Number },
      myFinalScore: { type: Number },
      isWinner: { type: Boolean },
      playedAt: { type: Date, default: Date.now }
    }
  ],
  achievements: [
    { type: String }
  ],
  
  // 🟢 1. ლეველები და გამოცდილება (XP)
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },

  // 🟢 2. ყოველდღიური მისიები (Daily Quests)
  dailyQuests: [
    {
      questId: { type: String },      // მაგ: 'play_ranked', 'win_game'
      title: { type: String },        // მოთამაშისთვის სანახავი ტექსტი
      progress: { type: Number, default: 0 }, // რამდენი შეასრულა
      target: { type: Number },       // რამდენი უნდა შეასრულოს (მაგ: 3)
      xpReward: { type: Number },     // რამდენი XP მიეცემა
      isCompleted: { type: Boolean, default: false }
    }
  ],
  lastQuestGeneration: { type: Date }, // როდის დაგენერირდა ბოლოს მისიები (რომ ყოველდღე განახლდეს)

  // 🟢 3. მეგობრების სისტემა (Friends)
  friends: [
    { type: String } // მეგობრების იუზერნეიმები
  ],
  friendRequests: [
    { type: String } // ვისგან მოუვიდა თხოვნა
  ]

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);