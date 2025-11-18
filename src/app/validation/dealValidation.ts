import { body } from 'express-validator';

export const createDealValidation = [
  body('title')
    .notEmpty()
    .withMessage('Deal title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Deal title must be between 1 and 100 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters')
    .trim(),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a non-negative number'),
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be an integer between 1 and 1440 minutes'),
  body('operatingSite')
    .notEmpty()
    .withMessage('Operating site is required')
    .isArray({ min: 1 })
    .withMessage('At least one operating site is required'),
  body('operatingSite.*')
    .isMongoId()
    .withMessage('Each operating site must be a valid MongoDB ObjectId'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('maxBookings')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max bookings must be a positive integer'),
  body('currentBookings')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current bookings must be a non-negative integer'),
  body()
    .custom(value => {
      if (!value) {
        return true;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startDate = new Date(value.startDate);
      const endDate = new Date(value.endDate);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return true;
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (endDate.getTime() <= startDate.getTime()) {
        throw new Error('End date must be after start date');
      }

      if (startDate.getTime() < today.getTime()) {
        throw new Error('Start date cannot be before today');
      }

      if (endDate.getTime() < today.getTime()) {
        throw new Error('End date cannot be before today');
      }

      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'expired', 'sold_out'])
    .withMessage('Status must be one of: active, inactive, expired, sold_out'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isString()
    .withMessage('Each image must be a string'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('service')
    .notEmpty()
    .withMessage('Service is required')
    .isMongoId()
    .withMessage('Service must be a valid MongoDB ObjectId'),
];

export const updateDealValidation = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Deal title must be between 1 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters')
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a non-negative number'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be an integer between 1 and 1440 minutes'),
  body('operatingSite')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one operating site is required'),
  body('operatingSite.*')
    .optional()
    .isMongoId()
    .withMessage('Each operating site must be a valid MongoDB ObjectId'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('maxBookings')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max bookings must be a positive integer'),
  body('currentBookings')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current bookings must be a non-negative integer'),
  body()
    .custom(value => {
      if (!value) {
        return true;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const hasStart = Object.prototype.hasOwnProperty.call(value, 'startDate');
      const hasEnd = Object.prototype.hasOwnProperty.call(value, 'endDate');

      let normalizedStart: Date | undefined;

      if (hasStart) {
        const startDate = new Date(value.startDate);
        if (!Number.isNaN(startDate.getTime())) {
          startDate.setHours(0, 0, 0, 0);
          normalizedStart = startDate;
        }
      }

      if (hasEnd) {
        const endDate = new Date(value.endDate);
        if (!Number.isNaN(endDate.getTime())) {
          endDate.setHours(0, 0, 0, 0);

          if (endDate.getTime() < today.getTime()) {
            throw new Error('End date cannot be before today');
          }

          if (normalizedStart && endDate.getTime() <= normalizedStart.getTime()) {
            throw new Error('End date must be after start date');
          }
        }
      }

      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'expired', 'sold_out'])
    .withMessage('Status must be one of: active, inactive, expired, sold_out'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isString()
    .withMessage('Each image must be a string'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('service')
    .optional()
    .isMongoId()
    .withMessage('Service must be a valid MongoDB ObjectId'),
];

export const updateDealStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be one of: active, inactive'),
];
