import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { createSymptomSchema, updateSymptomSchema } from '../schemas/symptoms';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const symptoms = await prisma.symptom.findMany({
      where: {
        isActive: true,
        OR: [{ userId: null }, { userId: req.user!.userId }],
      },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    });
    res.json(symptoms);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const result = createSymptomSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const symptom = await prisma.symptom.create({
      data: { ...result.data, userId: req.user!.userId },
    });
    res.status(201).json(symptom);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const result = updateSymptomSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const symptom = await prisma.symptom.findUnique({ where: { id: req.params.id } });
    if (!symptom) {
      res.status(404).json({ error: 'Symptom not found' });
      return;
    }
    if (symptom.userId === null) {
      res.status(403).json({ error: 'Cannot modify system symptoms' });
      return;
    }
    if (symptom.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await prisma.symptom.update({ where: { id: req.params.id }, data: result.data });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const symptom = await prisma.symptom.findUnique({ where: { id: req.params.id } });
    if (!symptom) {
      res.status(404).json({ error: 'Symptom not found' });
      return;
    }
    if (symptom.userId === null) {
      res.status(403).json({ error: 'Cannot delete system symptoms' });
      return;
    }
    if (symptom.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.symptom.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
