import { UserController } from 'src/controllers/user.controller';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { UserService } from 'src/services/user.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(UserController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(UserService);

  beforeAll(async () => {
    ctx = await controllerSetup(UserController, [
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
      { provide: UserService, useValue: service },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('PUT /users/me', () => {
    for (const [key, message] of [
      ['email', 'Invalid input: expected email, received object'],
      ['name', 'Invalid input: expected string, received null'],
    ] as const) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(ctx.getHttpServer())
          .put(`/users/me`)
          .set('Authorization', `Bearer token`)
          .send({ [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.validationError([{ path: [key], message }]));
      });
    }

    it('should allow an empty avatarColor', async () => {
      await request(ctx.getHttpServer())
        .put(`/users/me`)
        .set('Authorization', `Bearer token`)
        .send({ avatarColor: null });
      expect(service.updateMe).toHaveBeenCalledWith(undefined, expect.objectContaining({ avatarColor: null }));
    });
  });

  describe('PUT /users/me/preferences', () => {
    it('should require an integer for download archive size', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/users/me/preferences`)
        .set('Authorization', `Bearer token`)
        .send({ download: { archiveSize: 1_234_567.89 } });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([
          { path: ['download', 'archiveSize'], message: 'Invalid input: expected int, received number' },
        ]),
      );
    });

    it('should require a boolean for download include embedded videos', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/users/me/preferences`)
        .set('Authorization', `Bearer token`)
        .send({ download: { includeEmbeddedVideos: 1_234_567.89 } });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([
          { path: ['download', 'includeEmbeddedVideos'], message: 'Invalid input: expected boolean, received number' },
        ]),
      );
    });
  });
});
