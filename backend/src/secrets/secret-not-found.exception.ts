import { NotFoundException } from '@nestjs/common';

export class SecretNotFoundException extends NotFoundException {
  constructor() {
    super('This link is invalid, expired or already viewed.');
  }
}
