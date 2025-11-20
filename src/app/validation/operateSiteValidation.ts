import { body } from 'express-validator';

export const createOperateSiteValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 255 })
    .withMessage('Address cannot exceed 255 characters'),

  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),

  body('emailAddress')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('specialInstruction')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instruction cannot exceed 500 characters'),

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

export const updateOperateSiteValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address cannot exceed 255 characters'),

  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),

  body('emailAddress')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('specialInstruction')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instruction cannot exceed 500 characters'),

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

