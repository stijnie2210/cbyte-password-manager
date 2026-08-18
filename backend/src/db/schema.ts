import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const secrets = pgTable('secrets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ciphertext: text('ciphertext').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

export type Secret = typeof secrets.$inferSelect;
export type NewSecret = typeof secrets.$inferInsert;
