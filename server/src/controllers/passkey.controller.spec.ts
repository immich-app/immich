import request from 'supertest';
import { PasskeyController } from 'src/controllers/passkey.controller.js';
import { PasskeyService } from 'src/services/passkey.service.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

const registrationResponse = {
  id: 'credential-id',
  rawId: 'credential-id',
  type: 'public-key',
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'client-data',
    attestationObject: 'attestation-object',
  },
};

const authenticationResponse = {
  id: 'credential-id',
  rawId: 'credential-id',
  type: 'public-key',
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'client-data',
    authenticatorData: 'authenticator-data',
    signature: 'signature',
  },
};

describe(PasskeyController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(PasskeyService);

  beforeAll(async () => {
    ctx = await controllerSetup(PasskeyController, [{ provide: PasskeyService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /passkeys/registration/start', () => {
    it('should be an authenticated route', async () => {
      service.startRegistration.mockResolvedValue({ challenge: 'challenge' } as any);
      await request(ctx.getHttpServer()).post('/passkeys/registration/start');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should respond with 200', async () => {
      service.startRegistration.mockResolvedValue({ challenge: 'challenge' } as any);
      const { status, headers } = await request(ctx.getHttpServer()).post('/passkeys/registration/start');
      expect(status).toEqual(200);
      expect(headers['set-cookie']).toBeUndefined();
    });
  });

  describe('POST /passkeys/registration/finish', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/passkeys/registration/finish');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a response', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/passkeys/registration/finish')
        .send({ name: 'Passkey' });
      expect(status).toEqual(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: ['response'], message: 'Invalid input: expected object, received undefined' },
        ]),
      );
    });

    it('should respond with 201', async () => {
      service.finishRegistration.mockResolvedValue({} as any);
      const { status, headers } = await request(ctx.getHttpServer())
        .post('/passkeys/registration/finish')
        .send({ name: 'Passkey', response: registrationResponse });
      expect(status).toEqual(201);
      expect(headers['set-cookie']).toBeUndefined();
    });
  });

  describe('POST /passkeys/authentication/start', () => {
    it('should be a public route', async () => {
      service.startAuthentication.mockResolvedValue({ challenge: 'challenge' } as any);
      await request(ctx.getHttpServer()).post('/passkeys/authentication/start');
      expect(ctx.authenticate).not.toHaveBeenCalled();
    });

    it('should respond with 200', async () => {
      service.startAuthentication.mockResolvedValue({ challenge: 'challenge' } as any);
      const { status, headers } = await request(ctx.getHttpServer()).post('/passkeys/authentication/start');
      expect(status).toEqual(200);
      expect(headers['set-cookie']).toBeUndefined();
    });
  });

  describe('POST /passkeys/authentication/finish', () => {
    it('should be a public route', async () => {
      await request(ctx.getHttpServer()).post('/passkeys/authentication/finish');
      expect(ctx.authenticate).not.toHaveBeenCalled();
    });

    it('should require a response', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/passkeys/authentication/finish').send({});
      expect(status).toEqual(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: ['response'], message: 'Invalid input: expected object, received undefined' },
        ]),
      );
    });

    it('should require a signature', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/passkeys/authentication/finish')
        .send({ response: { ...authenticationResponse, response: { clientDataJSON: 'client-data' } } });
      expect(status).toEqual(400);
      expect(body).toEqual(
        factory.responses.validationError([
          {
            path: ['response', 'response', 'authenticatorData'],
            message: 'Invalid input: expected string, received undefined',
          },
          {
            path: ['response', 'response', 'signature'],
            message: 'Invalid input: expected string, received undefined',
          },
        ]),
      );
    });

    it('should respond with 201 and set the auth cookies', async () => {
      service.finishAuthentication.mockResolvedValue({ accessToken: 'token' } as any);
      const { status, headers } = await request(ctx.getHttpServer())
        .post('/passkeys/authentication/finish')
        .send({ response: authenticationResponse });
      expect(status).toEqual(201);
      expect(headers['set-cookie']).toEqual([
        expect.stringContaining('immich_access_token=token; Max-Age=34560000; Path=/; Expires='),
        expect.stringContaining('immich_auth_type=passkey; Max-Age=34560000; Path=/; Expires='),
        expect.stringContaining('immich_is_authenticated=true; Max-Age=34560000; Path=/; Expires='),
      ]);
    });
  });

  describe('GET /passkeys', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/passkeys');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should reject an invalid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/passkeys').query({ id: '123' });
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });

  describe('GET /passkeys/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/passkeys/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/passkeys/123');
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });

  describe('PATCH /passkeys/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).patch(`/passkeys/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a name', async () => {
      const { status, body } = await request(ctx.getHttpServer()).patch(`/passkeys/${factory.uuid()}`).send({});
      expect(status).toEqual(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: ['name'], message: 'Invalid input: expected string, received undefined' },
        ]),
      );
    });

    it('should reject an empty name', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .patch(`/passkeys/${factory.uuid()}`)
        .send({ name: '' });
      expect(status).toEqual(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: ['name'], message: 'Too small: expected string to have >=1 characters' },
        ]),
      );
      expect(service.update).not.toHaveBeenCalled();
    });

    it('should allow a null name', async () => {
      const auth = factory.auth();
      const id = factory.uuid();
      ctx.authenticate.mockResolvedValue(auth);
      service.update.mockResolvedValue({} as any);
      const { status } = await request(ctx.getHttpServer()).patch(`/passkeys/${id}`).send({ name: null });
      expect(status).toEqual(200);
      expect(service.update).toHaveBeenCalledWith(auth, id, { name: null });
    });
  });

  describe('DELETE /passkeys/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/passkeys/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).delete('/passkeys/123');
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });
});
