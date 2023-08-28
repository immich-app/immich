import { IPersonRepository, LoginResponseDto } from '@app/domain';
import { AppModule, PersonController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { errorStub, uuidStub } from '../fixtures';
import { api, db } from '../test-utils';

describe(`${PersonController.name}`, () => {
  let app: INestApplication;
  let server: any;
  let loginResponse: LoginResponseDto;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleFixture.createNestApplication().init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await db.reset();
    await api.adminSignUp(server);
    loginResponse = await api.adminLogin(server);
    accessToken = loginResponse.accessToken;
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
  });

  describe('PUT /person/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).put(`/person/${uuidStub.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should not accept invalid dates', async () => {
      for (const birthDate of [false, 'false', '123567', 123456]) {
        const { status, body } = await request(server)
          .put(`/person/${uuidStub.notFound}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ birthDate });
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest);
      }
    });
    it('should update a date of birth', async () => {
      const personRepository = app.get<IPersonRepository>(IPersonRepository);
      const person = await personRepository.create({ ownerId: loginResponse.userId });
      const { status, body } = await request(server)
        .put(`/person/${person.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ birthDate: '1990-01-01T05:00:00.000Z' });
      expect(status).toBe(200);
      expect(body).toMatchObject({ birthDate: '1990-01-01' });
    });

    it('should clear a date of birth', async () => {
      const personRepository = app.get<IPersonRepository>(IPersonRepository);
      const person = await personRepository.create({
        birthDate: new Date('1990-01-01'),
        ownerId: loginResponse.userId,
      });

      expect(person.birthDate).toBeDefined();

      const { status, body } = await request(server)
        .put(`/person/${person.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ birthDate: null });
      expect(status).toBe(200);
      expect(body).toMatchObject({ birthDate: null });
    });
  });
});
