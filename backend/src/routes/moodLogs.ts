import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { createMoodLogSchema, updateMoodLogSchema, logQuerySchema } from '../schemas/moodLogs';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const result = logQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  const { startDate, endDate, limit, offset } = result.data;

  try {
    const logs = await prisma.moodLog.findMany({
      where: {
        userId: req.user!.userId,
        ...(startDate || endDate
          ? {
              loggedAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      orderBy: { loggedAt: 'desc' },
      take: limit,
      skip: offset,
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const result = createMoodLogSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  const { loggedAt, ...rest } = result.data;

  try {
    const log = await prisma.moodLog.create({
      data: {
        ...rest,
        userId: req.user!.userId,
        ...(loggedAt ? { loggedAt: new Date(loggedAt) } : {}),
      },
    });
    res.status(201).json(log);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const result = updateMoodLogSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const log = await prisma.moodLog.findUnique({ where: { id: req.params.id } });
    if (!log) {
      res.status(404).json({ error: 'Mood log not found' });
      return;
    }
    if (log.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { loggedAt, ...rest } = result.data;
    const updated = await prisma.moodLog.update({
      where: { id: req.params.id },
      data: { ...rest, ...(loggedAt ? { loggedAt: new Date(loggedAt) } : {}) },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const log = await prisma.moodLog.findUnique({ where: { id: req.params.id } });
    if (!log) {
      res.status(404).json({ error: 'Mood log not found' });
      return;
    }
    if (log.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.moodLog.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
