import { UnauthorizedException } from '@nestjs/common';
import sharp from 'sharp';
import request from 'supertest';
import { FaceController } from 'src/controllers/face.controller.js';
import { Permission } from 'src/enum.js';
import { PersonService } from 'src/services/person.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { PersonFactory } from 'test/factories/person.factory.js';
import { ControllerContext, ServiceMocks, controllerSetup, mockBaseService, newTestService } from 'test/utils.js';

describe(FaceController.name, () => {
  let ctx: ControllerContext;
  let image: Buffer;
  let mocks: ServiceMocks;
  const service = mockBaseService(PersonService);
  const auth = AuthFactory.create();

  beforeAll(async () => {
    ctx = await controllerSetup(FaceController, [{ provide: PersonService, useValue: service }]);
    image = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'white' } })
      .png()
      .toBuffer();
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
    ctx.authenticate.mockResolvedValue(auth);
    const { sut, mocks: repositories } = newTestService(PersonService);
    mocks = repositories;
    service.recognizeFaces.mockImplementation((auth, file) => sut.recognizeFaces(auth, file));
  });

  describe('POST /faces/recognize', () => {
    it('should require authentication before processing the upload', async () => {
      ctx.authenticate.mockRejectedValue(new UnauthorizedException());

      const { status } = await request(ctx.getHttpServer()).post('/faces/recognize').attach('file', image, 'photo.png');

      expect(status).toBe(401);
      expect(service.recognizeFaces).not.toHaveBeenCalled();
    });

    it('should return the matched person and unknown faces in the same response', async () => {
      const person = PersonFactory.create({ ownerId: auth.user.id, name: 'Alice' });
      const face = { boundingBox: { x1: 10, y1: 20, x2: 100, y2: 150 }, embedding: '[1, 0]', score: 0.95 };
      mocks.machineLearning.detectFaces.mockResolvedValue({
        imageWidth: 200,
        imageHeight: 300,
        faces: [face, { ...face, embedding: '[0, 1]' }],
      });
      mocks.search.searchFaceMatch
        .mockResolvedValueOnce({ personGroupId: person.personGroupId, distance: 0.2 })
        .mockResolvedValueOnce(undefined);
      mocks.access.person.checkAccess.mockResolvedValue(
        new Set([{ ownerId: auth.user.id, personGroupId: person.personGroupId }]),
      );
      mocks.person.getByGroupId.mockResolvedValue(person);

      const { status, body } = await request(ctx.getHttpServer())
        .post('/faces/recognize')
        .set('x-api-key', 'key')
        .attach('file', image, 'photo.png');

      expect(status).toBe(200);
      expect(body).toMatchObject({
        imageWidth: 200,
        imageHeight: 300,
        faces: [
          { matched: true, person: { id: person.personGroupId, name: 'Alice' }, distance: 0.2 },
          { matched: false, person: null, distance: null },
        ],
      });
      expect(ctx.authenticate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ permission: Permission.PersonRead, sharedLinkRoute: false }),
        }),
      );
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.asset.create).not.toHaveBeenCalled();
      expect(mocks.machineLearning.detectFaces).toHaveBeenCalledWith(image, expect.anything());
    });
  });
});
