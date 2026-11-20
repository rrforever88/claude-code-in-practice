import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import symptomsRouter from './routes/symptoms';
import symptomLogsRouter from './routes/symptomLogs';
import moodLogsRouter from './routes/moodLogs';
import medicationsRouter from './routes/medications';
import medicationLogsRouter from './routes/medicationLogs';
import habitsRouter from './routes/habits';
import habitLogsRouter from './routes/habitLogs';
import { authenticateToken } from './middleware/authenticate';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', authenticateToken, usersRouter);
app.use('/api/symptoms', authenticateToken, symptomsRouter);
app.use('/api/symptom-logs', authenticateToken, symptomLogsRouter);
app.use('/api/mood-logs', authenticateToken, moodLogsRouter);
app.use('/api/medications', authenticateToken, medicationsRouter);
app.use('/api/medication-logs', authenticateToken, medicationLogsRouter);
app.use('/api/habits', authenticateToken, habitsRouter);
app.use('/api/habit-logs', authenticateToken, habitLogsRouter);

app.use(errorHandler);

export default app;
