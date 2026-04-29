import { Readable } from 'node:stream';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MachineLearningRepository, ModelTask, ModelType } from 'src/repositories/machine-learning.repository';
import { automock } from 'test/utils';

const mockReadFile = vi.fn();

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: (...args: unknown[]) => mockReadFile(...args),
  };
});

const mockResolveBackendForKey = vi.fn();

vi.mock('src/services/storage.service', () => ({
  StorageService: {
    resolveBackendForKey: (...args: unknown[]) => mockResolveBackendForKey(...args),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const clipConfig = { modelName: 'ViT-B-32__openai', enabled: true, maxDistance: 0 };

describe(MachineLearningRepository.name, () => {
  let sut: MachineLearningRepository;
  let originalCloseConnections: string | undefined;

  const mlUrl = 'http://ml-server:3003';

  const baseConfig = {
    enabled: true,
    urls: [mlUrl],
    availabilityChecks: { enabled: false, timeout: 2000, interval: 30_000 },
    clip: { enabled: true, modelName: 'ViT-B-32__openai', maxDistance: 0 },
    duplicateDetection: { enabled: true, maxDistance: 0.01 },
    facialRecognition: { enabled: true, modelName: 'buffalo_l', minScore: 0.7, maxDistance: 0.5, minFaces: 1 },
    ocr: {
      enabled: false,
      modelName: 'default-ocr',
      minDetectionScore: 0.5,
      minRecognitionScore: 0.5,
      maxResolution: 0,
    },
    petDetection: {
      enabled: false,
      modelName: 'yolo11s',
      minScore: 0.6,
    },
  };

  const setupConfig = () => {
    sut.setup(baseConfig);
  };

  const createSut = () =>
    new MachineLearningRepository(
      // eslint-disable-next-line no-sparse-arrays
      automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false }),
    );

  beforeEach(() => {
    vi.clearAllMocks();
    originalCloseConnections = process.env.IMMICH_MACHINE_LEARNING_CLOSE_CONNECTIONS;
    delete process.env.IMMICH_MACHINE_LEARNING_CLOSE_CONNECTIONS;
    sut = createSut();
    setupConfig();
  });

  afterEach(() => {
    sut.teardown();
    if (originalCloseConnections === undefined) {
      delete process.env.IMMICH_MACHINE_LEARNING_CLOSE_CONNECTIONS;
    } else {
      process.env.IMMICH_MACHINE_LEARNING_CLOSE_CONNECTIONS = originalCloseConnections;
    }
  });

  describe('getFormData', () => {
    it('should read from filesystem for absolute (disk) paths', async () => {
      const imageData = Buffer.from('disk-image-data');
      mockReadFile.mockResolvedValue(imageData);

      const clipResponse = { [ModelTask.SEARCH]: 'mock-embedding', imageHeight: 100, imageWidth: 100 };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(clipResponse) });

      await sut.encodeImage('/data/upload/thumbs/user1/ab/cd/preview.webp', clipConfig);

      expect(mockReadFile).toHaveBeenCalledWith('/data/upload/thumbs/user1/ab/cd/preview.webp');
    });

    it('should stream from S3 backend for relative paths', async () => {
      const imageData = Buffer.from('s3-image-data');
      const mockStream = Readable.from([imageData]);
      const mockBackend = {
        get: vi.fn().mockResolvedValue({ stream: mockStream }),
      };
      mockResolveBackendForKey.mockReturnValue(mockBackend);

      const clipResponse = { [ModelTask.SEARCH]: 'mock-embedding', imageHeight: 100, imageWidth: 100 };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(clipResponse) });

      await sut.encodeImage('thumbs/user1/ab/cd/preview.webp', clipConfig);

      expect(mockReadFile).not.toHaveBeenCalled();
      expect(mockResolveBackendForKey).toHaveBeenCalledWith('thumbs/user1/ab/cd/preview.webp');
      expect(mockBackend.get).toHaveBeenCalledWith('thumbs/user1/ab/cd/preview.webp');
    });

    it('should not call S3 backend for absolute (disk) paths', async () => {
      const imageData = Buffer.from('disk-image-data');
      mockReadFile.mockResolvedValue(imageData);

      const clipResponse = { [ModelTask.SEARCH]: 'mock-embedding', imageHeight: 100, imageWidth: 100 };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(clipResponse) });

      await sut.encodeImage('/data/upload/thumbs/user1/ab/cd/preview.webp', clipConfig);

      expect(mockResolveBackendForKey).not.toHaveBeenCalled();
      expect(mockReadFile).toHaveBeenCalledWith('/data/upload/thumbs/user1/ab/cd/preview.webp');
    });

    it('should send correct binary payload from S3 stream', async () => {
      const imageData = Buffer.from('s3-image-binary-content');
      const mockStream = Readable.from([imageData]);
      const mockBackend = {
        get: vi.fn().mockResolvedValue({ stream: mockStream }),
      };
      mockResolveBackendForKey.mockReturnValue(mockBackend);

      const clipResponse = { [ModelTask.SEARCH]: 'mock-embedding', imageHeight: 100, imageWidth: 100 };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(clipResponse) });

      await sut.encodeImage('thumbs/user1/preview.webp', clipConfig);

      // Verify fetch was called with FormData containing the image data
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url.toString()).toBe(`${mlUrl}/predict`);
      expect(options.method).toBe('POST');

      const formData = options.body as FormData;
      const imageBlob = formData.get('image') as Blob;
      expect(imageBlob).toBeInstanceOf(Blob);

      const blobBuffer = Buffer.from(await imageBlob.arrayBuffer());
      expect(blobBuffer).toEqual(imageData);
    });

    it('should handle multi-chunk S3 streams', async () => {
      const chunk1 = Buffer.from('chunk-1-');
      const chunk2 = Buffer.from('chunk-2-');
      const chunk3 = Buffer.from('chunk-3');
      const mockStream = Readable.from([chunk1, chunk2, chunk3]);
      const mockBackend = {
        get: vi.fn().mockResolvedValue({ stream: mockStream }),
      };
      mockResolveBackendForKey.mockReturnValue(mockBackend);

      const clipResponse = { [ModelTask.SEARCH]: 'mock-embedding', imageHeight: 100, imageWidth: 100 };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(clipResponse) });

      await sut.encodeImage('thumbs/user1/preview.webp', clipConfig);

      const [, options] = mockFetch.mock.calls[0];
      const formData = options.body as FormData;
      const imageBlob = formData.get('image') as Blob;
      const blobBuffer = Buffer.from(await imageBlob.arrayBuffer());
      expect(blobBuffer).toEqual(Buffer.concat([chunk1, chunk2, chunk3]));
    });

    it('should handle text payloads without image path logic', async () => {
      const textResponse = { [ModelTask.SEARCH]: 'mock-text-embedding' };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(textResponse) });

      await sut.encodeText('search query', { modelName: 'ViT-B-32__openai' });

      expect(mockReadFile).not.toHaveBeenCalled();

      const [, options] = mockFetch.mock.calls[0];
      const formData = options.body as FormData;
      expect(formData.get('text')).toBe('search query');
      expect(formData.get('image')).toBeNull();
    });
  });

  describe('encodeImage', () => {
    it('should send correct CLIP visual request with S3 path', async () => {
      const imageData = Buffer.from('s3-clip-image');
      const mockStream = Readable.from([imageData]);
      const mockBackend = {
        get: vi.fn().mockResolvedValue({ stream: mockStream }),
      };
      mockResolveBackendForKey.mockReturnValue(mockBackend);

      const clipResponse = { [ModelTask.SEARCH]: 'encoded-embedding-string', imageHeight: 200, imageWidth: 300 };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(clipResponse) });

      const result = await sut.encodeImage('upload/user1/ab/cd/preview.webp', clipConfig);

      expect(result).toBe('encoded-embedding-string');

      const [, options] = mockFetch.mock.calls[0];
      const formData = options.body as FormData;
      const entries = JSON.parse(formData.get('entries') as string);
      expect(entries).toEqual({ [ModelTask.SEARCH]: { [ModelType.VISUAL]: { modelName: 'ViT-B-32__openai' } } });
    });

    it('should return CLIP embedding with disk path', async () => {
      const imageData = Buffer.from('disk-clip-image');
      mockReadFile.mockResolvedValue(imageData);

      const clipResponse = { [ModelTask.SEARCH]: 'disk-embedding', imageHeight: 100, imageWidth: 100 };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(clipResponse) });

      const result = await sut.encodeImage('/data/upload/preview.webp', clipConfig);

      expect(result).toBe('disk-embedding');
      expect(mockReadFile).toHaveBeenCalledWith('/data/upload/preview.webp');
    });
  });

  describe('detectFaces', () => {
    it('should detect faces with S3 path', async () => {
      const imageData = Buffer.from('s3-face-image');
      const mockStream = Readable.from([imageData]);
      const mockBackend = {
        get: vi.fn().mockResolvedValue({ stream: mockStream }),
      };
      mockResolveBackendForKey.mockReturnValue(mockBackend);

      const faceResponse = {
        [ModelTask.FACIAL_RECOGNITION]: [
          { boundingBox: { x1: 10, y1: 20, x2: 100, y2: 200 }, embedding: 'face-embedding', score: 0.95 },
        ],
        imageHeight: 480,
        imageWidth: 640,
      };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(faceResponse) });

      const result = await sut.detectFaces('thumbs/user1/face-preview.webp', {
        modelName: 'buffalo_l',
        minScore: 0.7,
      });

      expect(result.faces).toHaveLength(1);
      expect(result.faces[0].score).toBe(0.95);
      expect(result.imageHeight).toBe(480);
      expect(result.imageWidth).toBe(640);

      expect(mockResolveBackendForKey).toHaveBeenCalledWith('thumbs/user1/face-preview.webp');
      expect(mockBackend.get).toHaveBeenCalledWith('thumbs/user1/face-preview.webp');

      const [, options] = mockFetch.mock.calls[0];
      const formData = options.body as FormData;
      const entries = JSON.parse(formData.get('entries') as string);
      expect(entries).toEqual({
        [ModelTask.FACIAL_RECOGNITION]: {
          [ModelType.DETECTION]: { modelName: 'buffalo_l', options: { minScore: 0.7 } },
          [ModelType.RECOGNITION]: { modelName: 'buffalo_l' },
        },
      });
    });

    it('should detect faces with disk path', async () => {
      const imageData = Buffer.from('disk-face-image');
      mockReadFile.mockResolvedValue(imageData);

      const faceResponse = {
        [ModelTask.FACIAL_RECOGNITION]: [
          { boundingBox: { x1: 5, y1: 10, x2: 50, y2: 100 }, embedding: 'disk-face-embedding', score: 0.88 },
        ],
        imageHeight: 720,
        imageWidth: 1280,
      };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(faceResponse) });

      const result = await sut.detectFaces('/data/upload/thumbs/preview.webp', {
        modelName: 'buffalo_l',
        minScore: 0.7,
      });

      expect(result.faces).toHaveLength(1);
      expect(result.faces[0].score).toBe(0.88);
      expect(mockReadFile).toHaveBeenCalledWith('/data/upload/thumbs/preview.webp');
    });
  });

  describe('ocr', () => {
    it('should perform OCR with S3 path', async () => {
      const imageData = Buffer.from('s3-ocr-image');
      const mockStream = Readable.from([imageData]);
      const mockBackend = {
        get: vi.fn().mockResolvedValue({ stream: mockStream }),
      };
      mockResolveBackendForKey.mockReturnValue(mockBackend);

      const ocrResponse = {
        [ModelTask.OCR]: { text: ['hello'], box: [1, 2, 3, 4], boxScore: [0.9], textScore: [0.85] },
        imageHeight: 200,
        imageWidth: 400,
      };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(ocrResponse) });

      const result = await sut.ocr('upload/user1/preview.webp', {
        modelName: 'default-ocr',
        minDetectionScore: 0.5,
        minRecognitionScore: 0.5,
        maxResolution: 0,
      });

      expect(result.text).toEqual(['hello']);
      expect(mockResolveBackendForKey).toHaveBeenCalledWith('upload/user1/preview.webp');
      expect(mockBackend.get).toHaveBeenCalledWith('upload/user1/preview.webp');
    });
  });

  describe('predict error handling', () => {
    it('should throw when all ML server URLs fail', async () => {
      const imageData = Buffer.from('image-data');
      mockReadFile.mockResolvedValue(imageData);

      mockFetch.mockRejectedValue(new Error('Connection refused'));

      await expect(sut.encodeImage('/data/upload/preview.webp', clipConfig)).rejects.toThrow('failed for all URLs');
    });

    it('should throw when all ML server URLs fail with S3 path', async () => {
      const imageData = Buffer.from('s3-image');
      const mockStream = Readable.from([imageData]);
      const mockBackend = {
        get: vi.fn().mockResolvedValue({ stream: mockStream }),
      };
      mockResolveBackendForKey.mockReturnValue(mockBackend);

      mockFetch.mockRejectedValue(new Error('Connection refused'));

      await expect(sut.encodeImage('thumbs/user1/preview.webp', clipConfig)).rejects.toThrow('failed for all URLs');

      expect(mockBackend.get).toHaveBeenCalledWith('thumbs/user1/preview.webp');
    });
  });

  describe('ping()', () => {
    it('returns { ok: true } when /ping responds 200', async () => {
      mockFetch.mockResolvedValue({ ok: true, headers: new Headers() });
      await expect(sut.ping()).resolves.toEqual({ ok: true });
    });

    it('keeps the HTTP connection reusable for /ping requests by default', async () => {
      mockFetch.mockResolvedValue({ ok: true, headers: new Headers() });

      await sut.ping();

      const [, init] = mockFetch.mock.calls[0] as [URL, RequestInit];
      expect(new Headers(init.headers).get('Connection')).toBeNull();
    });

    it('closes the HTTP connection after /ping requests when configured', async () => {
      sut.teardown();
      process.env.IMMICH_MACHINE_LEARNING_CLOSE_CONNECTIONS = 'true';
      sut = createSut();
      setupConfig();
      mockFetch.mockResolvedValue({ ok: true, headers: new Headers() });

      await sut.ping();

      const [, init] = mockFetch.mock.calls[0] as [URL, RequestInit];
      expect(new Headers(init.headers).get('Connection')).toBe('close');
    });

    it('returns { ok: false } on timeout/abort', async () => {
      mockFetch.mockImplementation(
        (_url: URL, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(Object.assign(new Error('t'), { name: 'AbortError' })));
          }),
      );
      await expect(sut.ping()).resolves.toEqual({ ok: false });
    });

    it('returns { ok: false } when no URLs configured', async () => {
      sut.setup({ ...baseConfig, urls: [] });
      await expect(sut.ping()).resolves.toEqual({ ok: false });
    });

    it('returns { ok: false } when /ping returns HTTP 500', async () => {
      mockFetch.mockResolvedValue({ ok: false, headers: new Headers() });
      await expect(sut.ping()).resolves.toEqual({ ok: false });
    });
  });

  describe('encodeText()', () => {
    it('15s timeout aborts when ML never responds', async () => {
      vi.useFakeTimers();
      const originalTimeout = AbortSignal.timeout;
      AbortSignal.timeout = (ms: number) => {
        const c = new AbortController();
        setTimeout(() => c.abort(new DOMException('timeout', 'TimeoutError')), ms);
        return c.signal;
      };
      try {
        mockFetch.mockImplementation(
          (_url: URL, init: RequestInit) =>
            new Promise((_resolve, reject) => {
              init.signal?.addEventListener('abort', () =>
                reject(Object.assign(new Error('t'), { name: 'AbortError' })),
              );
            }),
        );
        // Attach the .rejects assertion synchronously before advancing timers so
        // the handler is in place when the fetch promise rejects. Without this,
        // the rejection becomes "unhandled" during vi.advanceTimersByTimeAsync.
        const assertion = expect(sut.encodeText('hello', { language: 'en', modelName: 'clip' })).rejects.toMatchObject({
          name: 'AbortError',
        });
        await vi.advanceTimersByTimeAsync(15_000);
        await assertion;
      } finally {
        AbortSignal.timeout = originalTimeout;
        vi.useRealTimers();
      }
    });

    it('non-abort errors still surface as the multi-URL failure', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(sut.encodeText('hello', { language: 'en', modelName: 'clip' })).rejects.toThrow(
        /failed for all URLs/,
      );
    });

    it('other ML callers do NOT get the 15s timeout (blast radius)', async () => {
      const signalsUsed: (AbortSignal | undefined)[] = [];
      mockFetch.mockImplementation((_url: URL, init: RequestInit) => {
        signalsUsed.push(init.signal ?? undefined);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ [ModelTask.SEARCH]: 'x', imageHeight: 1, imageWidth: 1 }),
        });
      });
      mockReadFile.mockResolvedValue(Buffer.from('img'));
      await sut.encodeImage('/data/upload/thumbs/a/b/c.webp', clipConfig);
      expect(signalsUsed[0]).toBeUndefined();
    });
  });

  describe('predict()', () => {
    it('keeps the HTTP connection reusable for /predict requests by default', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ [ModelTask.SEARCH]: 'embedding' }) });

      const predictFn = (sut as unknown as { predict: (...args: unknown[]) => Promise<unknown> }).predict.bind(sut);
      await predictFn({ text: 'hello' }, { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName: 'clip' } } });

      const [, init] = mockFetch.mock.calls[0] as [URL, RequestInit];
      expect(new Headers(init.headers).get('Connection')).toBeNull();
    });

    it('closes the HTTP connection after /predict requests when configured', async () => {
      sut.teardown();
      process.env.IMMICH_MACHINE_LEARNING_CLOSE_CONNECTIONS = 'true';
      sut = createSut();
      setupConfig();
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ [ModelTask.SEARCH]: 'embedding' }) });

      const predictFn = (sut as unknown as { predict: (...args: unknown[]) => Promise<unknown> }).predict.bind(sut);
      await predictFn({ text: 'hello' }, { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName: 'clip' } } });

      const [, init] = mockFetch.mock.calls[0] as [URL, RequestInit];
      expect(new Headers(init.headers).get('Connection')).toBe('close');
    });

    it('propagates AbortError when caller-supplied timeoutMs elapses', async () => {
      mockFetch.mockImplementation(
        (_url: URL, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(Object.assign(new Error('timeout'), { name: 'AbortError' })),
            );
          }),
      );
      const predictFn = (sut as unknown as { predict: (...args: unknown[]) => Promise<unknown> }).predict.bind(sut);
      await expect(
        predictFn(
          { text: 'hello' },
          { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName: 'clip' } } },
          { timeoutMs: 50 },
        ),
      ).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('does not apply any timeout when caller omits timeoutMs (backward compat)', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ [ModelTask.SEARCH]: 'embedding' }) });
      const predictFn = (sut as unknown as { predict: (...args: unknown[]) => Promise<unknown> }).predict.bind(sut);
      await expect(
        predictFn({ text: 'hello' }, { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName: 'clip' } } }),
      ).resolves.toBeDefined();
      const [, init] = mockFetch.mock.calls[0] as [URL, RequestInit];
      expect(init.signal).toBeUndefined();
    });

    it('different callers can pass different timeoutMs values (option is per-call)', async () => {
      const signalsUsed: (AbortSignal | undefined)[] = [];
      mockFetch.mockImplementation((_url: URL, init: RequestInit) => {
        signalsUsed.push(init.signal ?? undefined);
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ [ModelTask.SEARCH]: 'x' }) });
      });
      const predictFn = (sut as unknown as { predict: (...args: unknown[]) => Promise<unknown> }).predict.bind(sut);
      await predictFn(
        { text: 'a' },
        { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName: 'clip' } } },
        { timeoutMs: 100 },
      );
      await predictFn(
        { text: 'b' },
        { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName: 'clip' } } },
        { timeoutMs: 5000 },
      );
      await predictFn({ text: 'c' }, { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName: 'clip' } } });
      expect(signalsUsed[0]).toBeInstanceOf(AbortSignal);
      expect(signalsUsed[1]).toBeInstanceOf(AbortSignal);
      expect(signalsUsed[2]).toBeUndefined();
      expect(signalsUsed[0]).not.toBe(signalsUsed[1]);
    });
  });
});
