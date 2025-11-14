import { body } from 'express-validator';

export const businessRegistrationValidation = [
  // User fields
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    ),

  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),

  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),

  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must be less than 100 characters'),

  // Business fields
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),

  body('businessEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid business email address'),

  body('businessDescription')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage(
      'Business description must be between 10 and 500 characters if provided',
    ),

  body('categories')
    .isArray({ min: 1 })
    .withMessage('Categories must be a non-empty array'),
  body('categories.*')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each category must be between 2 and 50 characters'),

  // Business address fields
  body('businessAddress.street')
    .trim()
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage(
      'Street address is required and must be less than 200 characters',
    ),

  body('businessAddress.city')
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('City is required and must be less than 100 characters'),

  body('businessAddress.state')
    .trim()
    .notEmpty()
    .isLength({ max: 50 })
    .withMessage('State is required and must be less than 50 characters'),

  body('businessAddress.postcode')
    .trim()
    .matches(/^\d{4}$/)
    .withMessage('Please provide a valid Australian postcode (4 digits)'),

  body('businessAddress.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country must be less than 50 characters'),

  // Optional fields
  body('abn')
    .optional()
    .trim()
    .matches(/^\d{11}$/)
    .withMessage('ABN must be 11 digits'),

  body('businessWebsite')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),

  body('facebookUrl')
    .optional()
    .matches(/^https?:\/\/(www\.)?facebook\.com\/.+/)
    .withMessage('Please provide a valid Facebook URL'),

  body('twitterUrl')
    .optional()
    .matches(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/)
    .withMessage('Please provide a valid Twitter/X URL'),

  body('logo')
    .optional()
    .isURL()
    .matches(/\.(jpg|jpeg|png|gif|svg)$/i)
    .withMessage('Logo must be a valid image URL (jpg, jpeg, png, gif, svg)'),
];

export const activationValidation = [
  body('activationCode')
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage('Invalid activation code'),
];
