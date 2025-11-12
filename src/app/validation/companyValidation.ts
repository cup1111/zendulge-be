import { body } from 'express-validator';

export const updateCompanyValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company name must be between 1 and 100 characters')
    .trim(),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),

  body('categories')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Categories must be a non-empty array'),
  body('categories.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each category must be between 2 and 50 characters'),

  body('businessAddress.street')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Street address must be between 1 and 200 characters')
    .trim(),

  body('businessAddress.city')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be between 1 and 100 characters')
    .trim(),

  body('businessAddress.state')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters')
    .trim(),

  body('businessAddress.postcode')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Postcode must be between 1 and 20 characters')
    .trim(),

  body('businessAddress.country')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country must be between 1 and 100 characters')
    .trim(),

  body('abn')
    .optional()
    .isLength({ min: 11, max: 11 })
    .withMessage('ABN must be exactly 11 digits')
    .isNumeric()
    .withMessage('ABN must contain only numbers')
    .trim(),

  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL')
    .trim(),

  body('facebookUrl')
    .optional()
    .isURL()
    .withMessage('Invalid Facebook URL')
    .trim(),

  body('twitterUrl')
    .optional()
    .isURL()
    .withMessage('Invalid Twitter URL')
    .trim(),
];
