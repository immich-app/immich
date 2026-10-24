import { Kysely } from 'kysely';
import request from 'supertest';
import { AuthController } from 'src/controllers/auth.controller.js';
import { LockedAlbumController } from 'src/controllers/locked-album.controller.js';
import { Permission } from 'src/enum.js';
import { ApiKeyRepository } from 'src/repositories/api-key.repository.js';
import { CryptoRepository } from 'src/repositories/crypto.repository.js';
import { LockedAlbumRepository } from 'src/repositories/locked-album.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { SessionRepository } from 'src/repositories/session.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { DB } from 'src/schema/index.js';
import { AuthService } from 'src/services/auth.service.js';
import { LockedAlbumService } from 'src/services/locked-album.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { controllerSetup, getKyselyDB } from 'test/utils.js';

describe('Private groups with real PostgreSQL token/PIN authentication', () => {
  let database: Kysely<DB>;

  beforeAll(async () => {
    database = await getKyselyDB();
    return () => database.destroy();
  });

  const setup = async () => {
    const { sut: auth, ctx } = newMediumService(AuthService, {
      database,
      real: [CryptoRepository, SessionRepository, UserRepository, ApiKeyRepository],
      mock: [LoggingRepository],
    });
    const crypto = ctx.get(CryptoRepository);
    const { user } = await ctx.newUser({ pinCode: await crypto.hashBcrypt('123456', 4) });
    const token = crypto.randomBytesAsText(32);
    const session = await ctx.get(SessionRepository).create({
      userId: user.id,
      token: crypto.hashSha256(token),
      expiresAt: new Date(Date.now() + 3_600_000),
      pinExpiresAt: null,
    });
    const http = await controllerSetup(
      [AuthController, LockedAlbumController],
      [
        LockedAlbumService,
        { provide: LockedAlbumRepository, useValue: new LockedAlbumRepository(database) },
        {
          provide: AuthService,
          useValue: {
            // The adapter records calls only: all authentication, bcrypt checks,
            // session expiry and elevation below use the actual service and SQL.
            authenticate: vi.fn(auth.authenticate.bind(auth)),
            requireSetupAvailable: vi.fn(),
            unlockSession: auth.unlockSession.bind(auth),
            lockSession: auth.lockSession.bind(auth),
            getAuthStatus: auth.getAuthStatus.bind(auth),
          },
        },
      ],
    );
    const api = () => request(http.getHttpServer());
    return { api, http, ctx, user, session, token, crypto };
  };

  it('requires the correct PIN and rejects access immediately after expiry or relocking', async () => {
    const { api, http, session, token } = await setup();
    const header = `Bearer ${token}`;
    try {
      await api().get('/locked-albums').set('Authorization', header).expect(401);
      await api().post('/auth/session/unlock').set('Authorization', header).send({ pinCode: '000000' }).expect(400);
      await api().get('/locked-albums').set('Authorization', header).expect(401);
      await api().post('/auth/session/unlock').set('Authorization', header).send({ pinCode: '123456' }).expect(204);
      const created = await api()
        .post('/locked-albums')
        .set('Authorization', header)
        .send({ albumName: 'Real PIN synthetic group' })
        .expect(201);
      const path = `/locked-albums/${created.body.id}`;
      await api().get(path).set('Authorization', header).expect(200);
      await database
        .updateTable('session')
        .set({ pinExpiresAt: new Date(Date.now() - 1000) })
        .where('id', '=', session.id)
        .execute();
      await api().get(path).set('Authorization', header).expect(401);
      await api().post('/auth/session/unlock').set('Authorization', header).send({ pinCode: '123456' }).expect(204);
      await api().get(path).set('Authorization', header).expect(200);
      await api().post('/auth/session/lock').set('Authorization', header).expect(204);
      await api().get(path).set('Authorization', header).expect(401);
    } finally {
      await http.close();
    }
  });

  it('rejects genuinely valid API keys and expired/deleted session tokens', async () => {
    const { api, http, ctx, user, session, token, crypto } = await setup();
    try {
      const key = crypto.randomBytesAsText(32);
      await ctx.get(ApiKeyRepository).create({
        name: 'Synthetic denied key',
        userId: user.id,
        key: crypto.hashSha256(key),
        permissions: [Permission.All],
      });
      await api().get('/locked-albums').set('x-api-key', key).expect(401);
      await ctx.get(SessionRepository).update(session.id, {
        pinExpiresAt: new Date(Date.now() + 60_000),
        expiresAt: new Date(Date.now() - 1000),
      });
      await api().get('/locked-albums').set('Authorization', `Bearer ${token}`).expect(401);
      await ctx.get(SessionRepository).delete(session.id);
      await api().get('/locked-albums').set('Authorization', `Bearer ${token}`).expect(401);
    } finally {
      await http.close();
    }
  });
});
