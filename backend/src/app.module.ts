import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DbModule } from './db/db.module';
import { SecretsModule } from './secrets/secrets.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ limit: 20, ttl: 60_000 }],
    }),
    DbModule,
    SecretsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
