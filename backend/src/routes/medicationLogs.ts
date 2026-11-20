import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  createMedicationLogSchema,
  updateMedicationLogSchema,
  logQuerySchema,
} from '../schemas/medications';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const result = logQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  const { startDate, endDate, limit, offset } = result.data;

  try {
    const logs = await prisma.medicationLog.findMany({
      where: {
        userId: req.user!.userId,
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { medication: { select: { id: true, name: true, dosage: true } } },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const result = createMedicationLogSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  const { medicationId, taken, takenAt, notes } = result.data;

  try {
    const med = await prisma.medication.findUnique({ where: { id: medicationId } });
    if (!med) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }
    if (med.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const log = await prisma.medicationLog.create({
      data: {
        userId: req.user!.userId,
        medicationId,
        taken,
        notes,
        ...(takenAt ? { takenAt: new Date(takenAt) } : {}),
      },
    });
    res.status(201).json(log);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const result = updateMedicationLogSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const log = await prisma.medicationLog.findUnique({ where: { id: req.params.id } });
    if (!log) {
      res.status(404).json({ error: 'Medication log not found' });
      return;
    }
    if (log.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { takenAt, ...rest } = result.data;
    const updated = await prisma.medicationLog.update({
      where: { id: req.params.id },
      data: { ...rest, ...(takenAt ? { takenAt: new Date(takenAt) } : {}) },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const log = await prisma.medicationLog.findUnique({ where: { id: req.params.id } });
    if (!log) {
      res.status(404).json({ error: 'Medication log not found' });
      return;
    }
    if (log.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.medicationLog.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
