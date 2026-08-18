import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    process.env.SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    service = new EncryptionService();
    service.onModuleInit();
  });

  it('encrypts and decrypts back to the original plaintext', () => {
    const payload = service.encrypt('S3cretP@ss');
    expect(service.decrypt(payload)).toBe('S3cretP@ss');
  });

  it('produces a different ciphertext and iv for each call', () => {
    const first = service.encrypt('same-password');
    const second = service.encrypt('same-password');
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.iv).not.toBe(second.iv);
  });

  it('throws when the ciphertext has been tampered with', () => {
    const payload = service.encrypt('S3cretP@ss');
    const tampered = {
      ...payload,
      ciphertext: Buffer.from('tampered').toString('base64'),
    };
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('throws on startup when SECRET_ENCRYPTION_KEY is missing', () => {
    delete process.env.SECRET_ENCRYPTION_KEY;
    const fresh = new EncryptionService();
    expect(() => fresh.onModuleInit()).toThrow(
      'SECRET_ENCRYPTION_KEY is not set',
    );
  });

  it('throws on startup when SECRET_ENCRYPTION_KEY is not 32 bytes', () => {
    process.env.SECRET_ENCRYPTION_KEY = Buffer.alloc(16).toString('base64');
    const fresh = new EncryptionService();
    expect(() => fresh.onModuleInit()).toThrow(
      'SECRET_ENCRYPTION_KEY must decode to 32 bytes',
    );
  });
});
