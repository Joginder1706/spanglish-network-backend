import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const authenticateToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: "Access denied, token missing" });
    }

    try {
        // Check if token is blacklisted
        const [blacklistedToken] = await db.query('SELECT * FROM blacklist WHERE token = ?', [token]);
        if (blacklistedToken.length) {
            return res.status(403).json({ message: "Token has been blacklisted, please log in again" });
        }

        // Verify JWT token
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ message: "Invalid token" });
            req.user = user;
            next();
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export default authenticateToken;

