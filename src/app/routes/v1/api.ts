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
  deleteAccount,
} from '../../controllers/v1/authController';
import {
  getBusinessInfo,
  updateBusinessInfo,
} from '../../controllers/v1/businessController';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../../controllers/v1/serviceController';
import {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  updateDealStatus,
} from '../../controllers/v1/dealController';
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
import { getBusinessUsers, getBusinessCustomers } from '../../controllers/v1/businessController';
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
  updateBusinessValidation,
} from '../../validation/businessValidation';
import {
  createServiceValidation,
  updateServiceValidation,
} from '../../validation/serviceValidation';
import {
  createDealValidation,
  updateDealValidation,
  updateDealStatusValidation,
} from '../../validation/dealValidation';
import {
  createOperateSiteValidation,
  updateOperateSiteValidation,
} from '../../validation/operateSiteValidation';
import publicDealController from '../../controllers/v1/publicDealController';
import {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  deactivateCategory,
  activateCategory,
} from '../../controllers/v1/categoryController';
import {
  createUserWithRoleValidation,
  businessAndUserIdValidation,
  updateUserValidation,
} from '../../validation/userManagementValidation';
import {
  createCategoryValidation,
  updateCategoryValidation,
} from '../../validation/categoryValidation';
import { handleValidationErrors } from '../../validation/validationHandler';
import { authenticationTokenMiddleware } from '../../middleware/authMiddleware';
import { validateBusinessAccess } from '../../middleware/businessAccessMiddleware';
import { RoleName } from '../../enum/roles';
import { authorizeUserManagementAction } from '../../middleware/userManagementAccessMiddleware';
import { uploadMulter, uploadImage } from '../../controllers/v1/uploadController';

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

router.delete(
  '/me',
  authenticationTokenMiddleware,
  deleteAccount,
);

router.get(
  '/business/:businessId/me/role',
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

// Business routes
router.get(
  '/business/:businessId',
  authenticationTokenMiddleware,
  getBusinessInfo,
);

router.patch(
  '/business/:businessId',
  authenticationTokenMiddleware,
  updateBusinessValidation,
  handleValidationErrors,
  updateBusinessInfo,
);

// Service routes (owner only)
router.get(
  '/business/:businessId/services',
  authenticationTokenMiddleware,
  getServices,
);

router.get(
  '/business/:businessId/services/:serviceId',
  authenticationTokenMiddleware,
  getServiceById,
);

router.post(
  '/business/:businessId/services',
  authenticationTokenMiddleware,
  createServiceValidation,
  handleValidationErrors,
  createService,
);

router.patch(
  '/business/:businessId/services/:serviceId',
  authenticationTokenMiddleware,
  updateServiceValidation,
  handleValidationErrors,
  updateService,
);

router.delete(
  '/business/:businessId/services/:serviceId',
  authenticationTokenMiddleware,
  deleteService,
);

// Deal routes (owner only)
router.get(
  '/business/:businessId/deals',
  authenticationTokenMiddleware,
  getDeals,
);

router.get(
  '/business/:businessId/deals/:dealId',
  authenticationTokenMiddleware,
  getDealById,
);

router.post(
  '/business/:businessId/deals',
  authenticationTokenMiddleware,
  createDealValidation,
  handleValidationErrors,
  createDeal,
);

router.patch(
  '/business/:businessId/deals/:dealId',
  authenticationTokenMiddleware,
  updateDealValidation,
  handleValidationErrors,
  updateDeal,
);

router.delete(
  '/business/:businessId/deals/:dealId',
  authenticationTokenMiddleware,
  deleteDeal,
);

router.patch(
  '/business/:businessId/deals/:dealId/status',
  authenticationTokenMiddleware,
  updateDealStatusValidation,
  handleValidationErrors,
  updateDealStatus,
);

// Public deals listing (home page) and details
router.get('/public/deals', publicDealController.listPublicDeals);
router.get('/public/deals/:dealId', publicDealController.getPublicDealById);

// Public categories endpoint (for home page)
router.get('/public/categories', getAllCategories);

// Category routes (CRUD - authenticated)
router.get('/categories', authenticationTokenMiddleware, getAllCategories);
router.get('/categories/:categoryId', authenticationTokenMiddleware, getCategoryById);
router.get('/categories/slug/:slug', getCategoryBySlug); // Public route by slug
router.post(
  '/categories',
  authenticationTokenMiddleware,
  createCategoryValidation,
  handleValidationErrors,
  createCategory,
);
router.patch(
  '/categories/:categoryId',
  authenticationTokenMiddleware,
  updateCategoryValidation,
  handleValidationErrors,
  updateCategory,
);
router.delete(
  '/categories/:categoryId',
  authenticationTokenMiddleware,
  deleteCategory,
);
router.patch(
  '/categories/:categoryId/deactivate',
  authenticationTokenMiddleware,
  deactivateCategory,
);
router.patch(
  '/categories/:categoryId/activate',
  authenticationTokenMiddleware,
  activateCategory,
);

// Uploads - server-side multipart upload to S3
router.post(
  '/upload',
  // authenticationTokenMiddleware,
  uploadMulter.single('file'),
  uploadImage,
);

// Operate Site routes (protected)
router.post(
  '/business/:id/operate-sites',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access + provides req.business
  createOperateSiteValidation,
  handleValidationErrors,
  createOperateSite,
);

router.get(
  '/business/:id/operate-sites',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access
  getOperateSites,
);

router.get(
  '/operate-sites/nearby',
  findNearbyOperateSites, // Public route for finding nearby operate sites
);

router.get(
  '/business/:id/operate-sites/:operateSiteId',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access
  getOperateSiteById,
);

router.put(
  '/business/:id/operate-sites/:operateSiteId',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access
  updateOperateSiteValidation,
  handleValidationErrors,
  updateOperateSite,
);

router.delete(
  '/business/:id/operate-sites/:operateSiteId',
  authenticationTokenMiddleware,
  validateBusinessAccess,
  deleteOperateSite,
);

router.patch(
  '/business/:id/operate-sites/:operateSiteId/toggle-status',
  authenticationTokenMiddleware,
  validateBusinessAccess,
  toggleOperateSiteStatus,
);

router.get(
  '/business/:id/operate-sites/:operateSiteId/status',
  authenticationTokenMiddleware,
  validateBusinessAccess,
  getOperateSiteStatus,
);

// Business users route - get all users associated with a business
router.get(
  '/business/:id/users',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access and provides req.business
  authorizeUserManagementAction(
    [RoleName.OWNER, RoleName.MANAGER, RoleName.EMPLOYEE],
  ),
  getBusinessUsers,
);

// Business customers route - get all customers associated with a business
router.get(
  '/business/:id/customers',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access and provides req.business
  getBusinessCustomers,
);

// Example routes using the new security approach

// Business access route - business members can access their business's analytics
router.get(
  '/business/:id/operate-sites/:operateSiteId/analytics',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access and provides req.business
  getOperateSiteById, // This would show analytics for business members
);

// User Management routes following the business/:id pattern
// Business-scoped user management (business owners manage their business users)
router.get(
  '/business/:id/users/:userId',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access and provides req.business
  authorizeUserManagementAction(
    [RoleName.OWNER, RoleName.MANAGER, RoleName.EMPLOYEE],
  ),
  businessAndUserIdValidation,
  handleValidationErrors,
  getUserById,
);

router.post(
  '/business/:id/invite',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access and provides req.business
  authorizeUserManagementAction(
    [RoleName.OWNER, RoleName.MANAGER],
  ),
  createUserWithRoleValidation,
  handleValidationErrors,
  createUserWithRole,
);

router.patch(
  '/business/:id/users/:userId',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access and provides req.business
  authorizeUserManagementAction(
    [RoleName.OWNER, RoleName.MANAGER],
  ),
  updateUserValidation,
  handleValidationErrors,
  updateUser,
);

router.delete(
  '/business/:id/users/:userId',
  authenticationTokenMiddleware,
  validateBusinessAccess, // Validates business access and provides req.business
  authorizeUserManagementAction(
    [RoleName.OWNER, RoleName.MANAGER],
  ),
  businessAndUserIdValidation,
  handleValidationErrors,
  deleteUser,
);

// Get all roles (for business owner to assign roles to users)
router.get(
  '/business/:id/roles',
  authenticationTokenMiddleware,
  validateBusinessAccess,
  getAllRoles,
);

export default router;
