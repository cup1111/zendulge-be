import express from 'express';
import { register, activateAccount } from '../../controllers/v1/registerController';

const router = express.Router();

router.get('/', (req: any, res: any) => {
  res.sendStatus(201);
});

// Business owner registration
router.post('/business-owner-register', register);

// Account activation
router.get('/activate/:activationCode', activateAccount);

router.post('/login', (req: any, res: any) => {
  res.sendStatus(200);
});

router.post('/logout', (req: any, res: any) => {
  res.sendStatus(200);
});

export default router;
