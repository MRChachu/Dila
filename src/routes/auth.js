const express = require('express');
const router = express.Router();
const User = require('../models/User');

const ALL_DAILY_QUESTS = [
  { questId: 'play_ranked', title: 'ითამაშე 3 რეიტინგული მატჩი', target: 3, xpReward: 300 },
  { questId: 'win_ranked', title: 'მოიგე 2 რეიტინგული მატჩი', target: 2, xpReward: 500 },
  { questId: 'get_10_diamond', title: 'მოიპოვე 10 აგური მატჩში', target: 1, xpReward: 400 }
];

router.post('/register', async (req, res) => {
  try {
    const { username, dateOfBirth, secretWord, password } = req.body;
    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
    if (!regex.test(password)) return res.status(400).json({ message: 'პაროლი არ არის საკმარისად ძლიერი!' });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'ეს სახელი უკვე დაკავებულია!' });

    const newUser = new User({ username, dateOfBirth, secretWord, password }); 
    await newUser.save();
    const { password: _, ...userData } = newUser._doc;
    res.status(201).json({ user: userData, message: 'წარმატებით დარეგისტრირდით!' });
  } catch (err) { res.status(500).json({ message: 'სერვერის შეცდომა' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || user.password !== password) return res.status(400).json({ message: 'მომხმარებელი ან პაროლი არასწორია!' });
    
    // 🟢 ბანის (დაბლოკვის) შემოწმება
    if (user.isBanned) return res.status(403).json({ message: 'თქვენი ანგარიში დაბლოკილია ადმინისტრატორის მიერ!' });

    const { password: _, ...userData } = user._doc;
    res.status(200).json({ user: userData, message: 'წარმატებული ავტორიზაცია!' });
  } catch (err) { res.status(500).json({ message: 'სერვერის შეცდომა' }); }
});

router.post('/verify-recovery', async (req, res) => {
  try {
    const { username, dateOfBirth, secretWord } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა!' });
    if (user.dateOfBirth !== dateOfBirth || user.secretWord !== secretWord) {
        return res.status(400).json({ message: 'დაბადების თარიღი ან საიდუმლო სიტყვა არასწორია!' });
    }
    res.status(200).json({ message: 'მონაცემები სწორია.' });
  } catch (err) { res.status(500).json({ message: 'შეცდომა' }); }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { username, dateOfBirth, secretWord, newPassword } = req.body;
    const user = await User.findOne({ username });
    if (!user || user.dateOfBirth !== dateOfBirth || user.secretWord !== secretWord) {
        return res.status(400).json({ message: 'მონაცემები არასწორია!' });
    }
    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
    if (!regex.test(newPassword)) return res.status(400).json({ message: 'ახალი პაროლი არ არის საკმარისად ძლიერი!' });
    user.password = newPassword; await user.save();
    res.status(200).json({ message: 'პაროლი შეიცვალა!' });
  } catch (err) { res.status(500).json({ message: 'შეცდომა' }); }
});

router.post('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const user = await User.findOne({ username });
    if (!user || user.password !== currentPassword) return res.status(400).json({ message: 'მიმდინარე პაროლი არასწორია' });
    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
    if (!regex.test(newPassword)) return res.status(400).json({ message: 'ახალი პაროლი არ არის საკმარისად ძლიერი!' });
    user.password = newPassword; await user.save();
    res.status(200).json({ message: 'პაროლი შეიცვალა!' });
  } catch (err) { res.status(500).json({ message: 'შეცდომა' }); }
});

// 🟢 ლიდერბორდი (აჩვენებს მხოლოდ დაუბლოკავ მოთამაშეებს)
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find({ isBanned: false })
      .sort({ xp: -1, 'stats.gamesWon': -1 }) // ჯერ XP-ით სორტირდება
      .limit(10)
      .select('-password -secretWord -dateOfBirth');
    res.json(topUsers);
  } catch (err) { res.status(500).json({ message: 'შეცდომა' }); }
});

// ============================================
// 🛡️ ადმინ პანელის მარშრუტები 🛡️
// ============================================
const ADMIN_PASS = 'PhurtiAdmin2026'; // შენი საიდუმლო პაროლი ადმინ პანელისთვის

router.post('/admin/users', async (req, res) => {
  try {
    if (req.body.adminPass !== ADMIN_PASS) return res.status(403).json({ message: 'არასწორი პაროლი!' });
    const users = await User.find().sort({ createdAt: -1 }).select('username password coins xp isBanned dateOfBirth secretWord');
    res.json(users);
  } catch (err) { res.status(500).json({ message: 'შეცდომა' }); }
});

router.post('/admin/update', async (req, res) => {
  try {
    const { adminPass, targetUser, action, amount } = req.body;
    if (adminPass !== ADMIN_PASS) return res.status(403).json({ message: 'არასწორი პაროლი!' });
    
    const user = await User.findOne({ username: targetUser });
    if (!user) return res.status(404).json({ message: 'მოთამაშე ვერ მოიძებნა' });

    if (action === 'addCoins') user.coins += Number(amount);
    if (action === 'addXP') user.xp += Number(amount);
    if (action === 'ban') user.isBanned = true;
    if (action === 'unban') user.isBanned = false;

    await user.save();
    res.json({ message: 'წარმატებით განახლდა!' });
  } catch (err) { res.status(500).json({ message: 'შეცდომა' }); }
});

// 🟢 პროფილის ჩატვირთვა 
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'მოთამაშე ვერ მოიძებნა' });
    const now = new Date();
    if (!user.dailyQuests || user.dailyQuests.length === 0 || (user.lastQuestGeneration && (now - new Date(user.lastQuestGeneration)) > 24 * 60 * 60 * 1000)) {
        const shuffled = [...ALL_DAILY_QUESTS].sort(() => 0.5 - Math.random());
        user.dailyQuests = shuffled.slice(0, 3).map(q => ({ questId: q.questId, title: q.title, target: q.target, progress: 0, xpReward: q.xpReward, isCompleted: false }));
        user.lastQuestGeneration = now;
        await user.save(); 
    }
    const { password, ...userData } = user._doc;
    res.json(userData);
  } catch (err) { res.status(500).json({ message: 'შეცდომა' }); }
});

module.exports = router;