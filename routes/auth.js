import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import authenticateToken from './middleware/auth.js';
const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
        return res.status(400).json({ message: "fill the details properly" });
    }

    try {
        // Check if user already exists
        const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length) return res.status(400).json({ message: "User already exists" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into database
        await db.query(
            'INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)',
            [username, email, phone, hashedPassword]
        );

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!user.length) return res.status(400).json({ message: "Invalid email or password" });

        // Compare password
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        // Generate JWT
        const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const data = {
            username: user[0].username,
            email: user[0].email,
            phone: user[0].phone,
            token: token
        }
        res.status(200).json({ message: "Login successful", data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Logout Route
router.post('/logout', async (req, res) => {
    const token = req.body.token;
    try {
        await db.query('INSERT INTO blacklist (token) VALUES (?)', [token]);

        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// profile
router.get('/profile', authenticateToken, (req, res) => {
    res.status(200).json({ message: "Profile data", user: req.user });
});

export default router;
