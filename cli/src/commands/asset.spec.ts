import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { Action, checkBulkUpload, defaults, Reason } from '@immich/sdk';
import createFetchMock from 'vitest-fetch-mock';

import { checkForDuplicates, getAlbumName, uploadFiles, UploadOptionsDto } from './asset';

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
