import express from 'express';
import { registerCustomer, registerBusiness, activateAccount } from '../../controllers/v1/registerController';
import { login, logout, getProfile, refreshToken } from '../../controllers/v1/authController';
import { 
  createStore, 
  getStores, 
  getStoreById, 
  updateStore, 
  deleteStore, 
  toggleStoreStatus, 
  findNearbyStores, 
  getStoreStatus,
} from '../../controllers/v1/storeController';
import { businessRegistrationValidation } from '../../validation/businessRegistrationValidation';
import { customerRegistrationValidation } from '../../validation/customerRegistrationValidation';
import { loginValidation, refreshTokenValidation } from '../../validation/authValidation';
import { handleValidationErrors } from '../../validation/validationHandler';
import { authenticationTokenMiddleware } from '../../middleware/authMiddleware';
import { storeOwnershipOrAdminMiddleware, storeCreationMiddleware } from '../../middleware/storePermissionMiddleware';

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

// Store routes (protected)
router.post('/stores', 
  authenticationTokenMiddleware,
  storeCreationMiddleware,
  createStore,
);

router.get('/stores', 
  authenticationTokenMiddleware,
  getStores,
);

router.get('/stores/nearby', 
  findNearbyStores, // Public route for finding nearby stores
);

router.get('/stores/:id', 
  authenticationTokenMiddleware,
  getStoreById,
);

router.put('/stores/:id', 
  authenticationTokenMiddleware,
  storeOwnershipOrAdminMiddleware,
  updateStore,
);

router.delete('/stores/:id', 
  authenticationTokenMiddleware,
  storeOwnershipOrAdminMiddleware,
  deleteStore,
);

router.patch('/stores/:id/toggle-status', 
  authenticationTokenMiddleware,
  storeOwnershipOrAdminMiddleware,
  toggleStoreStatus,
);

router.get('/stores/:id/status', 
  authenticationTokenMiddleware,
  getStoreStatus,
);

export default router;
