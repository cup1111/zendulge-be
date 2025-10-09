import { BaseException } from './baseException';

// 404 - Resource not found (should only be used for actual resource not found, not invalid tokens)
export class NotFoundException extends BaseException {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

// 404 - User not found
export class UserNotFoundException extends NotFoundException {
  constructor(message: string = 'User not found') {
    super(message);
  }
}

// 404 - Company not found
export class CompanyNotFoundException extends NotFoundException {
  constructor(message: string = 'Company not found') {
    super(message);
  }
}
