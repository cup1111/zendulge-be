import express from 'express';
import { registerCustomer, registerBusiness, activateAccount } from '../../controllers/v1/registerController';
import { businessRegistrationValidation } from '../../validation/businessRegistrationValidation';
import { customerRegistrationValidation } from '../../validation/customerRegistrationValidation';
import { handleValidationErrors } from '../../validation/validationHandler';

const router = express.Router();

router.get('/', (req: any, res: any) => {
  res.sendStatus(201);
});

// Customer registration
router.post('/register', 
  customerRegistrationValidation,
  handleValidationErrors,
  registerCustomer,
);

// Business registration
router.post('/business-register', 
  businessRegistrationValidation,
  handleValidationErrors,
  registerBusiness,
);

router.post('/login', (req: any, res: any) => {
  res.sendStatus(200);
});

router.post('/logout', (req: any, res: any) => {
  res.sendStatus(200);
});

//may need to add middleware to get authenticate user
router.get('/me', (req: any, res: any) => {
  res.sendStatus(200);
});

router.get('/verify/:token', activateAccount);
export default router;
