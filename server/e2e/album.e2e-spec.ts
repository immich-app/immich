import { AlbumResponseDto, AuthService, CreateAlbumDto, SharedLinkResponseDto, UserService } from '@app/domain';
import { CreateAlbumShareLinkDto } from '@app/immich/api-v1/album/dto/create-album-shared-link.dto';
import { AppModule } from '@app/immich/app.module';
import { AuthUserDto } from '@app/immich/decorators/auth-user.decorator';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { authCustom, clearDb, getAuthUser } from '../test/test-utils';

async function _createAlbum(app: INestApplication, data: CreateAlbumDto) {
  const res = await request(app.getHttpServer()).post('/album').send(data);
  expect(res.status).toEqual(201);
  return res.body as AlbumResponseDto;
}

async function _createAlbumSharedLink(app: INestApplication, data: CreateAlbumShareLinkDto) {
  const res = await request(app.getHttpServer()).post('/album/create-shared-link').send(data);
  expect(res.status).toEqual(201);
  return res.body as SharedLinkResponseDto;
}

describe('Album', () => {
  let app: INestApplication;
  let database: DataSource;

  describe('without auth', () => {
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();

      app = moduleFixture.createNestApplication();
      database = app.get(DataSource);
      await app.init();
    });

    afterAll(async () => {
      await clearDb(database);
      await app.close();
    });

    it('prevents fetching albums if not auth', async () => {
      const { status } = await request(app.getHttpServer()).get('/album');
      expect(status).toEqual(401);
    });
  });

  describe('with auth', () => {
    let userService: UserService;
    let authService: AuthService;
    let authUser: AuthUserDto;

    beforeAll(async () => {
      const builder = Test.createTestingModule({ imports: [AppModule] });
      authUser = getAuthUser();
      const moduleFixture: TestingModule = await authCustom(builder, () => authUser).compile();

      app = moduleFixture.createNestApplication();
      userService = app.get(UserService);
      authService = app.get(AuthService);
      database = app.get(DataSource);
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    describe('with empty DB', () => {
      it('rejects invalid shared param', async () => {
        const { status } = await request(app.getHttpServer()).get('/album?shared=invalid');
        expect(status).toEqual(400);
      });

      it('rejects invalid assetId param', async () => {
        const { status } = await request(app.getHttpServer()).get('/album?assetId=invalid');
        expect(status).toEqual(400);
      });

      // TODO - Until someone figure out how to passed in a logged in user to the request.
      //   it('creates an album', async () => {
      //     const data: CreateAlbumDto = {
      //       albumName: 'first albbum',
      //     };
      //     const body = await _createAlbum(app, data);
      //     expect(body).toEqual(
      //       expect.objectContaining({
      //         ownerId: authUser.id,
      //         albumName: data.albumName,
      //       }),
      //     );
      //   });
    });

    describe('with albums in DB', () => {
      const userOneSharedUser = 'userOneSharedUser';
      const userOneSharedLink = 'userOneSharedLink';
      const userOneNotShared = 'userOneNotShared';
      const userTwoSharedUser = 'userTwoSharedUser';
      const userTwoSharedLink = 'userTwoSharedLink';
      const userTwoNotShared = 'userTwoNotShared';
      let userOne: AuthUserDto;
      let userTwo: AuthUserDto;

      beforeAll(async () => {
        // setup users
        const adminSignUpDto = await authService.adminSignUp({
          email: 'one@test.com',
          password: '1234',
          firstName: 'one',
          lastName: 'test',
        });
        userOne = { ...adminSignUpDto, isAdmin: true }; // TODO: find out why adminSignUp doesn't have isAdmin (maybe can just return UserResponseDto)

        userTwo = await userService.createUser({
          email: 'two@test.com',
          password: '1234',
          firstName: 'two',
          lastName: 'test',
        });

        // add user one albums
        authUser = userOne;
        const userOneAlbums = await Promise.all([
          _createAlbum(app, { albumName: userOneSharedUser, sharedWithUserIds: [userTwo.id] }),
          _createAlbum(app, { albumName: userOneSharedLink }),
          _createAlbum(app, { albumName: userOneNotShared }),
        ]);

        // add shared link to userOneSharedLink album
        await _createAlbumSharedLink(app, { albumId: userOneAlbums[1].id });

        // add user two albums
        authUser = userTwo;
        const userTwoAlbums = await Promise.all([
          _createAlbum(app, { albumName: userTwoSharedUser, sharedWithUserIds: [userOne.id] }),
          _createAlbum(app, { albumName: userTwoSharedLink }),
          _createAlbum(app, { albumName: userTwoNotShared }),
        ]);

        // add shared link to userTwoSharedLink album
        await _createAlbumSharedLink(app, { albumId: userTwoAlbums[1].id });

        // set user one as authed for next requests
        authUser = userOne;
      });

      afterAll(async () => {
        await clearDb(database);
      });

      it('returns the album collection including owned and shared', async () => {
        const { status, body } = await request(app.getHttpServer()).get('/album');
        expect(status).toEqual(200);
        expect(body).toHaveLength(3);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ ownerId: userOne.id, albumName: userOneSharedUser, shared: true }),
            expect.objectContaining({ ownerId: userOne.id, albumName: userOneSharedLink, shared: true }),
            expect.objectContaining({ ownerId: userOne.id, albumName: userOneNotShared, shared: false }),
          ]),
        );
      });

      it('returns the album collection filtered by shared', async () => {
        const { status, body } = await request(app.getHttpServer()).get('/album?shared=true');
        expect(status).toEqual(200);
        expect(body).toHaveLength(3);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ ownerId: userOne.id, albumName: userOneSharedUser, shared: true }),
            expect.objectContaining({ ownerId: userOne.id, albumName: userOneSharedLink, shared: true }),
            expect.objectContaining({ ownerId: userTwo.id, albumName: userTwoSharedUser, shared: true }),
          ]),
        );
      });

      it('returns the album collection filtered by NOT shared', async () => {
        const { status, body } = await request(app.getHttpServer()).get('/album?shared=false');
        expect(status).toEqual(200);
        expect(body).toHaveLength(1);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ ownerId: userOne.id, albumName: userOneNotShared, shared: false }),
          ]),
        );
      });

      // TODO: Add asset to album and test if it returns correctly.
      it('returns the album collection filtered by assetId', async () => {
        const { status, body } = await request(app.getHttpServer()).get(
          '/album?assetId=ecb120db-45a2-4a65-9293-51476f0d8790',
        );
        expect(status).toEqual(200);
        expect(body).toHaveLength(0);
      });

      // TODO: Add asset to album and test if it returns correctly.
      it('returns the album collection filtered by assetId and ignores shared=true', async () => {
        const { status, body } = await request(app.getHttpServer()).get(
          '/album?shared=true&assetId=ecb120db-45a2-4a65-9293-51476f0d8790',
        );
        expect(status).toEqual(200);
        expect(body).toHaveLength(0);
      });

      // TODO: Add asset to album and test if it returns correctly.
      it('returns the album collection filtered by assetId and ignores shared=false', async () => {
        const { status, body } = await request(app.getHttpServer()).get(
          '/album?shared=false&assetId=ecb120db-45a2-4a65-9293-51476f0d8790',
        );
        expect(status).toEqual(200);
        expect(body).toHaveLength(0);
      });
    });
  });
});
