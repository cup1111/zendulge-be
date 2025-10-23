import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationException } from '../exceptions';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => `${error.param}: ${error.msg}`)
      .join(', ');
    const formattedErrors = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
    }));

    throw new ValidationException(
      `Validation failed: ${errorMessages}`,
      formattedErrors,
    );
  }

  next();
};
