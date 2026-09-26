import request from 'supertest';
import { VideoStreamController } from 'src/controllers/video-stream.controller.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { HlsService } from 'src/services/hls.service.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, automock, controllerSetup, mockBaseService } from 'test/utils.js';

describe(VideoStreamController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(HlsService);
  const path = `/assets/${factory.uuid()}/video/stream`;

  beforeAll(async () => {
    ctx = await controllerSetup(VideoStreamController, [
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
      { provide: HlsService, useValue: service },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  it('allows the receiver to read authenticated HLS playlists across origins', async () => {
    service.getMainPlaylist.mockResolvedValue('#EXTM3U\n');
    const response = await request(ctx.getHttpServer()).get(`${path}/main.m3u8?sessionKey=cast-token`);
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(response.headers['content-type']).toContain('mpegurl');
  });

  it('does not relax origin policy for normal browser requests', async () => {
    service.getMainPlaylist.mockResolvedValue('#EXTM3U\n');
    const response = await request(ctx.getHttpServer()).get(`${path}/main.m3u8`);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows cleanup preflight and deletes the HLS session', async () => {
    const sessionId = factory.uuid();
    const url = `${path}/${sessionId}?sessionKey=cast-token`;
    const preflight = await request(ctx.getHttpServer()).options(url).set('Access-Control-Request-Method', 'DELETE');
    expect(preflight.status).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe('*');
    expect(preflight.headers['access-control-allow-methods']).toContain('DELETE');
    const response = await request(ctx.getHttpServer()).delete(url);
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(service.endSession).toHaveBeenCalledWith(undefined, expect.any(String), sessionId);
  });
});
