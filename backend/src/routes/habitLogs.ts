import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { createHabitLogSchema, updateHabitLogSchema, logQuerySchema } from '../schemas/habits';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const result = logQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  const { startDate, endDate, limit, offset } = result.data;

  try {
    const logs = await prisma.habitLog.findMany({
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
      include: { habit: { select: { id: true, name: true, trackingType: true, unit: true } } },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const result = createHabitLogSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  const { habitId, valueBoolean, valueNumeric, valueDuration, notes, loggedAt } = result.data;

  try {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    // Validate that the correct value type is provided for the habit's trackingType
    if (habit.trackingType === 'BOOLEAN' && valueBoolean === undefined) {
      res.status(400).json({ error: 'valueBoolean is required for BOOLEAN habits' });
      return;
    }
    if (habit.trackingType === 'NUMERIC' && valueNumeric === undefined) {
      res.status(400).json({ error: 'valueNumeric is required for NUMERIC habits' });
      return;
    }
    if (habit.trackingType === 'DURATION' && valueDuration === undefined) {
      res.status(400).json({ error: 'valueDuration is required for DURATION habits' });
      return;
    }

    const log = await prisma.habitLog.create({
      data: {
        userId: req.user!.userId,
        habitId,
        valueBoolean: valueBoolean ?? null,
        valueNumeric: valueNumeric ?? null,
        valueDuration: valueDuration ?? null,
        notes,
        ...(loggedAt ? { loggedAt: new Date(loggedAt) } : {}),
      },
    });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const result = updateHabitLogSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const log = await prisma.habitLog.findUnique({ where: { id: req.params.id } });
    if (!log) {
      res.status(404).json({ error: 'Habit log not found' });
      return;
    }
    if (log.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { loggedAt, ...rest } = result.data;
    const updated = await prisma.habitLog.update({
      where: { id: req.params.id },
      data: { ...rest, ...(loggedAt ? { loggedAt: new Date(loggedAt) } : {}) },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await prisma.habitLog.findUnique({ where: { id: req.params.id } });
    if (!log) {
      res.status(404).json({ error: 'Habit log not found' });
      return;
    }
    if (log.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.habitLog.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
