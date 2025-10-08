import express from 'express';
import { registerClient, registerBusinessOwner, activateAccount } from '../../controllers/v1/registerController';
import { businessOwnerRegistrationValidation } from '../../validation/businessOwnerRegistrationValidation';
import { clientRegistrationValidation } from '../../validation/clientRegistrationValidation';
import { handleValidationErrors } from '../../validation/validationHandler';

const router = express.Router();

router.get('/', (req: any, res: any) => {
  res.sendStatus(201);
});

// Client registration
router.post('/register', 
  clientRegistrationValidation,
  handleValidationErrors,
  registerClient,
);

// Business owner registration
router.post('/business-owner-register', 
  businessOwnerRegistrationValidation,
  handleValidationErrors,
  registerBusinessOwner,
);

router.post('/login', (req: any, res: any) => {
  res.sendStatus(200);
});

router.get('/verify/:token', activateAccount);

router.post('/login', (req: any, res: any) => {
  res.sendStatus(200);
});

router.post('/logout', (req: any, res: any) => {
  res.sendStatus(200);
});

export default router;
