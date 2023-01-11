import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { clearDb, authCustom } from './test-utils';
import { databaseConfig } from '@app/infra';
import { ImmichJwtModule } from '../src/modules/immich-jwt/immich-jwt.module';
import { CreateAdminDto, CreateUserDto, UserResponseDto, UserService } from '@app/domain';
import { DataSource } from 'typeorm';

function _createUser(userService: UserService, data: CreateUserDto | CreateAdminDto) {
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
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [ImmichJwtModule, TypeOrmModule.forRoot(databaseConfig)],
      }).compile();

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

  describe('with auth', () => {
    let userService: UserService;
    let authUser: UserResponseDto;

    beforeAll(async () => {
      const builder = Test.createTestingModule({
        imports: [TypeOrmModule.forRoot(databaseConfig)],
      });
      const moduleFixture: TestingModule = await authCustom(builder, () => authUser).compile();

      app = moduleFixture.createNestApplication();
      userService = app.get(UserService);
      database = app.get(DataSource);
      await app.init();
    });

    describe('with users in DB', () => {
      const authUserEmail = 'auth-user@test.com';
      const userOneEmail = 'one@test.com';
      const userTwoEmail = 'two@test.com';

      beforeAll(async () => {
        // first user must be admin
        authUser = await _createUser(userService, {
          firstName: 'auth-user',
          lastName: 'test',
          email: authUserEmail,
          password: '1234',
          isAdmin: true,
        });
        await Promise.allSettled([
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

      it('fetches the user collection excluding the auth user', async () => {
        const { status, body } = await request(app.getHttpServer()).get('/user?isAll=false');
        expect(status).toEqual(200);
        expect(body).toHaveLength(2);
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
              oauthId: '',
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
              oauthId: '',
            },
          ]),
        );
        expect(body).toEqual(expect.not.arrayContaining([expect.objectContaining({ email: authUserEmail })]));
      });
    });
  });
});
