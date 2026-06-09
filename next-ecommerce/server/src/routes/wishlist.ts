import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (req, res) => res.json({ items: [] }));
router.post('/items', requireAuth, (req, res) => res.json({ message: 'Added to wishlist' }));
router.delete('/items/:productId', requireAuth, (req, res) => res.json({ message: 'Removed from wishlist' }));

export default router;
