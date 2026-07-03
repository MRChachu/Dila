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
  // 🟢 აქ დაემატა მიღწევების (ბეჯების) მასივი
  achievements: [
    { type: String }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);