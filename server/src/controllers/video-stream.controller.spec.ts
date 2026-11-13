import request from 'supertest';
import { VideoStreamController } from 'src/controllers/video-stream.controller.js';
import { ImmichHeader } from 'src/enum.js';
import { HlsService } from 'src/services/hls.service.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

describe(VideoStreamController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(HlsService);

  beforeAll(async () => {
    ctx = await controllerSetup(VideoStreamController, [{ provide: HlsService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /assets/:id/video/stream/:sessionId/:variantIndex/playlist.m3u8', () => {
    const url = `/assets/${factory.uuid()}/video/stream/${factory.uuid()}/0/playlist.m3u8`;

    it('should reject a non-numeric position header', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(url).set(ImmichHeader.HlsPosition, 'abc');
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: [ImmichHeader.HlsPosition], message: 'Invalid input: expected number, received NaN' },
        ]),
      );
      expect(service.getMediaPlaylist).not.toHaveBeenCalled();
    });

    it('should pass the position header to the service as a number', async () => {
      service.getMediaPlaylist.mockResolvedValue('#EXTM3U');
      const { status } = await request(ctx.getHttpServer()).get(url).set(ImmichHeader.HlsPosition, '12.5');
      expect(status).toBe(200);
      expect(service.getMediaPlaylist).toHaveBeenCalledWith(undefined, expect.any(String), expect.any(String), 0, 12.5);
    });
  });
});
