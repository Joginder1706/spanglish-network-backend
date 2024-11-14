import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import cors from "cors"
dotenv.config();

const app = express();
app.use(express.json());
const allowedOrigins = ['http://localhost:3000', 'exp://192.168.1.25:8081'];
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// Routes
app.use('/api', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
