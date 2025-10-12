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
import { getCompanyUsers } from '../../controllers/v1/companyController';
import { businessRegistrationValidation } from '../../validation/businessRegistrationValidation';
import { customerRegistrationValidation } from '../../validation/customerRegistrationValidation';
import { loginValidation, refreshTokenValidation } from '../../validation/authValidation';
import { handleValidationErrors } from '../../validation/validationHandler';
import { authenticationTokenMiddleware } from '../../middleware/authMiddleware';
import { 
  operateSiteOwnershipOrAdminMiddleware, 
  isSuperAdmin,
} from '../../middleware/operateSitePermissionMiddleware';
import { requireCompanyAccess } from '../../middleware/companyAccessMiddleware';

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
router.post('/company/:id/operate-sites', 
  authenticationTokenMiddleware,
  requireCompanyAccess, // Validates company access + provides req.company
  createOperateSite,
);

router.get('/company/:id/operate-sites', 
  authenticationTokenMiddleware,
  requireCompanyAccess, // Validates company access
  getOperateSites,
);

router.get('/operate-sites/nearby', 
  findNearbyOperateSites, // Public route for finding nearby operate sites
);

router.get('/company/:id/operate-sites/:operateSiteId', 
  authenticationTokenMiddleware,
  requireCompanyAccess, // Validates company access
  getOperateSiteById,
);

router.put('/company/:id/operate-sites/:operateSiteId', 
  authenticationTokenMiddleware,
  requireCompanyAccess, // Validates company access first
  operateSiteOwnershipOrAdminMiddleware, // Then validates operate site permissions
  updateOperateSite,
);

router.delete('/company/:id/operate-sites/:operateSiteId', 
  authenticationTokenMiddleware,
  requireCompanyAccess,
  operateSiteOwnershipOrAdminMiddleware,
  deleteOperateSite,
);

router.patch('/company/:id/operate-sites/:operateSiteId/toggle-status', 
  authenticationTokenMiddleware,
  requireCompanyAccess,
  operateSiteOwnershipOrAdminMiddleware,
  toggleOperateSiteStatus,
);

router.get('/company/:id/operate-sites/:operateSiteId/status', 
  authenticationTokenMiddleware,
  requireCompanyAccess,
  getOperateSiteStatus,
);

// Company users route - get all users associated with a company
router.get('/company/:id/users', 
  authenticationTokenMiddleware,
  requireCompanyAccess, // Validates company access and provides req.company
  getCompanyUsers,
);

// Example routes using the new security approach

// Admin-only route example - only super admins can access ALL company data
router.get('/admin/operate-sites', 
  authenticationTokenMiddleware,
  isSuperAdmin,
  getOperateSites, // This would show all operate sites for admin
);

// Business access route - company members can access their company's analytics
router.get('/company/:id/operate-sites/:operateSiteId/analytics', 
  authenticationTokenMiddleware,
  requireCompanyAccess, // Validates company access and provides req.company
  getOperateSiteById, // This would show analytics for company members
);

export default router;
