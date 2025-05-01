import { AuthController } from 'src/controllers/auth.controller';
import { AuthService } from 'src/services/auth.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { createControllerTestApp, TestControllerApp } from 'test/medium/utils';

describe(AuthController.name, () => {
  let app: TestControllerApp;

  beforeAll(async () => {
    app = await createControllerTestApp();
  });

  describe('POST /auth/admin-sign-up', () => {
    const name = 'admin';
    const email = 'admin@immich.cloud';
    const password = 'password';

    const invalid = [
      {
        should: 'require an email address',
        data: { name, password },
      },
      {
        should: 'require a password',
        data: { name, email },
      },
      {
        should: 'require a name',
        data: { email, password },
      },
      {
        should: 'require a valid email',
        data: { name, email: 'immich', password },
      },
    ];

    for (const { should, data } of invalid) {
      it(`should ${should}`, async () => {
        const { status, body } = await request(app.getHttpServer()).post('/auth/admin-sign-up').send(data);
        expect(status).toEqual(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }

    it('should transform email to lower case', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/auth/admin-sign-up')
        .send({ name: 'admin', password: 'password', email: 'aDmIn@IMMICH.cloud' });
      expect(status).toEqual(201);
      expect(app.getMockedService(AuthService).adminSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@immich.cloud' }),
      );
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
