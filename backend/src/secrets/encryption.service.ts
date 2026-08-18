import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

@Injectable()
export class EncryptionService implements OnModuleInit {
  private key!: Buffer;

  onModuleInit() {
    const encoded = process.env.SECRET_ENCRYPTION_KEY;
    if (!encoded) {
      throw new Error('SECRET_ENCRYPTION_KEY is not set');
    }
    const key = Buffer.from(encoded, 'base64');
    if (key.length !== 32) {
      throw new Error('SECRET_ENCRYPTION_KEY must decode to 32 bytes');
    }
    this.key = key;
  }

  encrypt(plaintext: string): EncryptedPayload {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  decrypt(payload: EncryptedPayload): string {
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(payload.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
