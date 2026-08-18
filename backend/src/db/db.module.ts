import { Global, Inject, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';
export const POSTGRES_CLIENT = 'POSTGRES_CLIENT';

@Injectable()
class PostgresClientCloser implements OnModuleDestroy {
  constructor(@Inject(POSTGRES_CLIENT) private readonly client: postgres.Sql) {}

  onModuleDestroy() {
    return this.client.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_CLIENT,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL is not set');
        }
        return postgres(connectionString);
      },
    },
    {
      provide: DRIZZLE,
      inject: [POSTGRES_CLIENT],
      useFactory: (client: postgres.Sql) => drizzle(client, { schema }),
    },
    PostgresClientCloser,
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
