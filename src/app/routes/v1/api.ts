import express from 'express';
import {
  registerCustomer,
  registerBusiness,
  activateAccount,
} from '../../controllers/v1/registerController';
import {
  login,
  logout,
  getProfile,
  refreshToken,
  getRole,
  updateProfile,
} from '../../controllers/v1/authController';
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
import {
  getUserById,
  createUserWithRole,
  updateUser,
  getAllRoles,
  deleteUser,
} from '../../controllers/v1/userManagementController';
import { businessRegistrationValidation } from '../../validation/businessRegistrationValidation';
import { customerRegistrationValidation } from '../../validation/customerRegistrationValidation';
import {
  loginValidation,
  refreshTokenValidation,
  updateProfileValidation,
} from '../../validation/authValidation';
import {
  createUserWithRoleValidation,
  companyAndUserIdValidation,
  updateUserValidation,
} from '../../validation/userManagementValidation';
import { handleValidationErrors } from '../../validation/validationHandler';
import { authenticationTokenMiddleware } from '../../middleware/authMiddleware';
import { validateCompanyAccess } from '../../middleware/companyAccessMiddleware';

const router = express.Router();

router.get('/', (req: any, res: any) => {
  res.sendStatus(201);
});

// Customer registration
router.post(
  '/register',
  customerRegistrationValidation,
  handleValidationErrors,
  registerCustomer,
);

// Business registration
router.post(
  '/business-register',
  businessRegistrationValidation,
  handleValidationErrors,
  registerBusiness,
);

// Authentication routes
router.post('/login', loginValidation, handleValidationErrors, login);

router.post('/logout', authenticationTokenMiddleware, logout);

router.get('/me', authenticationTokenMiddleware, getProfile);

router.patch(
  '/me',
  authenticationTokenMiddleware,
  updateProfileValidation,
  handleValidationErrors,
  updateProfile,
);

router.get(
  '/company/:companyId/me/role',
  authenticationTokenMiddleware,
  getRole,
);

router.post(
  '/refresh-token',
  refreshTokenValidation,
  handleValidationErrors,
  refreshToken,
);

router.get('/verify/:token', activateAccount);

// Operate Site routes (protected)
router.post(
  '/company/:id/operate-sites',
  authenticationTokenMiddleware,
  validateCompanyAccess, // Validates company access + provides req.company
  createOperateSite,
);

router.get(
  '/company/:id/operate-sites',
  authenticationTokenMiddleware,
  validateCompanyAccess, // Validates company access
  getOperateSites,
);

router.get(
  '/operate-sites/nearby',
  findNearbyOperateSites, // Public route for finding nearby operate sites
);

router.get(
  '/company/:id/operate-sites/:operateSiteId',
  authenticationTokenMiddleware,
  validateCompanyAccess, // Validates company access
  getOperateSiteById,
);

router.put(
  '/company/:id/operate-sites/:operateSiteId',
  authenticationTokenMiddleware,
  validateCompanyAccess, // Validates company access
  updateOperateSite,
);

router.delete(
  '/company/:id/operate-sites/:operateSiteId',
  authenticationTokenMiddleware,
  validateCompanyAccess,
  deleteOperateSite,
);

router.patch(
  '/company/:id/operate-sites/:operateSiteId/toggle-status',
  authenticationTokenMiddleware,
  validateCompanyAccess,
  toggleOperateSiteStatus,
);

router.get(
  '/company/:id/operate-sites/:operateSiteId/status',
  authenticationTokenMiddleware,
  validateCompanyAccess,
  getOperateSiteStatus,
);

// Company users route - get all users associated with a company
router.get(
  '/company/:id/users',
  authenticationTokenMiddleware,
  validateCompanyAccess, // Validates company access and provides req.company
  getCompanyUsers,
);

// Example routes using the new security approach

// Business access route - company members can access their company's analytics
router.get(
  '/company/:id/operate-sites/:operateSiteId/analytics',
  authenticationTokenMiddleware,
  validateCompanyAccess, // Validates company access and provides req.company
  getOperateSiteById, // This would show analytics for company members
);

// User Management routes following the company/:id pattern
// Company-scoped user management (business owners manage their company users)
router.get(
  '/company/:id/users/:userId',
  authenticationTokenMiddleware,
  validateCompanyAccess, // Validates company access and provides req.company
  companyAndUserIdValidation,
  handleValidationErrors,
  getUserById,
);

router.post(
  '/company/:id/invite',
  authenticationTokenMiddleware,
  validateCompanyAccess, // Validates company access and provides req.company
  createUserWithRoleValidation,
  handleValidationErrors,
  createUserWithRole,
);

router.patch(
  '/company/:id/users/:userId',
  authenticationTokenMiddleware,
  validateCompanyAccess, // Validates company access and provides req.company
  updateUserValidation,
  handleValidationErrors,
  updateUser,
);

router.delete(
  '/company/:id/users/:userId',
  authenticationTokenMiddleware,
  validateCompanyAccess, // Validates company access and provides req.company
  companyAndUserIdValidation,
  handleValidationErrors,
  deleteUser,
);

// Get all roles (for company owner to assign roles to users)
router.get(
  '/company/:id/roles',
  authenticationTokenMiddleware,
  validateCompanyAccess,
  getAllRoles,
);

export default router;
