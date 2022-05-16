import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { clearDb, auth, getAuthUser } from './test-utils';
import { databaseConfig } from '../src/config/database.config';
import { AlbumModule } from '../src/api-v1/album/album.module';
import { CreateAlbumDto } from '../src/api-v1/album/dto/create-album.dto';
import { ImmichJwtModule } from '../src/modules/immich-jwt/immich-jwt.module';

function _createAlbum(app: INestApplication, data: CreateAlbumDto) {
  return request(app.getHttpServer()).post('/album').send(data);
}

describe('Album', () => {
  let app: INestApplication;

  afterAll(async () => {
    await clearDb();
    await app.close();
  });

  describe('without auth', () => {
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AlbumModule, ImmichJwtModule, TypeOrmModule.forRoot(databaseConfig)],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('prevents fetching albums if not auth', async () => {
      const { status } = await request(app.getHttpServer()).get('/album');
      expect(status).toEqual(401);
    });
  });

  describe('with auth', () => {
    const authUser = Object.freeze(getAuthUser());

    beforeAll(async () => {
      const builder = Test.createTestingModule({
        imports: [AlbumModule, TypeOrmModule.forRoot(databaseConfig)],
      });
      const moduleFixture: TestingModule = await auth(builder).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    describe('with empty DB', () => {
      afterEach(async () => {
        await clearDb();
      });

      it('creates an album', async () => {
        const data: CreateAlbumDto = {
          albumName: 'first albbum',
        };
        const { status, body } = await _createAlbum(app, data);
        expect(status).toEqual(201);
        expect(body).toEqual(
          expect.objectContaining({
            ownerId: authUser.id,
            albumName: data.albumName,
          }),
        );
      });
    });

    describe('with albums in DB', () => {
      const ownAlbumOne = 'firstAlbum';
      const ownAlbumTwo = 'secondAlbum';

      beforeAll(async () => {
        return Promise.allSettled([
          _createAlbum(app, { albumName: ownAlbumOne }),
          _createAlbum(app, { albumName: ownAlbumTwo }),
        ]);
      });

      it('returns the album collection', async () => {
        const { status, body } = await request(app.getHttpServer()).get('/album');
        expect(status).toEqual(200);
        expect(body).toHaveLength(2);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ ownerId: authUser.id, albumName: ownAlbumOne }),
            expect.objectContaining({ ownerId: authUser.id, albumName: ownAlbumTwo }),
          ]),
        );
      });
    });
  });
});
