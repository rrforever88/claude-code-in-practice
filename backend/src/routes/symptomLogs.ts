import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { createSymptomLogSchema, updateSymptomLogSchema, logQuerySchema } from '../schemas/symptoms';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const result = logQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  const { startDate, endDate, limit, offset } = result.data;

  try {
    const logs = await prisma.symptomLog.findMany({
      where: {
        userId: req.user!.userId,
        ...(startDate || endDate
          ? { loggedAt: { ...(startDate ? { gte: new Date(startDate) } : {}), ...(endDate ? { lte: new Date(endDate) } : {}) } }
          : {}),
      },
      orderBy: { loggedAt: 'desc' },
      take: limit,
      skip: offset,
      include: { symptom: { select: { id: true, name: true, category: true } } },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const result = createSymptomLogSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  const { symptomId, severity, notes, loggedAt } = result.data;

  try {
    const symptom = await prisma.symptom.findUnique({ where: { id: symptomId } });
    if (!symptom) {
      res.status(404).json({ error: 'Symptom not found' });
      return;
    }

    const log = await prisma.symptomLog.create({
      data: {
        userId: req.user!.userId,
        symptomId,
        severity,
        notes,
        ...(loggedAt ? { loggedAt: new Date(loggedAt) } : {}),
      },
    });
    res.status(201).json(log);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const result = updateSymptomLogSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const log = await prisma.symptomLog.findUnique({ where: { id: req.params.id } });
    if (!log) {
      res.status(404).json({ error: 'Symptom log not found' });
      return;
    }
    if (log.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { loggedAt, ...rest } = result.data;
    const updated = await prisma.symptomLog.update({
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
    const log = await prisma.symptomLog.findUnique({ where: { id: req.params.id } });
    if (!log) {
      res.status(404).json({ error: 'Symptom log not found' });
      return;
    }
    if (log.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.symptomLog.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
