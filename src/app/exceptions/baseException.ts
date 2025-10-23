// Base exception class - similar to Laravel's Exception
export abstract class BaseException extends Error {
  public statusCode: number;

  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }

  // Method to convert exception to response format
  public toResponse(): {
    success: boolean;
    message: string;
    statusCode: number;
  } {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
