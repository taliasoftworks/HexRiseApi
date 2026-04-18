import { Router } from 'express';
import { useController } from './index.js';
import AreaController from '@/controllers/area.controller.js';
import { authMiddleware } from '@/middlewares/auth.middleware.js';

const router = Router();

router.get('/current', authMiddleware, useController(AreaController, c => c.getPlayerArea));

export default router;
