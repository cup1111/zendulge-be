import { body } from 'express-validator';

export const updateBusinessValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Business name must be between 1 and 100 characters')
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
    .trim()
    .custom((value) => {
      if (!value || value === '') {
        return true;
      }
      return /^https?:\/\/(www\.)?facebook\.com\/.+/.test(value);
    })
    .withMessage('Invalid Facebook URL'),

  body('twitterUrl')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === '') {
        return true;
      }
      return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/.test(value);
    })
    .withMessage('Invalid Twitter URL'),

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

