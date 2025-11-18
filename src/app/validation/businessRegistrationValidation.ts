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
    .trim()
    .custom((value) => {
      if (!value || value === '') {
        return true;
      }
      return /^https?:\/\/(www\.)?facebook\.com\/.+/.test(value);
    })
    .withMessage('Please provide a valid Facebook URL'),

  body('twitterUrl')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === '') {
        return true;
      }
      return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/.test(value);
    })
    .withMessage('Please provide a valid Twitter/X URL'),

  body('logo')
    .optional()
    .isURL()
    .matches(/\.(jpg|jpeg|png|gif|svg)$/i)
    .withMessage('Logo must be a valid image URL (jpg, jpeg, png, gif, svg)'),

  // Operating hours validation
  body('operatingHours')
    .optional()
    .isObject()
    .withMessage('Operating hours must be an object'),

  body('operatingHours.monday')
    .optional()
    .isObject()
    .withMessage('Monday hours must be an object'),
  body('operatingHours.monday.open')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Monday open time must be in HH:MM format (24-hour)'),
  body('operatingHours.monday.close')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Monday close time must be in HH:MM format (24-hour)'),
  body('operatingHours.monday.isClosed')
    .optional()
    .isBoolean()
    .withMessage('Monday isClosed must be a boolean'),

  body('operatingHours.tuesday')
    .optional()
    .isObject()
    .withMessage('Tuesday hours must be an object'),
  body('operatingHours.tuesday.open')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Tuesday open time must be in HH:MM format (24-hour)'),
  body('operatingHours.tuesday.close')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Tuesday close time must be in HH:MM format (24-hour)'),
  body('operatingHours.tuesday.isClosed')
    .optional()
    .isBoolean()
    .withMessage('Tuesday isClosed must be a boolean'),

  body('operatingHours.wednesday')
    .optional()
    .isObject()
    .withMessage('Wednesday hours must be an object'),
  body('operatingHours.wednesday.open')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Wednesday open time must be in HH:MM format (24-hour)'),
  body('operatingHours.wednesday.close')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Wednesday close time must be in HH:MM format (24-hour)'),
  body('operatingHours.wednesday.isClosed')
    .optional()
    .isBoolean()
    .withMessage('Wednesday isClosed must be a boolean'),

  body('operatingHours.thursday')
    .optional()
    .isObject()
    .withMessage('Thursday hours must be an object'),
  body('operatingHours.thursday.open')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Thursday open time must be in HH:MM format (24-hour)'),
  body('operatingHours.thursday.close')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Thursday close time must be in HH:MM format (24-hour)'),
  body('operatingHours.thursday.isClosed')
    .optional()
    .isBoolean()
    .withMessage('Thursday isClosed must be a boolean'),

  body('operatingHours.friday')
    .optional()
    .isObject()
    .withMessage('Friday hours must be an object'),
  body('operatingHours.friday.open')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Friday open time must be in HH:MM format (24-hour)'),
  body('operatingHours.friday.close')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Friday close time must be in HH:MM format (24-hour)'),
  body('operatingHours.friday.isClosed')
    .optional()
    .isBoolean()
    .withMessage('Friday isClosed must be a boolean'),

  body('operatingHours.saturday')
    .optional()
    .isObject()
    .withMessage('Saturday hours must be an object'),
  body('operatingHours.saturday.open')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Saturday open time must be in HH:MM format (24-hour)'),
  body('operatingHours.saturday.close')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Saturday close time must be in HH:MM format (24-hour)'),
  body('operatingHours.saturday.isClosed')
    .optional()
    .isBoolean()
    .withMessage('Saturday isClosed must be a boolean'),

  body('operatingHours.sunday')
    .optional()
    .isObject()
    .withMessage('Sunday hours must be an object'),
  body('operatingHours.sunday.open')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Sunday open time must be in HH:MM format (24-hour)'),
  body('operatingHours.sunday.close')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Sunday close time must be in HH:MM format (24-hour)'),
  body('operatingHours.sunday.isClosed')
    .optional()
    .isBoolean()
    .withMessage('Sunday isClosed must be a boolean'),
];

export const activationValidation = [
  body('activationCode')
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage('Invalid activation code'),
];
