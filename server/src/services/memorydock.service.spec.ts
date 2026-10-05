import { BadGatewayException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { AssetType } from 'src/enum.js';
import { MemoryDockService } from 'src/services/memorydock.service.js';
import { AssetFactory } from 'test/factories/asset.factory.js';
import { authStub } from 'test/fixtures/auth.stub.js';
import { getForAsset } from 'test/mappers.js';
import { newUuid } from 'test/small.factory.js';
import { ServiceMocks, newTestService } from 'test/utils.js';

describe(MemoryDockService.name, () => {
  let sut: MemoryDockService;
  let mocks: ServiceMocks;
  let originalUrl: string | undefined;
  let originalToken: string | undefined;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MemoryDockService));
    originalUrl = process.env.MEMORYDOCK_STYLE_SERVICE_URL;
    originalToken = process.env.MEMORYDOCK_STYLE_SERVICE_TOKEN;
    delete process.env.MEMORYDOCK_STYLE_SERVICE_URL;
    delete process.env.MEMORYDOCK_STYLE_SERVICE_TOKEN;
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.MEMORYDOCK_STYLE_SERVICE_URL;
    } else {
      process.env.MEMORYDOCK_STYLE_SERVICE_URL = originalUrl;
    }

    if (originalToken === undefined) {
      delete process.env.MEMORYDOCK_STYLE_SERVICE_TOKEN;
    } else {
      process.env.MEMORYDOCK_STYLE_SERVICE_TOKEN = originalToken;
    }

    vi.unstubAllGlobals();
  });

  it('should generate an owned image, import the result, and return its new asset id', async () => {
    const assetId = newUuid();
    const source = AssetFactory.create({ id: assetId, type: AssetType.Image, originalPath: '/data/upload/source.jpg' });
    const generated = AssetFactory.create({ id: newUuid(), type: AssetType.Image });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ jobId: 'job-1', status: 'queued', statusUrl: '/v1/style-transforms/job-1' }, { status: 202 }),
      )
      .mockResolvedValueOnce(
        Response.json(
          {
            jobId: 'job-1',
            status: 'succeeded',
            result: { outputPath: '/data/memorydock/style-output/job-1.jpg', model: 'AnimeGANv3-rk3562' },
          },
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    process.env.MEMORYDOCK_STYLE_SERVICE_URL = 'http://127.0.0.1:8734/v1/style-transforms';
    process.env.MEMORYDOCK_STYLE_SERVICE_TOKEN = 'service-token';
    mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
    mocks.asset.getById.mockResolvedValue(getForAsset(source));
    mocks.storage.readFile.mockResolvedValue(Buffer.from('styled-image'));
    mocks.asset.create.mockResolvedValue(generated);

    await expect(sut.createStyleTransform(authStub.user1, { assetId, style: 'ghibli' })).resolves.toEqual({
      jobId: 'job-1',
      status: 'succeeded',
      style: 'ghibli',
      assetId: generated.id,
      assetStatus: 'created',
      model: 'AnimeGANv3-rk3562',
    });

    expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
      authStub.user1.user.id,
      new Set([assetId]),
      undefined,
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL('http://127.0.0.1:8734/v1/style-transforms'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(`"assetId":"${assetId}"`),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL('http://127.0.0.1:8734/v1/style-transforms/job-1'),
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(mocks.storage.copyFile).toHaveBeenCalledWith(
      '/data/memorydock/style-output/job-1.jpg',
      expect.stringContaining('/data/upload/'),
    );
    expect(mocks.asset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: authStub.user1.user.id,
        originalFileName: expect.stringMatching(/-ghibli\.jpg$/),
      }),
    );
    expect(mocks.event.emit).toHaveBeenCalledWith('AssetCreate', expect.any(Object));
  });

  it('should reject assets that are not owned by the caller', async () => {
    const assetId = newUuid();
    mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set());

    await expect(sut.createStyleTransform(authStub.user1, { assetId, style: 'ghibli' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mocks.asset.getById).not.toHaveBeenCalled();
  });

  it('should reject non-image assets', async () => {
    const assetId = newUuid();
    mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
    mocks.asset.getById.mockResolvedValue(getForAsset(AssetFactory.create({ id: assetId, type: AssetType.Video })));

    await expect(sut.createStyleTransform(authStub.user1, { assetId, style: 'ghibli' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should reject an invalid configured service URL', async () => {
    const assetId = newUuid();
    process.env.MEMORYDOCK_STYLE_SERVICE_URL = 'not a url';
    mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
    mocks.asset.getById.mockResolvedValue(getForAsset(AssetFactory.create({ id: assetId, type: AssetType.Image })));

    await expect(sut.createStyleTransform(authStub.user1, { assetId, style: 'ghibli' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('should reject a generated file outside the configured style output root', async () => {
    const assetId = newUuid();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ jobId: 'job-1', statusUrl: '/v1/style-transforms/job-1' }, { status: 202 }),
      )
      .mockResolvedValueOnce(
        Response.json({ jobId: 'job-1', status: 'succeeded', result: { outputPath: '/tmp/not-allowed.jpg' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
    mocks.asset.getById.mockResolvedValue(getForAsset(AssetFactory.create({ id: assetId, type: AssetType.Image })));

    await expect(sut.createStyleTransform(authStub.user1, { assetId, style: 'ghibli' })).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(mocks.storage.readFile).not.toHaveBeenCalled();
  });

  it('should return a normalized exception when the upstream service fails', async () => {
    const assetId = newUuid();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'boom' }, { status: 500 })));
    mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
    mocks.asset.getById.mockResolvedValue(getForAsset(AssetFactory.create({ id: assetId, type: AssetType.Image })));

    await expect(sut.createStyleTransform(authStub.user1, { assetId, style: 'ghibli' })).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
