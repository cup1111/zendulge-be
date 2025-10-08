import { BaseException } from './baseException';

// 422 - Validation errors
export class ValidationException extends BaseException {
  public errors?: any[];

  constructor(message: string = 'Validation failed', errors?: any[]) {
    super(message, 422);
    this.errors = errors;
  }

  public toResponse() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.errors && { errors: this.errors }),
    };
  }
}
