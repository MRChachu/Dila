const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 🟢 1. რეგისტრაცია (Register)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // ვამოწმებთ, ხომ არ არსებობს უკვე ასეთი სახელი
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'ეს სახელი უკვე დაკავებულია!' });
    }

    // ვქმნით ახალ მომხმარებელს (საწყისი მონეტებით და XP-ით)
    const newUser = new User({ 
      username, 
      email, 
      password // თუ რეალურ პროექტად უშვებ, აქ ჯობია bcrypt-ით დაიჰეშოს ხოლმე
    }); 
    
    await newUser.save();

    // პაროლის გარეშე ვაბრუნებთ მომხმარებლის ინფორმაციას
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

// 🟢 3. მოთამაშის პროფილის და სტატისტიკის გამოთხოვა (XP, Coins, Achievements)
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'მოთამაშე ვერ მოიძებნა' });
    
    // ვიზუალს ვუგზავნით ყველაფერს, პაროლის გარდა
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
      .sort({ 'stats.gamesWon': -1, xp: -1 }) // ვალაგებთ მოგებების, შემდეგ კი XP-ის მიხედვით
      .limit(10) // ვაგზავნით მხოლოდ საუკეთესო 10-ს
      .select('-password'); // პაროლებს ვმალავთ უსაფრთხოებისთვის
      
    res.json(topUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'სერვერის შეცდომა ლიდერბორდის ჩატვირთვისას' });
  }
});

module.exports = router;