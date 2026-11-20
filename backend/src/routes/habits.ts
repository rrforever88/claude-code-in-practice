import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { createHabitSchema, updateHabitSchema } from '../schemas/habits';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const habits = await prisma.habit.findMany({
      where: {
        isActive: true,
        OR: [{ userId: null }, { userId: req.user!.userId }],
      },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    });
    res.json(habits);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const result = createHabitSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const habit = await prisma.habit.create({
      data: { ...result.data, userId: req.user!.userId },
    });
    res.status(201).json(habit);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const result = updateHabitSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const habit = await prisma.habit.findUnique({ where: { id: req.params.id } });
    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    if (habit.userId === null) {
      res.status(403).json({ error: 'Cannot modify system habits' });
      return;
    }
    if (habit.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await prisma.habit.update({ where: { id: req.params.id }, data: result.data });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const habit = await prisma.habit.findUnique({ where: { id: req.params.id } });
    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    if (habit.userId === null) {
      res.status(403).json({ error: 'Cannot delete system habits' });
      return;
    }
    if (habit.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.habit.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
