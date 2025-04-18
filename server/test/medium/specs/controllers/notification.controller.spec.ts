import { NotificationController } from 'src/controllers/notification.controller';
import { AuthService } from 'src/services/auth.service';
import { NotificationService } from 'src/services/notification.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { createControllerTestApp, TestControllerApp } from 'test/medium/utils';
import { factory } from 'test/small.factory';

describe(NotificationController.name, () => {
  let realApp: TestControllerApp;
  let mockApp: TestControllerApp;

  beforeEach(async () => {
    realApp = await createControllerTestApp({ authType: 'real' });
    mockApp = await createControllerTestApp({ authType: 'mock' });
  });

  describe('GET /notifications', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(realApp.getHttpServer()).get('/notifications');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should call the service with an auth dto', async () => {
      const auth = factory.auth({ user: factory.user() });
      mockApp.getMockedService(AuthService).authenticate.mockResolvedValue(auth);
      const service = mockApp.getMockedService(NotificationService);

      const { status } = await request(mockApp.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(service.search).toHaveBeenCalledWith(auth, {});
    });

    it(`should reject an invalid notification level`, async () => {
      const auth = factory.auth({ user: factory.user() });
      mockApp.getMockedService(AuthService).authenticate.mockResolvedValue(auth);
      const service = mockApp.getMockedService(NotificationService);

      const { status, body } = await request(mockApp.getHttpServer())
        .get(`/notifications`)
        .query({ level: 'invalid' })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest([expect.stringContaining('level must be one of the following values')]));
      expect(service.search).not.toHaveBeenCalled();
    });
  });

  describe('PUT /notifications', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(realApp.getHttpServer())
        .put(`/notifications`)
        .send({ ids: [], readAt: new Date().toISOString() });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('GET /notifications/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(realApp.getHttpServer()).get(`/notifications/${factory.uuid()}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('PUT /notifications/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(realApp.getHttpServer())
        .put(`/notifications/${factory.uuid()}`)
        .send({ readAt: factory.date() });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  afterAll(async () => {
    await realApp.close();
    await mockApp.close();
  });
});
