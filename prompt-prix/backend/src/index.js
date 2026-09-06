import express from 'express';
import cors from 'cors';
import agentsRouter from './routes/agents.js';
import gameRouter from './routes/game.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Prompt Prix Backend is running' });
});

// Routes
app.use('/api/agents', agentsRouter);
app.use('/api/games', gameRouter);

app.listen(PORT, () => {
  console.log(`🚀 Prompt Prix Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
