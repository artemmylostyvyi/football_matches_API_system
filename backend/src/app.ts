import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import applicationRoutes from './routes/applicationRoutes';
import matchRoutes from './routes/matchRoutes';

dotenv.config();

const app = express();
const PORT = env.port;

const allowedOrigins = env.corsOrigin.split(',').map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
  }),
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Football Matches API System' });
});

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/tournaments', tournamentRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/matches', matchRoutes);

app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});

export default app;
