import { BaseException } from './baseException';

// 401 - Authentication errors
export class AuthenticationException extends BaseException {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

// 401 - Invalid activation token
export class InvalidActivationTokenException extends BaseException {
  constructor(message: string = 'Invalid or expired activation token') {
    super(message, 401);
  }
}
