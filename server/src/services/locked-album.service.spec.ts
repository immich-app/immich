import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LockedAlbumController } from 'src/controllers/locked-album.controller.js';
import { AuthDto } from 'src/dtos/auth.dto.js';
import {
  CreateLockedAlbumSchema,
  GetLockedAlbumAssetsSchema,
  LockedAlbumAssetsSchema,
  UpdateLockedAlbumSchema,
} from 'src/dtos/locked-album.dto.js';
import { getAuthenticatedOptions } from 'src/middleware/auth.guard.js';
import { LockedAlbumRepository } from 'src/repositories/locked-album.repository.js';
import { LockedAlbumService } from 'src/services/locked-album.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';

describe(LockedAlbumService.name, () => {
  const auth = AuthFactory.from().session({ hasElevatedPermission: true }).build();
  const id = '550e8400-e29b-41d4-a716-446655440000';
  const ids = [id];
  const album = {
    id,
    ownerId: auth.user.id,
    albumName: 'Private',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-02-01T00:00:00Z'),
    assetCount: 2,
  };
  const mapped = {
    id,
    albumName: 'Private',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    assetCount: 2,
  };
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
  let sut: LockedAlbumService;

  beforeEach(() => {
    vi.resetAllMocks();
    sut = new LockedAlbumService(repository as unknown as LockedAlbumRepository);
    repository.getAll.mockResolvedValue([album]);
    repository.get.mockResolvedValue(album);
    repository.create.mockResolvedValue(album);
    repository.update.mockResolvedValue(album);
    repository.delete.mockResolvedValue(true);
    repository.getAssetIds.mockResolvedValue({ assetIds: ids, hasNextPage: true });
  });

  const operations: Array<[string, (sut: LockedAlbumService, auth: AuthDto) => Promise<unknown>]> = [
    ['getAll', (sut, auth) => sut.getAll(auth)],
    ['create', (sut, auth) => sut.create(auth, { albumName: 'Private' })],
    ['get', (sut, auth) => sut.get(auth, id)],
    ['update', (sut, auth) => sut.update(auth, id, { albumName: 'Private' })],
    ['delete', (sut, auth) => sut.delete(auth, id)],
    ['getAssets', (sut, auth) => sut.getAssets(auth, id, { skip: 0, take: 50 })],
    ['addAssets', (sut, auth) => sut.addAssets(auth, id, { ids })],
    ['removeAssets', (sut, auth) => sut.removeAssets(auth, id, { ids })],
  ];

  describe.each(operations)('%s authorization', (_name, operation) => {
    const rejectedAuth: Array<[string, AuthDto]> = [
      ['missing session', AuthFactory.create()],
      ['unelevated session', AuthFactory.from().session().build()],
      ['API key', AuthFactory.from().apiKey().build()],
      ['shared link', AuthFactory.from().sharedLink().build()],
      ['API key plus elevated session', AuthFactory.from().apiKey().session({ hasElevatedPermission: true }).build()],
      [
        'shared link plus elevated session',
        AuthFactory.from().sharedLink().session({ hasElevatedPermission: true }).build(),
      ],
      [
        'all authentication types',
        AuthFactory.from().apiKey().sharedLink().session({ hasElevatedPermission: true }).build(),
      ],
    ];

    it.each(rejectedAuth)('rejects %s before accessing persistence', async (_label, invalidAuth) => {
      await expect(operation(sut, invalidAuth)).rejects.toBeInstanceOf(UnauthorizedException);
      for (const method of Object.values(repository)) {
        expect(method).not.toHaveBeenCalled();
      }
    });
  });

  it('lists only the authenticated owner scope and maps only contract fields', async () => {
    await expect(sut.getAll(auth)).resolves.toEqual([mapped]);
    expect(repository.getAll).toHaveBeenCalledWith(auth.user.id);
  });

  it('returns an empty list when no albums exist', async () => {
    repository.getAll.mockResolvedValue([]);
    await expect(sut.getAll(auth)).resolves.toEqual([]);
  });

  it('creates within the authenticated owner scope', async () => {
    await expect(sut.create(auth, { albumName: 'Private' })).resolves.toEqual(mapped);
    expect(repository.create).toHaveBeenCalledWith(auth.user.id, 'Private');
  });

  it('gets within the authenticated owner scope', async () => {
    await expect(sut.get(auth, id)).resolves.toEqual(mapped);
    expect(repository.get).toHaveBeenCalledWith(auth.user.id, id);
  });

  it('updates within the authenticated owner scope', async () => {
    await expect(sut.update(auth, id, { albumName: 'Private' })).resolves.toEqual(mapped);
    expect(repository.update).toHaveBeenCalledWith(auth.user.id, id, 'Private');
  });

  it('deletes only the owner grouping', async () => {
    await expect(sut.delete(auth, id)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(auth.user.id, id);
  });

  it('checks ownership before returning paginated asset IDs', async () => {
    await expect(sut.getAssets(auth, id, { skip: 100, take: 25 })).resolves.toEqual({
      assetIds: ids,
      hasNextPage: true,
    });
    expect(repository.get).toHaveBeenCalledWith(auth.user.id, id);
    expect(repository.getAssetIds).toHaveBeenCalledWith(auth.user.id, id, { skip: 100, take: 25 });
  });

  it.each(['addAssets', 'removeAssets'] as const)(
    '%s delegates atomic validation in the owner scope',
    async (method) => {
      await expect(sut[method](auth, id, { ids })).resolves.toBeUndefined();
      expect(repository[method]).toHaveBeenCalledWith(auth.user.id, id, ids);
    },
  );

  it.each(['addAssets', 'removeAssets'] as const)('%s propagates invalid asset rejection', async (method) => {
    repository[method].mockRejectedValue(new BadRequestException('Invalid assets'));
    await expect(sut[method](auth, id, { ids })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository[method]).toHaveBeenCalledTimes(1);
  });

  it.each(['addAssets', 'removeAssets'] as const)('%s propagates missing/foreign album rejection', async (method) => {
    repository[method].mockRejectedValue(new NotFoundException('Locked album not found'));
    await expect(sut[method](auth, id, { ids })).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([undefined, null])('fails closed for missing or foreign records (%s)', async (missing) => {
    repository.get.mockResolvedValue(missing);
    repository.update.mockResolvedValue(missing);
    repository.delete.mockResolvedValue(false);
    await expect(sut.get(auth, id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(sut.update(auth, id, { albumName: 'Private' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(sut.delete(auth, id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(sut.getAssets(auth, id, { skip: 0, take: 50 })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.getAssetIds).not.toHaveBeenCalled();
  });
});

describe('Locked album HTTP contracts', () => {
  it.each([CreateLockedAlbumSchema, UpdateLockedAlbumSchema])('validates and trims required names', (schema) => {
    expect(schema.parse({ albumName: ' Private ' })).toEqual({ albumName: 'Private' });
    for (const albumName of ['', ' '.repeat(3), 'a'.repeat(256), null, undefined]) {
      expect(schema.safeParse({ albumName }).success).toBe(false);
    }
    expect(schema.safeParse({ albumName: 'a'.repeat(255) }).success).toBe(true);
  });

  it('requires 1–100 UUID asset IDs', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(LockedAlbumAssetsSchema.safeParse({ ids: [id] }).success).toBe(true);
    expect(LockedAlbumAssetsSchema.safeParse({ ids: Array.from({ length: 100 }, () => id) }).success).toBe(true);
    for (const ids of [[], ['invalid'], [null], Array.from({ length: 101 }, () => id)]) {
      expect(LockedAlbumAssetsSchema.safeParse({ ids }).success).toBe(false);
    }
  });

  it('coerces pagination and enforces bounds', () => {
    expect(GetLockedAlbumAssetsSchema.parse({})).toEqual({ skip: 0, take: 50 });
    expect(GetLockedAlbumAssetsSchema.parse({ skip: '10', take: '100' })).toEqual({ skip: 10, take: 100 });
    for (const query of [{ skip: -1 }, { skip: 0.5 }, { take: 0 }, { take: 101 }, { take: 1.5 }, { take: 'bad' }]) {
      expect(GetLockedAlbumAssetsSchema.safeParse(query).success).toBe(false);
    }
  });

  it('requires authentication and permissions without enabling shared links on every route', () => {
    const reflector = new Reflector();
    const prototype = LockedAlbumController.prototype;
    const methods = Object.getOwnPropertyNames(prototype).filter((name) => name !== 'constructor');
    expect(methods).toHaveLength(8);
    for (const method of methods) {
      const handler = prototype[method as keyof LockedAlbumController];
      const options = getAuthenticatedOptions(reflector, handler);
      expect(options).toMatchObject({ public: false, sharedLink: false });
      expect(options?.permission).toBeTruthy();
    }
  });
});
