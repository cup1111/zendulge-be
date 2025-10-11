import express from 'express';
import { registerCustomer, registerBusiness, activateAccount } from '../../controllers/v1/registerController';
import { login, logout, getProfile, refreshToken } from '../../controllers/v1/authController';
import { 
  createOperateSite, 
  getOperateSites, 
  getOperateSiteById, 
  updateOperateSite, 
  deleteOperateSite, 
  toggleOperateSiteStatus, 
  findNearbyOperateSites, 
  getOperateSiteStatus,
} from '../../controllers/v1/operateSiteController';
import { businessRegistrationValidation } from '../../validation/businessRegistrationValidation';
import { customerRegistrationValidation } from '../../validation/customerRegistrationValidation';
import { loginValidation, refreshTokenValidation } from '../../validation/authValidation';
import { handleValidationErrors } from '../../validation/validationHandler';
import { authenticationTokenMiddleware } from '../../middleware/authMiddleware';
import { 
  operateSiteOwnershipOrAdminMiddleware, 
  operateSiteCreationMiddleware, 
  isSuperAdmin, 
  hasBusinessAccess,
} from '../../middleware/operateSitePermissionMiddleware';

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

// Operate Site routes (protected)
router.post('/operate-sites', 
  authenticationTokenMiddleware,
  operateSiteCreationMiddleware,
  createOperateSite,
);

router.get('/operate-sites', 
  authenticationTokenMiddleware,
  getOperateSites,
);

router.get('/operate-sites/nearby', 
  findNearbyOperateSites, // Public route for finding nearby operate sites
);

router.get('/operate-sites/:id', 
  authenticationTokenMiddleware,
  getOperateSiteById,
);

router.put('/operate-sites/:id', 
  authenticationTokenMiddleware,
  operateSiteOwnershipOrAdminMiddleware,
  updateOperateSite,
);

router.delete('/operate-sites/:id', 
  authenticationTokenMiddleware,
  operateSiteOwnershipOrAdminMiddleware,
  deleteOperateSite,
);

router.patch('/operate-sites/:id/toggle-status', 
  authenticationTokenMiddleware,
  operateSiteOwnershipOrAdminMiddleware,
  toggleOperateSiteStatus,
);

router.get('/operate-sites/:id/status', 
  authenticationTokenMiddleware,
  getOperateSiteStatus,
);

// Example routes using the new separated middleware

// Admin-only route example - only super admins can access
router.get('/admin/operate-sites', 
  authenticationTokenMiddleware,
  isSuperAdmin,
  getOperateSites, // This would show all operate sites for admin
);

// Business access only route example - operate site owners can access their own site data
router.get('/business/operate-sites/:id/analytics', 
  authenticationTokenMiddleware,
  hasBusinessAccess,
  getOperateSiteById, // This would show analytics for operate site owners
);

export default router;
