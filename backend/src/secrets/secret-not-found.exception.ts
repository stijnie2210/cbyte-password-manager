import { NotFoundException } from '@nestjs/common';

export class SecretNotFoundException extends NotFoundException {
  constructor() {
    super('Deze link is ongeldig, verlopen of al bekeken.');
  }
}
