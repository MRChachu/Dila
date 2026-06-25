const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // დარწმუნდი რომ გაქვს დაინსტალირებული: npm install bcryptjs
const User = require('../models/User');

// რეგისტრაცია
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // შემოწმება ხომ არ არსებობს უკვე
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: 'მომხმარებელი ამ სახელით უკვე არსებობს' });

        // პაროლის დაშიფვრა
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ user: { username, email } });
    } catch (err) {
        console.error("რეგისტრაციის შეცდომა:", err);
        res.status(500).json({ error: 'სერვერის შეცდომა რეგისტრაციისას' });
    }
});

// შესვლა (Login)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // მომხმარებლის ძიება
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'მომხმარებელი არ მოიძებნა' });

        // პაროლის შედარება
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'არასწორი პაროლი' });

        // წარმატებული შესვლა
        res.status(200).json({ 
            user: { username: user.username, email: user.email } 
        });
    } catch (err) {
        console.error("შესვლის შეცდომა:", err);
        res.status(500).json({ error: 'სერვერის შეცდომა შესვლისას' });
    }
});

module.exports = router;