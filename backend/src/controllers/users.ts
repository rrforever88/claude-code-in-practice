import { Request, Response } from 'express';
import { getUserStats } from '../services/stats';

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const stats = await getUserStats(req.user!.userId);
    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}
