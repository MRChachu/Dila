const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 🎯 ყოველდღიური მისიების ბაზა
const ALL_DAILY_QUESTS = [
  { questId: 'play_ranked', title: 'ითამაშე 3 რეიტინგული მატჩი', target: 3, xpReward: 300 },
  { questId: 'win_ranked', title: 'მოიგე 2 რეიტინგული მატჩი', target: 2, xpReward: 500 },
  { questId: 'get_10_diamond', title: 'მოიპოვე 10 აგური მატჩში', target: 1, xpReward: 400 },
  { questId: 'get_2_club', title: 'მოიპოვე 2 ჯვარი მატჩში', target: 1, xpReward: 400 },
  { questId: 'play_5_games', title: 'ითამაშე 5 მატჩი', target: 5, xpReward: 350 },
  { questId: 'win_3_games', title: 'მოიგე 3 მატჩი', target: 3, xpReward: 600 },
  { questId: 'sweep_table', title: 'გაასუფთავე მაგიდა (ვალეტით)', target: 1, xpReward: 300 }
];

// 🟢 1. რეგისტრაცია
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'ეს სახელი უკვე დაკავებულია!' });
    }

    const newUser = new User({ username, email, password }); 
    await newUser.save();

    const { password: _, ...userData } = newUser._doc;
    res.status(201).json({ user: userData, message: 'წარმატებით დარეგისტრირდით!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'სერვერის შეცდომა რეგისტრაციისას' });
  }
});

// 🟢 2. ავტორიზაცია (Login)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'მოთამაშე არ მოიძებნა!' });
    }

    if (user.password !== password) { 
      return res.status(400).json({ message: 'პაროლი არასწორია!' });
    }

    const { password: _, ...userData } = user._doc;
    res.status(200).json({ user: userData, message: 'წარმატებული ავტორიზაცია!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'სერვერის შეცდომა ლოგინისას' });
  }
});

// 🟢 3. მოთამაშის პროფილის და სტატისტიკის გამოთხოვა
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'მოთამაშე ვერ მოიძებნა' });
    
    const now = new Date();
    
    // 🎯 თუ მისიები არ აქვს, ან 24 საათი გავიდა -> ვუგენერირებთ 3 ახალს ლოგინისას!
    if (!user.dailyQuests || user.dailyQuests.length === 0 || (user.lastQuestGeneration && (now - new Date(user.lastQuestGeneration)) > 24 * 60 * 60 * 1000)) {
        const shuffled = [...ALL_DAILY_QUESTS].sort(() => 0.5 - Math.random());
        user.dailyQuests = shuffled.slice(0, 3).map(q => ({
            questId: q.questId, title: q.title, target: q.target, progress: 0, xpReward: q.xpReward, isCompleted: false
        }));
        user.lastQuestGeneration = now;
        await user.save(); // ვინახავთ ახალ მისიებს ბაზაში
    }

    // ვიზუალს ვუგზავნით განახლებულ მონაცემებს
    const { password, ...userData } = user._doc;
    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'სერვერის შეცდომა პროფილის ჩატვირთვისას' });
  }
});

// 🟢 4. გლობალური ლიდერბორდის (TOP 10) გაგზავნა
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ 'stats.gamesWon': -1, xp: -1 })
      .limit(10)
      .select('-password');
      
    res.json(topUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'სერვერის შეცდომა ლიდერბორდის ჩატვირთვისას' });
  }
});

module.exports = router;