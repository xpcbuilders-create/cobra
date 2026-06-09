import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, (req, res) => res.json({ message: 'Order placed' }));
router.get('/', requireAuth, (req, res) => res.json({ orders: [] }));
router.get('/:id', requireAuth, (req, res) => res.json({ order: null }));

export default router;
