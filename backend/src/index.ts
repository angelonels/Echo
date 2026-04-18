import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/index';
import uploadRouter from './routes/upload';
import chatRouter from './routes/chat';
import analyticsRouter from './routes/analytics';
import { setupCronJobs } from './workers/workerSetup';
// Note: importing workers automatically starts them due to instance initializers inside their files.
import './workers/mapWorker';
import './workers/reduceWorker';
import './workers/chatWorker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Set up routes
app.use('/upload', uploadRouter);
app.use('/chat', chatRouter);
app.use('/analytics', analyticsRouter);

// Basic health check
app.get('/', (req, res) => {
  res.send('Echo Walking Skeleton API is running');
});

import { postgresSaver } from './agent';

const startServer = async () => {
  await initDb();
  await postgresSaver.setup();
  await setupCronJobs();
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
