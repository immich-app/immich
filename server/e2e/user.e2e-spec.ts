import { AuthService, AuthUserDto, CreateUserDto, UserResponseDto, UserService } from '@app/domain';
import { AppModule } from '@app/immich/app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { authCustom, clearDb } from '../test/test-utils';

function _createUser(userService: UserService, data: CreateUserDto) {
  return userService.createUser(data);
}

describe('User', () => {
  let app: INestApplication;
  let database: DataSource;

  afterAll(async () => {
    await clearDb(database);
    await app.close();
  });

  describe('without auth', () => {
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();

      app = moduleFixture.createNestApplication();
      database = app.get(DataSource);
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('prevents fetching users if not auth', async () => {
      const { status } = await request(app.getHttpServer()).get('/user');
      expect(status).toEqual(401);
    });
  });

  describe('with admin auth', () => {
    let userService: UserService;
    let authService: AuthService;
    let authUser: AuthUserDto;
    let userOne: UserResponseDto;

    beforeAll(async () => {
      const builder = Test.createTestingModule({ imports: [AppModule] });
      const moduleFixture: TestingModule = await authCustom(builder, () => authUser).compile();

      app = moduleFixture.createNestApplication();
      userService = app.get(UserService);
      authService = app.get(AuthService);
      database = app.get(DataSource);
      await app.init();
    });

    describe('with users in DB', () => {
      const authUserEmail = 'auth-user@test.com';
      const userOneEmail = 'one@test.com';
      const userTwoEmail = 'two@test.com';

      beforeAll(async () => {
        // first user must be admin
        const adminSignupResponseDto = await authService.adminSignUp({
          firstName: 'auth-user',
          lastName: 'test',
          email: authUserEmail,
          password: '1234',
        });
        authUser = { ...adminSignupResponseDto, isAdmin: true }; // TODO: find out why adminSignUp doesn't have isAdmin (maybe can just return UserResponseDto)

        [userOne] = await Promise.all([
          _createUser(userService, {
            firstName: 'one',
            lastName: 'test',
            email: userOneEmail,
            password: '1234',
          }),
          _createUser(userService, {
            firstName: 'two',
            lastName: 'test',
            email: userTwoEmail,
            password: '1234',
          }),
        ]);
      });

      it('fetches the user collection including the auth user', async () => {
        const { status, body } = await request(app.getHttpServer()).get('/user?isAll=false');
        expect(status).toEqual(200);
        expect(body).toHaveLength(3);
        expect(body).toEqual(
          expect.arrayContaining([
            {
              email: userOneEmail,
              firstName: 'one',
              lastName: 'test',
              id: expect.anything(),
              createdAt: expect.anything(),
              isAdmin: false,
              shouldChangePassword: true,
              profileImagePath: '',
              deletedAt: null,
              updatedAt: expect.anything(),
              oauthId: '',
              storageLabel: null,
            },
            {
              email: userTwoEmail,
              firstName: 'two',
              lastName: 'test',
              id: expect.anything(),
              createdAt: expect.anything(),
              isAdmin: false,
              shouldChangePassword: true,
              profileImagePath: '',
              deletedAt: null,
              updatedAt: expect.anything(),
              oauthId: '',
              storageLabel: null,
            },
            {
              email: authUserEmail,
              firstName: 'auth-user',
              lastName: 'test',
              id: expect.anything(),
              createdAt: expect.anything(),
              isAdmin: true,
              shouldChangePassword: true,
              profileImagePath: '',
              deletedAt: null,
              updatedAt: expect.anything(),
              oauthId: '',
              storageLabel: 'admin',
            },
          ]),
        );
      });

      it('disallows admin user from creating a second admin account', async () => {
        const { status } = await request(app.getHttpServer())
          .put('/user')
          .send({
            ...userOne,
            isAdmin: true,
          });
        expect(status).toEqual(400);
      });

      it('ignores updates to createdAt, updatedAt and deletedAt', async () => {
        const { status, body } = await request(app.getHttpServer())
          .put('/user')
          .send({
            ...userOne,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            deletedAt: '2023-01-01T00:00:00.000Z',
          });
        expect(status).toEqual(200);
        expect(body).toStrictEqual({
          ...userOne,
          createdAt: new Date(userOne.createdAt).toISOString(),
          updatedAt: expect.anything(),
        });
      });

      it('ignores updates to profileImagePath', async () => {
        const { status, body } = await request(app.getHttpServer())
          .put('/user')
          .send({
            ...userOne,
            profileImagePath: 'invalid.jpg',
          });
        expect(status).toEqual(200);
        expect(body).toStrictEqual({
          ...userOne,
          createdAt: new Date(userOne.createdAt).toISOString(),
          updatedAt: expect.anything(),
        });
      });

      it('allows to update first and last name', async () => {
        const { status, body } = await request(app.getHttpServer())
          .put('/user')
          .send({
            ...userOne,
            firstName: 'newFirstName',
            lastName: 'newLastName',
          });

        expect(status).toEqual(200);
        expect(body).toMatchObject({
          ...userOne,
          createdAt: new Date(userOne.createdAt).toISOString(),
          updatedAt: expect.anything(),
          firstName: 'newFirstName',
          lastName: 'newLastName',
        });
      });
    });
  });
});
