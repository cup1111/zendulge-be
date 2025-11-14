import { body, param } from 'express-validator';

// Validation for creating a new user with role
export const createUserWithRoleValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .toLowerCase(),

  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please enter a valid phone number'),

  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title cannot exceed 100 characters'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),

  body('role').isMongoId().withMessage('Please provide a valid role ID'),

  body('operateSiteIds')
    .optional()
    .isArray()
    .withMessage('Operate site IDs must be an array'),

  body('operateSiteIds.*')
    .optional()
    .isMongoId()
    .withMessage('Each operate site ID must be a valid MongoDB ObjectId'),
];

// Validation for updating user information
export const updateUserValidation = [
  param('userId').isMongoId().withMessage('Please provide a valid user ID'),

  body('role')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid role ID'),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please enter a valid phone number'),

  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title cannot exceed 100 characters'),

  body('operateSiteIds')
    .optional()
    .isArray()
    .withMessage('Operate site IDs must be an array'),

  body('operateSiteIds.*')
    .optional()
    .isMongoId()
    .withMessage('Each operate site ID must be a valid MongoDB ObjectId'),
];

// Validation for removing user role
export const removeUserRoleValidation = [
  param('userId').isMongoId().withMessage('Please provide a valid user ID'),
];

// Validation for user ID parameter
export const userIdValidation = [
  param('userId').isMongoId().withMessage('Please provide a valid user ID'),
];

// Validation for business ID parameter
export const businessIdValidation = [
  param('id').isMongoId().withMessage('Please provide a valid business ID'),
];

// Combined validation for business and user ID parameters
export const businessAndUserIdValidation = [
  param('id').isMongoId().withMessage('Please provide a valid business ID'),
  param('userId').isMongoId().withMessage('Please provide a valid user ID'),
];

// Combined validation for business user role update
export const businessUserRoleValidation = [
  param('id').isMongoId().withMessage('Please provide a valid business ID'),
  param('userId').isMongoId().withMessage('Please provide a valid user ID'),
  body('role').isMongoId().withMessage('Please provide a valid role ID'),
];

