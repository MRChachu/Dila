const express = require('express');
const router = express.Router();
const User = require('../models/User');
const nodemailer = require('nodemailer'); // 🟢 შემოვამატეთ მეილების მოდული

const ALL_DAILY_QUESTS = [
  { questId: 'play_ranked', title: 'ითამაშე 3 რეიტინგული მატჩი', target: 3, xpReward: 300 },
  { questId: 'win_ranked', title: 'მოიგე 2 რეიტინგული მატჩი', target: 2, xpReward: 500 },
  { questId: 'get_10_diamond', title: 'მოიპოვე 10 აგური მატჩში', target: 1, xpReward: 400 },
  { questId: 'get_2_club', title: 'მოიპოვე 2 ჯვარი მატჩში', target: 1, xpReward: 400 },
  { questId: 'play_5_games', title: 'ითამაშე 5 მატჩი', target: 5, xpReward: 350 },
  { questId: 'win_3_games', title: 'მოიგე 3 მატჩი', target: 3, xpReward: 600 },
  { questId: 'sweep_table', title: 'გაასუფთავე მაგიდა (ვალეტით)', target: 1, xpReward: 300 }
];

// 🟢 მეილის გამგზავნის კონფიგურაცია
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
    if (!regex.test(password)) return res.status(400).json({ message: 'პაროლი არ არის საკმარისად ძლიერი!' });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'ეს სახელი უკვე დაკავებულია!' });

    const newUser = new User({ username, email, password }); 
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

    const { password: _, ...userData } = user._doc;
    res.status(200).json({ user: userData, message: 'წარმატებული ავტორიზაცია!' });
  } catch (err) { res.status(500).json({ message: 'სერვერის შეცდომა' }); }
});

// 🟢 1. პაროლის აღდგენა (მეილის რეალური გაგზავნით)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'მომხმარებელი ამ ელ-ფოსტით ვერ მოიძებნა!' });

    // ვქმნით რანდომულ ძლიერ პაროლს (მაგ: a7b8c9d1)
    const tempPassword = Math.random().toString(36).slice(-6) + 'A1';
    user.password = tempPassword;
    await user.save();

    // ვაგზავნით მეილს
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Phurti Arena - პაროლის აღდგენა',
      html: `
        <div style="background:#0a0a0a; color:#fff; padding:20px; font-family:sans-serif; border-radius:10px;">
          <h2 style="color:#eab308;">Phurti Arena</h2>
          <p>მოგესალმებით ${user.username},</p>
          <p>თქვენ მოითხოვეთ პაროლის აღდგენა. თქვენი ახალი დროებითი პაროლია:</p>
          <h3 style="background:#1c1917; padding:10px; display:inline-block; border-radius:5px; border:1px solid #eab308;">${tempPassword}</h3>
          <p>გთხოვთ, სისტემაში შესვლისთანავე შეხვიდეთ პარამეტრებში და შეცვალოთ პაროლი თქვენთვის სასურველით.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'ახალი პაროლი გამოგეგზავნათ ელ-ფოსტაზე!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'მეილის გაგზავნა ვერ მოხერხდა. შეამოწმეთ სერვერის კონფიგურაცია.' });
  }
});

// 🟢 2. პაროლის შეცვლა (Settings-დან)
router.post('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა' });
    if (user.password !== currentPassword) return res.status(400).json({ message: 'მიმდინარე პაროლი არასწორია' });

    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
    if (!regex.test(newPassword)) return res.status(400).json({ message: 'ახალი პაროლი არ არის საკმარისად ძლიერი!' });

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'პაროლი წარმატებით შეიცვალა!' });
  } catch (err) { res.status(500).json({ message: 'სერვერის შეცდომა' }); }
});

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

router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find().sort({ 'stats.gamesWon': -1, xp: -1 }).limit(10).select('-password');
    res.json(topUsers);
  } catch (err) { res.status(500).json({ message: 'შეცდომა' }); }
});

module.exports = router;