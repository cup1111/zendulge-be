import { BaseException } from './baseException';

export class BadRequestException extends BaseException {
  constructor(message = 'Bad Request') {
    super(message, 400);
    this.name = 'BadRequestException';
  }
}
