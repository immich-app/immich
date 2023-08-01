import { AppModule, UserController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { uuidStub } from '../fixtures';
import { api, db } from '../test-utils';

describe(`${UserController.name}`, () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleFixture.createNestApplication().init();
    server = app.getHttpServer();
    await db.reset();
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
  });

  describe('GET /user', () => {
    it('should not work without authentication', async () => {
      const { status } = await request(server).get('/user');
      expect(status).toEqual(401);
    });

    it('should start with the admin', async () => {
      await api.adminSignUp(server);
      const { accessToken } = await api.adminLogin(server);
      const { status, body } = await request(server).get('/user').set('Authorization', `Bearer ${accessToken}`);
      expect(status).toEqual(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({ email: 'admin@immich.app' });
    });
  });

  describe('GET /user/info/:id', () => {
    it('should not work without authentication', async () => {
      const { status } = await request(server).get(`/user/info/${uuidStub.invalid}`);
      expect(status).toEqual(401);
    });
  });

  describe('GET /user/me', () => {
    it('should not work without authentication', async () => {
      const { status } = await request(server).get(`/user/me`);
      expect(status).toEqual(401);
    });
  });

  describe('POST /user', () => {
    it('should not work without authentication', async () => {
      const { status } = await request(server)
        .post(`/user`)
        .send({ email: 'user1@immich.app', password: 'Password123', firstName: 'Immich', lastName: 'User' });
      expect(status).toEqual(401);
    });
  });

  describe('GET /user/count', () => {
    it('should work without authentication', async () => {
      const { status, body } = await request(server).get(`/user/count`);
      expect(status).toEqual(200);
      expect(body).toEqual({ userCount: 1 });
    });
  });
});

// describe('with admin auth', () => {
//   let userService: UserService;
//   let authService: AuthService;
//   let authUser: AuthUserDto;
//   let userOne: UserResponseDto;

//   beforeAll(async () => {
//     const builder = Test.createTestingModule({ imports: [AppModule] });
//     const moduleFixture: TestingModule = await authCustom(builder, () => authUser).compile();

//     app = moduleFixture.createNestApplication();
//     userService = app.get(UserService);
//     authService = app.get(AuthService);
//     await app.init();
//   });

//   describe('with users in DB', () => {
//     const authUserEmail = 'auth-user@test.com';
//     const userOneEmail = 'one@test.com';
//     const userTwoEmail = 'two@test.com';

//     beforeAll(async () => {
//       // first user must be admin
//       const adminSignupResponseDto = await authService.adminSignUp({
//         firstName: 'auth-user',
//         lastName: 'test',
//         email: authUserEmail,
//         password: '1234',
//       });
//       authUser = { ...adminSignupResponseDto, isAdmin: true }; // TODO: find out why adminSignUp doesn't have isAdmin (maybe can just return UserResponseDto)

//       [userOne] = await Promise.all([
//         _createUser(userService, {
//           firstName: 'one',
//           lastName: 'test',
//           email: userOneEmail,
//           password: '1234',
//         }),
//         _createUser(userService, {
//           firstName: 'two',
//           lastName: 'test',
//           email: userTwoEmail,
//           password: '1234',
//         }),
//       ]);
//     });

//     it('fetches the user collection including the auth user', async () => {
//       const { status, body } = await request(app.getHttpServer()).get('/user?isAll=false');
//       expect(status).toEqual(200);
//       expect(body).toHaveLength(3);
//       expect(body).toEqual(
//         expect.arrayContaining([
//           {
//             email: userOneEmail,
//             firstName: 'one',
//             lastName: 'test',
//             id: expect.anything(),
//             createdAt: expect.anything(),
//             isAdmin: false,
//             shouldChangePassword: true,
//             profileImagePath: '',
//             deletedAt: null,
//             updatedAt: expect.anything(),
//             oauthId: '',
//             storageLabel: null,
//             externalPath: null,
//           },
//           {
//             email: userTwoEmail,
//             firstName: 'two',
//             lastName: 'test',
//             id: expect.anything(),
//             createdAt: expect.anything(),
//             isAdmin: false,
//             shouldChangePassword: true,
//             profileImagePath: '',
//             deletedAt: null,
//             updatedAt: expect.anything(),
//             oauthId: '',
//             storageLabel: null,
//             externalPath: null,
//           },
//           {
//             email: authUserEmail,
//             firstName: 'auth-user',
//             lastName: 'test',
//             id: expect.anything(),
//             createdAt: expect.anything(),
//             isAdmin: true,
//             shouldChangePassword: true,
//             profileImagePath: '',
//             deletedAt: null,
//             updatedAt: expect.anything(),
//             oauthId: '',
//             storageLabel: 'admin',
//             externalPath: null,
//           },
//         ]),
//       );
//     });

//     it('disallows admin user from creating a second admin account', async () => {
//       const { status } = await request(app.getHttpServer())
//         .put('/user')
//         .send({
//           ...userOne,
//           isAdmin: true,
//         });
//       expect(status).toEqual(400);
//     });

//     it('ignores updates to createdAt, updatedAt and deletedAt', async () => {
//       const { status, body } = await request(app.getHttpServer())
//         .put('/user')
//         .send({
//           ...userOne,
//           createdAt: '2023-01-01T00:00:00.000Z',
//           updatedAt: '2023-01-01T00:00:00.000Z',
//           deletedAt: '2023-01-01T00:00:00.000Z',
//         });
//       expect(status).toEqual(200);
//       expect(body).toStrictEqual({
//         ...userOne,
//         createdAt: new Date(userOne.createdAt).toISOString(),
//         updatedAt: expect.anything(),
//       });
//     });

//     it('ignores updates to profileImagePath', async () => {
//       const { status, body } = await request(app.getHttpServer())
//         .put('/user')
//         .send({
//           ...userOne,
//           profileImagePath: 'invalid.jpg',
//         });
//       expect(status).toEqual(200);
//       expect(body).toStrictEqual({
//         ...userOne,
//         createdAt: new Date(userOne.createdAt).toISOString(),
//         updatedAt: expect.anything(),
//       });
//     });

//     it('allows to update first and last name', async () => {
//       const { status, body } = await request(app.getHttpServer())
//         .put('/user')
//         .send({
//           ...userOne,
//           firstName: 'newFirstName',
//           lastName: 'newLastName',
//         });

//       expect(status).toEqual(200);
//       expect(body).toMatchObject({
//         ...userOne,
//         createdAt: new Date(userOne.createdAt).toISOString(),
//         updatedAt: expect.anything(),
//         firstName: 'newFirstName',
//         lastName: 'newLastName',
//       });
//     });
//   });
