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
    body('category')
        .notEmpty()
        .withMessage('Category is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Category must be between 1 and 50 characters')
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
        .isMongoId()
        .withMessage('Operating site must be a valid MongoDB ObjectId'),
    body('availability.startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    body('availability.endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('End date must be a valid date'),
    body('availability.maxBookings')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Max bookings must be a positive integer'),
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
    body('category')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Category must be between 1 and 50 characters')
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
        .isMongoId()
        .withMessage('Operating site must be a valid MongoDB ObjectId'),
    body('availability.startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    body('availability.endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    body('availability.maxBookings')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Max bookings must be a positive integer'),
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

export const updateDealStatusValidation = [
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['active', 'inactive', 'expired', 'sold_out'])
        .withMessage('Status must be one of: active, inactive, expired, sold_out'),
];
