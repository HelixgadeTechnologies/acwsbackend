import { Router } from 'express';
import * as ticketsController from '../controllers/tickets.controller';

const router = Router();

// GET /api/v1/tickets/prices
router.get('/prices', ticketsController.getPrices);

export default router;
