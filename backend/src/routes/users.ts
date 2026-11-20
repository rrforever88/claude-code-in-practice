import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { updateUserSchema } from '../schemas/users';

const router = Router();

router.get('/me', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, displayName: true, timezone: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/me', async (req: Request, res: Response) => {
  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: result.data,
      select: { id: true, email: true, displayName: true, timezone: true, createdAt: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/me', async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.user!.userId } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
