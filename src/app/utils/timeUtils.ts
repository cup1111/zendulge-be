import { BadRequestException } from '../exceptions';

/**
 * Converts a date to UTC midnight
 */
export const toUtcMidnight = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

/**
 * Normalizes a date value to UTC midnight
 * @param value - Date value (Date object or date string)
 * @param fieldName - Name of the field for error messages
 * @returns Normalized Date object at UTC midnight
 * @throws BadRequestException if the date is invalid
 */
export const normalizeDate = (value: any, fieldName: string): Date => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid date`);
  }

  return toUtcMidnight(date);
};

