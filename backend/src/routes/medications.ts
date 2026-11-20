import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { createMedicationSchema, updateMedicationSchema } from '../schemas/medications';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const medications = await prisma.medication.findMany({
      where: { userId: req.user!.userId },
      orderBy: { name: 'asc' },
    });
    res.json(medications);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const result = createMedicationSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const medication = await prisma.medication.create({
      data: { ...result.data, userId: req.user!.userId },
    });
    res.status(201).json(medication);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const result = updateMedicationSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const med = await prisma.medication.findUnique({ where: { id: req.params.id } });
    if (!med) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }
    if (med.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await prisma.medication.update({ where: { id: req.params.id }, data: result.data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const med = await prisma.medication.findUnique({ where: { id: req.params.id } });
    if (!med) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }
    if (med.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.medication.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
