import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { clearDb, getAuthUser, authCustom } from './test-utils';
import { InfraModule } from '@app/infra';
import { AlbumModule } from '../src/api-v1/album/album.module';
import { CreateAlbumDto } from '../src/api-v1/album/dto/create-album.dto';
import { AuthUserDto } from '../src/decorators/auth-user.decorator';
import { AuthService, DomainModule, UserService } from '@app/domain';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

function _createAlbum(app: INestApplication, data: CreateAlbumDto) {
  return request(app.getHttpServer()).post('/album').send(data);
}

describe('Album', () => {
  let app: INestApplication;
  let database: DataSource;

  describe('without auth', () => {
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [DomainModule.register({ imports: [InfraModule] }), AlbumModule, AppModule],
      }).compile();

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
    let authUser: AuthUserDto;
    let userService: UserService;
    let authService: AuthService;

    beforeAll(async () => {
      const builder = Test.createTestingModule({
        imports: [DomainModule.register({ imports: [InfraModule] }), AlbumModule],
      });
      authUser = getAuthUser(); // set default auth user
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
      afterEach(async () => {
        await clearDb(database);
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
      const userOneShared = 'userOneShared';
      const userOneNotShared = 'userOneNotShared';
      const userTwoShared = 'userTwoShared';
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
        await Promise.all([
          _createAlbum(app, { albumName: userOneShared, sharedWithUserIds: [userTwo.id] }),
          _createAlbum(app, { albumName: userOneNotShared }),
        ]);
        // add user two albums
        authUser = userTwo;
        await Promise.all([
          _createAlbum(app, { albumName: userTwoShared, sharedWithUserIds: [userOne.id] }),
          _createAlbum(app, { albumName: userTwoNotShared }),
        ]);
        // set user one as authed for next requests
        authUser = userOne;
      });

      afterAll(async () => {
        await clearDb(database);
      });

      it('returns the album collection including owned and shared', async () => {
        const { status, body } = await request(app.getHttpServer()).get('/album');
        expect(status).toEqual(200);
        expect(body).toHaveLength(2);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ ownerId: userOne.id, albumName: userOneShared, shared: true }),
            expect.objectContaining({ ownerId: userOne.id, albumName: userOneNotShared, shared: false }),
          ]),
        );
      });

      it('returns the album collection filtered by shared', async () => {
        const { status, body } = await request(app.getHttpServer()).get('/album?shared=true');
        expect(status).toEqual(200);
        expect(body).toHaveLength(2);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ ownerId: userOne.id, albumName: userOneShared, shared: true }),
            expect.objectContaining({ ownerId: userTwo.id, albumName: userTwoShared, shared: true }),
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
    });
  });
});
