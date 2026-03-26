import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import userRoutes from './routes/users.js';
import societyRoutes from './routes/societies.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Allow web client + React Native (Expo) - mobile apps may have null/undefined origin
app.use(cors({
  origin: (o, cb) => cb(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/societies', societyRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
