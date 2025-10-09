import { body } from 'express-validator';

export const businessRegistrationValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
    
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must be less than 100 characters'),
    
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
    
  body('companyDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Company description must be less than 500 characters'),
    
  body('companyWebsite')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
];

export const activationValidation = [
  body('activationCode')
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage('Invalid activation code'),
];
