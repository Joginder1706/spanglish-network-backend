import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authenticateToken from './middleware/auth.js';

const executeQuery = (query, params = [], callback) => {
    if (db.state === "disconnected") {
        console.log("Database disconnected, reconnecting...");
        db.connect((err) => {
            if (err) {
                console.error("Failed to reconnect to the database:", err);
                return callback({
                    error: {
                        message: "Failed to reconnect to the database.",
                        details: err.message,
                        code: err.code,
                        stack: err.stack,
                    },
                });
            }
            db.query(query, params, callback);
        });
    } else {
        db.query(query, params, callback);
    }
};

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
        return res.status(400).json({ message: "Please fill in all details properly" });
    }

    try {
        // Check if user already exists
        executeQuery('SELECT * FROM users WHERE email = ?', [email], async (error, result) => {
            if (error) {
                return res.status(500).json({ message: error.message });
            }
            if (result.length) {
                return res.status(400).json({ message: "User already exists" });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into database
            executeQuery(
                'INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)',
                [username, email, phone, hashedPassword],
                (insertError) => {
                    if (insertError) {
                        return res.status(500).json({ message: insertError.message });
                    }
                    res.status(201).json({ message: "User registered successfully" });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        executeQuery('SELECT * FROM users WHERE email = ?', [email], async (error, result) => {
            if (error) {
                return res.status(500).json({ message: error.message });
            }
            if (!result.length) {
                return res.status(400).json({ message: "Invalid email or password" });
            }

            const user = result[0];
            // Compare password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid email or password" });
            }

            // Generate JWT
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const data = {
                username: user.username,
                email: user.email,
                phone: user.phone,
                token: token
            };
            res.status(200).json({ message: "Login successful", data });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    const token = req.body.token;
    executeQuery('INSERT INTO blacklist (token) VALUES (?)', [token], (error) => {
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.status(200).json({ message: "Logout successful" });
    });
});

// Profile Route
router.get('/profile', authenticateToken, (req, res) => {
    res.status(200).json({ message: "Profile data", user: req.user });
});

export default router;
