import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getEmiConfig, updateEmiConfig, calculateEmi } from '../controllers/emi.controller.js';

const router = Router();

router.get('/config', getEmiConfig);
router.put('/config', requireAuth, updateEmiConfig);
router.post('/calculate', calculateEmi);

export default router;
