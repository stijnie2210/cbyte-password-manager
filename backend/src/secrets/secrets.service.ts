import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { Db } from '../db/db.module';
import * as schema from '../db/schema';
import { EncryptionService } from './encryption.service';
import { SecretNotFoundException } from './secret-not-found.exception';

@Injectable()
export class SecretsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly encryption: EncryptionService,
  ) {}

  async create(password: string, expiresInMinutes?: number) {
    const { ciphertext, iv, authTag } = this.encryption.encrypt(password);
    const expiresAt = expiresInMinutes
      ? new Date(Date.now() + expiresInMinutes * 60_000)
      : null;

    const [row] = await this.db
      .insert(schema.secrets)
      .values({ ciphertext, iv, authTag, expiresAt })
      .returning({
        id: schema.secrets.id,
        expiresAt: schema.secrets.expiresAt,
      });

    return row;
  }

  async consume(id: string): Promise<string> {
    // Single DELETE ... RETURNING statement: Postgres guarantees this is atomic,
    // so concurrent requests for the same id can never both succeed.
    const [row] = await this.db
      .delete(schema.secrets)
      .where(
        and(
          eq(schema.secrets.id, id),
          or(
            isNull(schema.secrets.expiresAt),
            gt(schema.secrets.expiresAt, new Date()),
          ),
        ),
      )
      .returning();

    if (!row) {
      throw new SecretNotFoundException();
    }

    return this.encryption.decrypt({
      ciphertext: row.ciphertext,
      iv: row.iv,
      authTag: row.authTag,
    });
  }
}
