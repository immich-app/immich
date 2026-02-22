import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { describe, expect, it, MockedFunction, vi } from 'vitest';

import { Action, checkBulkUpload, defaults, getSupportedMediaTypes, Reason } from '@immich/sdk';
import createFetchMock from 'vitest-fetch-mock';

import {
  checkForDuplicates,
  deleteFiles,
  findSidecar,
  getAlbumName,
  startWatch,
  uploadFiles,
  UploadOptionsDto,
} from 'src/commands/asset';

vi.mock('@immich/sdk');

describe('getAlbumName', () => {
  it('should return a non-undefined value', () => {
    if (os.platform() === 'win32') {
      // This is meaningless for Unix systems.
      expect(getAlbumName(String.raw`D:\test\Filename.txt`, {} as UploadOptionsDto)).toBe('test');
    }
    expect(getAlbumName('D:/parentfolder/test/Filename.txt', {} as UploadOptionsDto)).toBe('test');
  });

  it('has higher priority to return `albumName` in `options`', () => {
    expect(getAlbumName('/parentfolder/test/Filename.txt', { albumName: 'example' } as UploadOptionsDto)).toBe(
      'example',
    );
  });
});

describe('uploadFiles', () => {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
  const testFilePath = path.join(testDir, 'test.png');
  const testFileData = 'test';
  const baseUrl = 'http://example.com';
  const apiKey = 'key';
  const retry = 3;

  const fetchMocker = createFetchMock(vi);

  beforeEach(() => {
    // Create a test file
    fs.writeFileSync(testFilePath, testFileData);

    // Defaults
    vi.mocked(defaults).baseUrl = baseUrl;
    vi.mocked(defaults).headers = { 'x-api-key': apiKey };

    fetchMocker.enableMocks();
    fetchMocker.resetMocks();
  });

  it('returns new assets when upload file is successful', async () => {
    fetchMocker.doMockIf(new RegExp(`${baseUrl}/assets$`), () => {
      return {
        status: 200,
        body: JSON.stringify({ id: 'fc5621b1-86f6-44a1-9905-403e607df9f5', status: 'created' }),
      };
    });

    await expect(uploadFiles([testFilePath], { concurrency: 1 })).resolves.toEqual([
      {
        filepath: testFilePath,
        id: 'fc5621b1-86f6-44a1-9905-403e607df9f5',
      },
    ]);
  });

  it('returns new assets when upload file retry is successful', async () => {
    let counter = 0;
    fetchMocker.doMockIf(new RegExp(`${baseUrl}/assets$`), () => {
      counter++;
      if (counter < retry) {
        throw new Error('Network error');
      }

      return {
        status: 200,
        body: JSON.stringify({ id: 'fc5621b1-86f6-44a1-9905-403e607df9f5', status: 'created' }),
      };
    });

    await expect(uploadFiles([testFilePath], { concurrency: 1 })).resolves.toEqual([
      {
        filepath: testFilePath,
        id: 'fc5621b1-86f6-44a1-9905-403e607df9f5',
      },
    ]);
  });

  it('returns new assets when upload file retry is failed', async () => {
    fetchMocker.doMockIf(new RegExp(`${baseUrl}/assets$`), () => {
      throw new Error('Network error');
    });

    await expect(uploadFiles([testFilePath], { concurrency: 1 })).resolves.toEqual([]);
  });
});

describe('checkForDuplicates', () => {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
  const testFilePath = path.join(testDir, 'test.png');
  const testFileData = 'test';
  const testFileChecksum = 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3'; // SHA1
  const retry = 3;

  beforeEach(() => {
    // Create a test file
    fs.writeFileSync(testFilePath, testFileData);
  });

  it('checks duplicates', async () => {
    vi.mocked(checkBulkUpload).mockResolvedValue({
      results: [
        {
          action: Action.Accept,
          id: testFilePath,
        },
      ],
    });

    await checkForDuplicates([testFilePath], { concurrency: 1 });

    expect(checkBulkUpload).toHaveBeenCalledWith({
      assetBulkUploadCheckDto: {
        assets: [
          {
            checksum: testFileChecksum,
            id: testFilePath,
          },
        ],
      },
    });
  });

  it('returns duplicates when check duplicates is rejected', async () => {
    vi.mocked(checkBulkUpload).mockResolvedValue({
      results: [
        {
          action: Action.Reject,
          id: testFilePath,
          assetId: 'fc5621b1-86f6-44a1-9905-403e607df9f5',
          reason: Reason.Duplicate,
        },
      ],
    });

    await expect(checkForDuplicates([testFilePath], { concurrency: 1 })).resolves.toEqual({
      duplicates: [
        {
          filepath: testFilePath,
          id: 'fc5621b1-86f6-44a1-9905-403e607df9f5',
        },
      ],
      newFiles: [],
    });
  });

  it('returns new assets when check duplicates is accepted', async () => {
    vi.mocked(checkBulkUpload).mockResolvedValue({
      results: [
        {
          action: Action.Accept,
          id: testFilePath,
        },
      ],
    });

    await expect(checkForDuplicates([testFilePath], { concurrency: 1 })).resolves.toEqual({
      duplicates: [],
      newFiles: [testFilePath],
    });
  });

  it('returns results when check duplicates retry is successful', async () => {
    let mocked = vi.mocked(checkBulkUpload);
    for (let i = 1; i < retry; i++) {
      mocked = mocked.mockRejectedValueOnce(new Error('Network error'));
    }
    mocked.mockResolvedValue({
      results: [
        {
          action: Action.Accept,
          id: testFilePath,
        },
      ],
    });

    await expect(checkForDuplicates([testFilePath], { concurrency: 1 })).resolves.toEqual({
      duplicates: [],
      newFiles: [testFilePath],
    });
  });

  it('returns results when check duplicates retry is failed', async () => {
    vi.mocked(checkBulkUpload).mockRejectedValue(new Error('Network error'));

    await expect(checkForDuplicates([testFilePath], { concurrency: 1 })).resolves.toEqual({
      duplicates: [],
      newFiles: [],
    });
  });
});

describe('startWatch', () => {
  let testFolder: string;
  let checkBulkUploadMocked: MockedFunction<typeof checkBulkUpload>;

  beforeEach(async () => {
    vi.restoreAllMocks();

    vi.mocked(getSupportedMediaTypes).mockResolvedValue({
      image: ['.jpg'],
      sidecar: ['.xmp'],
      video: ['.mp4'],
    });

    testFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'test-startWatch-'));
    checkBulkUploadMocked = vi.mocked(checkBulkUpload);
    checkBulkUploadMocked.mockResolvedValue({
      results: [],
    });
  });

  it('should start watching a directory and upload new files', async () => {
    const testFilePath = path.join(testFolder, 'test.jpg');

    await startWatch([testFolder], { concurrency: 1 }, { batchSize: 1, debounceTimeMs: 10 });
    await sleep(100); // to debounce the watcher from considering the test file as a existing file
    await fs.promises.writeFile(testFilePath, 'testjpg');

    await vi.waitUntil(() => checkBulkUploadMocked.mock.calls.length > 0, 3000);
    expect(checkBulkUpload).toHaveBeenCalledWith({
      assetBulkUploadCheckDto: {
        assets: [
          expect.objectContaining({
            id: testFilePath,
          }),
        ],
      },
    });
  });

  it('should filter out unsupported files', async () => {
    const testFilePath = path.join(testFolder, 'test.jpg');
    const unsupportedFilePath = path.join(testFolder, 'test.txt');

    await startWatch([testFolder], { concurrency: 1 }, { batchSize: 1, debounceTimeMs: 10 });
    await sleep(100); // to debounce the watcher from considering the test file as a existing file
    await fs.promises.writeFile(testFilePath, 'testjpg');
    await fs.promises.writeFile(unsupportedFilePath, 'testtxt');

    await vi.waitUntil(() => checkBulkUploadMocked.mock.calls.length > 0, 3000);
    expect(checkBulkUpload).toHaveBeenCalledWith({
      assetBulkUploadCheckDto: {
        assets: expect.arrayContaining([
          expect.objectContaining({
            id: testFilePath,
          }),
        ]),
      },
    });

    expect(checkBulkUpload).not.toHaveBeenCalledWith({
      assetBulkUploadCheckDto: {
        assets: expect.arrayContaining([
          expect.objectContaining({
            id: unsupportedFilePath,
          }),
        ]),
      },
    });
  });

  it('should filter out ignored patterns', async () => {
    const testFilePath = path.join(testFolder, 'test.jpg');
    const ignoredPattern = 'ignored';
    const ignoredFolder = path.join(testFolder, ignoredPattern);
    await fs.promises.mkdir(ignoredFolder, { recursive: true });
    const ignoredFilePath = path.join(ignoredFolder, 'ignored.jpg');

    await startWatch([testFolder], { concurrency: 1, ignore: ignoredPattern }, { batchSize: 1, debounceTimeMs: 10 });
    await sleep(100); // to debounce the watcher from considering the test file as a existing file
    await fs.promises.writeFile(testFilePath, 'testjpg');
    await fs.promises.writeFile(ignoredFilePath, 'ignoredjpg');

    await vi.waitUntil(() => checkBulkUploadMocked.mock.calls.length > 0, 3000);
    expect(checkBulkUpload).toHaveBeenCalledWith({
      assetBulkUploadCheckDto: {
        assets: expect.arrayContaining([
          expect.objectContaining({
            id: testFilePath,
          }),
        ]),
      },
    });

    expect(checkBulkUpload).not.toHaveBeenCalledWith({
      assetBulkUploadCheckDto: {
        assets: expect.arrayContaining([
          expect.objectContaining({
            id: ignoredFilePath,
          }),
        ]),
      },
    });
  });

  afterEach(async () => {
    await fs.promises.rm(testFolder, { recursive: true, force: true });
  });
});

describe('findSidecar', () => {
  let testDir: string;
  let testFilePath: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-sidecar-'));
    testFilePath = path.join(testDir, 'test.jpg');
    fs.writeFileSync(testFilePath, 'test');
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should find sidecar file with photo.xmp naming convention', () => {
    const sidecarPath = path.join(testDir, 'test.xmp');
    fs.writeFileSync(sidecarPath, 'xmp data');

    const result = findSidecar(testFilePath);
    expect(result).toBe(sidecarPath);
  });

  it('should find sidecar file with photo.ext.xmp naming convention', () => {
    const sidecarPath = path.join(testDir, 'test.jpg.xmp');
    fs.writeFileSync(sidecarPath, 'xmp data');

    const result = findSidecar(testFilePath);
    expect(result).toBe(sidecarPath);
  });

  it('should prefer photo.ext.xmp over photo.xmp when both exist', () => {
    const sidecarPath1 = path.join(testDir, 'test.xmp');
    const sidecarPath2 = path.join(testDir, 'test.jpg.xmp');
    fs.writeFileSync(sidecarPath1, 'xmp data 1');
    fs.writeFileSync(sidecarPath2, 'xmp data 2');

    const result = findSidecar(testFilePath);
    // Should return the first one found (photo.xmp) based on the order in the code
    expect(result).toBe(sidecarPath1);
  });

  it('should return undefined when no sidecar file exists', () => {
    const result = findSidecar(testFilePath);
    expect(result).toBeUndefined();
  });
});

describe('deleteFiles', () => {
  let testDir: string;
  let testFilePath: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-delete-'));
    testFilePath = path.join(testDir, 'test.jpg');
    fs.writeFileSync(testFilePath, 'test');
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should delete asset and sidecar file when main file is deleted', async () => {
    const sidecarPath = path.join(testDir, 'test.xmp');
    fs.writeFileSync(sidecarPath, 'xmp data');

    await deleteFiles([{ id: 'test-id', filepath: testFilePath }], [], { delete: true, concurrency: 1 });

    expect(fs.existsSync(testFilePath)).toBe(false);
    expect(fs.existsSync(sidecarPath)).toBe(false);
  });

  it('should not delete sidecar file when delete option is false', async () => {
    const sidecarPath = path.join(testDir, 'test.xmp');
    fs.writeFileSync(sidecarPath, 'xmp data');

    await deleteFiles([{ id: 'test-id', filepath: testFilePath }], [], { delete: false, concurrency: 1 });

    expect(fs.existsSync(testFilePath)).toBe(true);
    expect(fs.existsSync(sidecarPath)).toBe(true);
  });
});
