import { APP_INTERCEPTOR } from '@nestjs/core';
import request from 'supertest';
import { LockedAlbumController } from 'src/controllers/locked-album.controller.js';
import { LoggingInterceptor } from 'src/middleware/logging.interceptor.js';
import { LockedAlbumRepository } from 'src/repositories/locked-album.repository.js';
import { LockedAlbumService } from 'src/services/locked-album.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { newUuid } from 'test/small.factory.js';
import { ControllerContext, controllerSetup } from 'test/utils.js';

describe(LockedAlbumController.name, () => {
  let ctx: ControllerContext;
  const ownerId = newUuid();
  const albumId = newUuid();
  const assetId = newUuid();
  const album = { id: albumId, albumName: 'Private', createdAt: new Date(), updatedAt: new Date(), assetCount: 0 };
  const repository = {
    getAll: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAssetIds: vi.fn(),
    addAssets: vi.fn(),
    removeAssets: vi.fn(),
  };

  beforeAll(async () => {
    ctx = await controllerSetup(LockedAlbumController, [
      LockedAlbumService,
      { provide: LockedAlbumRepository, useValue: repository },
      { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    ctx.reset();
    ctx.authenticate.mockResolvedValue(
      AuthFactory.from({ id: ownerId }).session({ hasElevatedPermission: true }).build(),
    );
    repository.getAll.mockResolvedValue([album]);
    repository.get.mockResolvedValue(album);
    repository.create.mockResolvedValue(album);
    repository.update.mockResolvedValue(album);
    repository.delete.mockResolvedValue(true);
    repository.getAssetIds.mockResolvedValue({ assetIds: [assetId], hasNextPage: false });
  });

  const routes = [
    { method: 'get', path: '/locked-albums', body: undefined, status: 200 },
    { method: 'post', path: '/locked-albums', body: { albumName: 'Private' }, status: 201 },
    { method: 'get', path: `/locked-albums/${albumId}`, body: undefined, status: 200 },
    { method: 'patch', path: `/locked-albums/${albumId}`, body: { albumName: 'Private' }, status: 200 },
    { method: 'delete', path: `/locked-albums/${albumId}`, body: undefined, status: 204 },
    { method: 'get', path: `/locked-albums/${albumId}/assets`, body: undefined, status: 200 },
    { method: 'put', path: `/locked-albums/${albumId}/assets`, body: { ids: [assetId] }, status: 204 },
    { method: 'delete', path: `/locked-albums/${albumId}/assets`, body: { ids: [assetId] }, status: 204 },
  ] as const;

  it.each(routes)('should protect $method $path from unelevated sessions', async ({ method, path, body }) => {
    ctx.authenticate.mockResolvedValue(AuthFactory.from({ id: ownerId }).session().build());
    const response = await request(ctx.getHttpServer())[method](path).send(body);
    expect(response.status).toBe(401);
    for (const mock of Object.values(repository)) {
      expect(mock).not.toHaveBeenCalled();
    }
  });

  it.each(routes)('should reject API keys on $method $path', async ({ method, path, body }) => {
    ctx.authenticate.mockResolvedValue(
      AuthFactory.from({ id: ownerId }).apiKey().session({ hasElevatedPermission: true }).build(),
    );
    const response = await request(ctx.getHttpServer())[method](path).send(body);
    expect(response.status).toBe(401);
    for (const mock of Object.values(repository)) {
      expect(mock).not.toHaveBeenCalled();
    }
  });

  it.each(routes)('should reject shared links on $method $path', async ({ method, path, body }) => {
    ctx.authenticate.mockResolvedValue(
      AuthFactory.from({ id: ownerId }).sharedLink().session({ hasElevatedPermission: true }).build(),
    );
    const response = await request(ctx.getHttpServer())[method](path).send(body);
    expect(response.status).toBe(401);
    for (const mock of Object.values(repository)) {
      expect(mock).not.toHaveBeenCalled();
    }
  });

  it.each(routes)('should prevent caching of $method $path', async ({ method, path, body, status }) => {
    const response = await request(ctx.getHttpServer())[method](path).send(body);
    expect(response.status).toBe(status);
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('should trim names before persistence', async () => {
    const response = await request(ctx.getHttpServer()).post('/locked-albums').send({ albumName: '  Private  ' });
    expect(response.status).toBe(201);
    expect(repository.create).toHaveBeenCalledWith(ownerId, 'Private');
  });

  it.each(['', ' '.repeat(3), 'a'.repeat(256)])('should reject invalid names', async (albumName) => {
    const response = await request(ctx.getHttpServer()).post('/locked-albums').send({ albumName });
    expect(response.status).toBe(400);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should prevent caching when an album is missing or foreign', async () => {
    repository.get.mockResolvedValue(undefined);
    const response = await request(ctx.getHttpServer()).get(`/locked-albums/${albumId}`);
    expect(response.status).toBe(404);
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it.each(['take=0', 'take=101', 'skip=-1', 'take=invalid', 'skip=0.5'])(
    'should reject unsafe pagination %s',
    async (query) => {
      const response = await request(ctx.getHttpServer()).get(`/locked-albums/${albumId}/assets?${query}`);
      expect(response.status).toBe(400);
      expect(repository.getAssetIds).not.toHaveBeenCalled();
    },
  );

  it('should use bounded pagination defaults', async () => {
    const response = await request(ctx.getHttpServer()).get(`/locked-albums/${albumId}/assets`);
    expect(response.status).toBe(200);
    expect(repository.getAssetIds).toHaveBeenCalledWith(ownerId, albumId, { skip: 0, take: 50 });
  });

  it.each([{ ids: [] }, { ids: ['not-a-uuid'] }, { ids: Array.from({ length: 101 }, () => assetId) }])(
    'should reject invalid batches',
    async ({ ids }) => {
      const response = await request(ctx.getHttpServer()).put(`/locked-albums/${albumId}/assets`).send({ ids });
      expect(response.status).toBe(400);
      expect(repository.addAssets).not.toHaveBeenCalled();
    },
  );
});
