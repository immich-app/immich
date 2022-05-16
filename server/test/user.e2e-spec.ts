import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { clearDb, authCustom } from './test-utils';
import { databaseConfig } from '../src/config/database.config';
import { UserModule } from '../src/api-v1/user/user.module';
import { AuthModule } from '../src/api-v1/auth/auth.module';
import { AuthService } from '../src/api-v1/auth/auth.service';
import { ImmichJwtModule } from '../src/modules/immich-jwt/immich-jwt.module';
import { SignUpDto } from '../src/api-v1/auth/dto/sign-up.dto';
import { AuthUserDto } from '../src/decorators/auth-user.decorator';

function _createUser(authService: AuthService, data: SignUpDto) {
  return authService.signUp(data);
}

describe('User', () => {
  let app: INestApplication;

  afterAll(async () => {
    await clearDb();
    await app.close();
  });

  describe('without auth', () => {
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [UserModule, ImmichJwtModule, TypeOrmModule.forRoot(databaseConfig)],
      }).compile();

      app = moduleFixture.createNestApplication();
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
    let authService: AuthService;
    let authUser: AuthUserDto;

    beforeAll(async () => {
      const builder = Test.createTestingModule({
        imports: [UserModule, AuthModule, TypeOrmModule.forRoot(databaseConfig)],
      });
      const moduleFixture: TestingModule = await authCustom(builder, () => authUser).compile();

      app = moduleFixture.createNestApplication();
      authService = app.get(AuthService);
      await app.init();
    });

    describe('with users in DB', () => {
      const authUserEmail = 'auth-user@test.com';
      const userOneEmail = 'one@test.com';
      const userTwoEmail = 'two@test.com';

      beforeAll(async () => {
        await Promise.allSettled([
          _createUser(authService, { email: authUserEmail, password: '1234' }).then((user) => (authUser = user)),
          _createUser(authService, { email: userOneEmail, password: '1234' }),
          _createUser(authService, { email: userTwoEmail, password: '1234' }),
        ]);
      });

      it('fetches the user collection excluding the auth user', async () => {
        const { status, body } = await request(app.getHttpServer()).get('/user');
        expect(status).toEqual(200);
        expect(body).toHaveLength(2);
        expect(body).toEqual(
          expect.arrayContaining([
            {
              email: userOneEmail,
              id: expect.anything(),
              createdAt: expect.anything(),
            },
            {
              email: userTwoEmail,
              id: expect.anything(),
              createdAt: expect.anything(),
            },
          ]),
        );
        expect(body).toEqual(expect.not.arrayContaining([expect.objectContaining({ email: authUserEmail })]));
      });
    });
  });
});
