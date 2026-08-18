import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { SecretsController } from './secrets.controller';
import { SecretsService } from './secrets.service';

@Module({
  controllers: [SecretsController],
  providers: [SecretsService, EncryptionService],
})
export class SecretsModule {}
