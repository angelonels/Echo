import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/index';
import uploadRouter from './routes/upload';
import chatRouter from './routes/chat';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Set up routes
app.use('/upload', uploadRouter);
app.use('/chat', chatRouter);

// Basic health check
app.get('/', (req, res) => {
  res.send('Echo Walking Skeleton API is running');
});

const startServer = async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
