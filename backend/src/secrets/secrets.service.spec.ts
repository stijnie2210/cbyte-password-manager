import { SecretsService } from './secrets.service';
import { EncryptionService } from './encryption.service';
import { SecretNotFoundException } from './secret-not-found.exception';
import type { Db } from '../db/db.module';
import type { NewSecret } from '../db/schema';

describe('SecretsService', () => {
  let encryption: EncryptionService;
  let insertValues: jest.Mock<{ returning: jest.Mock }, [NewSecret]>;
  let insertReturning: jest.Mock;
  let deleteReturning: jest.Mock;
  let db: { insert: jest.Mock; delete: jest.Mock };
  let service: SecretsService;

  beforeEach(() => {
    process.env.SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');
    encryption = new EncryptionService();
    encryption.onModuleInit();

    insertReturning = jest.fn();
    deleteReturning = jest.fn();
    insertValues = jest
      .fn<{ returning: jest.Mock }, [NewSecret]>()
      .mockReturnValue({ returning: insertReturning });

    db = {
      insert: jest.fn().mockReturnValue({ values: insertValues }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: deleteReturning }),
      }),
    };

    service = new SecretsService(db as unknown as Db, encryption);
  });

  describe('create', () => {
    it('encrypts the password and stores no plaintext', async () => {
      insertReturning.mockResolvedValue([{ id: 'some-id', expiresAt: null }]);

      const result = await service.create('S3cretP@ss');

      expect(result).toEqual({ id: 'some-id', expiresAt: null });
      const storedValues = insertValues.mock.calls[0][0];
      expect(storedValues.ciphertext).not.toContain('S3cretP@ss');
      expect(storedValues.expiresAt).toBeNull();
    });

    it('sets expiresAt based on expiresInMinutes', async () => {
      insertReturning.mockResolvedValue([
        { id: 'some-id', expiresAt: new Date() },
      ]);
      const before = Date.now();

      await service.create('S3cretP@ss', 10);

      const storedValues = insertValues.mock.calls[0][0];
      const expiresAt = storedValues.expiresAt as Date;
      const deltaMinutes = (expiresAt.getTime() - before) / 60_000;
      expect(deltaMinutes).toBeGreaterThan(9.9);
      expect(deltaMinutes).toBeLessThan(10.1);
    });
  });

  describe('consume', () => {
    it('decrypts and returns the password when the row exists', async () => {
      const encrypted = encryption.encrypt('S3cretP@ss');
      deleteReturning.mockResolvedValue([{ id: 'some-id', ...encrypted }]);

      const password = await service.consume('some-id');

      expect(password).toBe('S3cretP@ss');
    });

    it('throws SecretNotFoundException when nothing was deleted (missing/expired/already used)', async () => {
      deleteReturning.mockResolvedValue([]);

      await expect(service.consume('missing-id')).rejects.toBeInstanceOf(
        SecretNotFoundException,
      );
    });
  });
});
