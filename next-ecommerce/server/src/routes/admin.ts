import fs from 'fs';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import { Router, Request } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  createProduct,
  updateProduct,
  uploadProductManual,
  updateEmiConfig,
  getDashboard,
} from '../controllers/admin.controller.js';

const router = Router();
const uploadDir = path.join(process.cwd(), 'uploads', 'manuals');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => cb(null, uploadDir),
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF manuals are supported'));
    }
    cb(null, true);
  },
});

router.use(requireAuth, requireAdmin);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.post('/products/:id/manual', upload.single('manual'), uploadProductManual);
router.put('/emi', updateEmiConfig);
router.get('/dashboard', getDashboard);

export default router;
