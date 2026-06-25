const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true }, // ✨ იმეილი რეგისტრაციისთვის
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  
  // 📊 გლობალური სტატისტიკა
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalPointsScored: { type: Number, default: 0 }
  },
  
  // 📜 მატჩების ისტორიის მასივი
  gameHistory: [{
    roomId: String,
    targetScore: Number,
    myFinalScore: Number,
    isWinner: Boolean,
    playedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', UserSchema);