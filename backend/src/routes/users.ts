import { Router } from 'express';
import { authenticateToken } from '../middleware/authenticate';
import { getStats } from '../controllers/users';

const router = Router();

router.get('/stats', authenticateToken, getStats);

export default router;
