import express from 'express';
import { registerCustomer, registerBusiness, activateAccount } from '../../controllers/v1/registerController';
import { login, logout, getProfile, refreshToken } from '../../controllers/v1/authController';
import { businessRegistrationValidation } from '../../validation/businessRegistrationValidation';
import { customerRegistrationValidation } from '../../validation/customerRegistrationValidation';
import { loginValidation, refreshTokenValidation } from '../../validation/authValidation';
import { handleValidationErrors } from '../../validation/validationHandler';
import { authenticationTokenMiddleware } from '../../middleware/authMiddleware';

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

// Authentication routes
router.post('/login', 
  loginValidation,
  handleValidationErrors,
  login,
);

router.post('/logout', 
  authenticationTokenMiddleware,
  logout,
);

router.get('/me', 
  authenticationTokenMiddleware,
  getProfile,
);

router.post('/refresh-token',
  refreshTokenValidation,
  handleValidationErrors,
  refreshToken,
);

router.get('/verify/:token', activateAccount);
export default router;
