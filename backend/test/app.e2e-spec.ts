import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DRIZZLE, Db } from './../src/db/db.module';
import * as schema from './../src/db/schema';
import { EncryptionService } from './../src/secrets/encryption.service';

describe('Secrets flow (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a secret, reveals it once, then 404s on every later attempt', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/secrets')
      .send({ password: 'S3cretP@ss' })
      .expect(201);

    const createBody = createRes.body as {
      id: string;
      expiresAt: string | null;
    };
    expect(createBody.id).toEqual(expect.any(String));
    const { id } = createBody;

    const viewRes = await request(app.getHttpServer())
      .get(`/secrets/${id}`)
      .expect(200);
    const viewBody = viewRes.body as { password: string };
    expect(viewBody.password).toBe('S3cretP@ss');

    await request(app.getHttpServer()).get(`/secrets/${id}`).expect(404);
    await request(app.getHttpServer()).get(`/secrets/${id}`).expect(404);
  });

  it('404s for an id that never existed', async () => {
    await request(app.getHttpServer())
      .get('/secrets/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('rejects an empty password with a validation error', async () => {
    await request(app.getHttpServer())
      .post('/secrets')
      .send({ password: '' })
      .expect(400);
  });

  it('404s a secret whose expiry is already in the past', async () => {
    const db = moduleFixture.get<Db>(DRIZZLE);
    const encryption = moduleFixture.get(EncryptionService);
    const payload = encryption.encrypt('already-expired');

    const [row] = await db
      .insert(schema.secrets)
      .values({
        ...payload,
        expiresAt: new Date(Date.now() - 60_000),
      })
      .returning({ id: schema.secrets.id });

    await request(app.getHttpServer()).get(`/secrets/${row.id}`).expect(404);
  });
});
