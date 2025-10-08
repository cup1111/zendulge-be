import { BaseException } from './baseException';

// 500 - Internal server errors
export class InternalServerException extends BaseException {
  constructor(message: string = 'An internal server error occurred') {
    super(message, 500);
  }
}

// 500 - Database errors
export class DatabaseException extends InternalServerException {
  constructor(message: string = 'Database operation failed') {
    super(message);
  }
}

// 500 - External service errors
export class ExternalServiceException extends InternalServerException {
  constructor(message: string = 'External service unavailable') {
    super(message);
  }
}

// 500 - Email service errors
export class EmailServiceException extends ExternalServiceException {
  constructor(message: string = 'Email service unavailable') {
    super(message);
  }
}
