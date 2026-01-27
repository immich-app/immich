import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AssetFileType } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ThumbnailStorageRepository } from 'src/repositories/thumbnail-storage.repository';
import { automock } from 'test/utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe(ThumbnailStorageRepository.name, () => {
  let sut: ThumbnailStorageRepository;
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = join(tmpdir(), `immich-test-thumbnails-${randomUUID()}.db`);
    const logger = automock(LoggingRepository, { args: [undefined, { getEnv: () => ({}) }], strict: false });
    sut = new ThumbnailStorageRepository(logger);
  });

  afterEach(() => {
    sut.close();
    if (existsSync(testDbPath)) {
      rmSync(testDbPath);
    }
  });

  describe('initialize', () => {
    it('should create database and schema', () => {
      sut.initialize(testDbPath);

      expect(sut.isEnabled()).toBe(true);

      const db = new Database(testDbPath, { readonly: true });
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='thumbnails'").all();
      db.close();

      expect(tables).toHaveLength(1);
    });

    it('should enable WAL mode', () => {
      sut.initialize(testDbPath);

      const db = new Database(testDbPath, { readonly: true });
      const result = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
      db.close();

      expect(result.journal_mode).toBe('wal');
    });
  });

  describe('store', () => {
    const assetId = randomUUID();
    const testData = Buffer.from('test thumbnail data');
    const mimeType = 'image/webp';

    beforeEach(() => {
      sut.initialize(testDbPath);
    });

    it('should store thumbnail data', async () => {
      await sut.store({
        assetId,
        type: AssetFileType.Thumbnail,
        isEdited: false,
        data: testData,
        mimeType,
      });

      const result = await sut.get(assetId, AssetFileType.Thumbnail, false);
      expect(result).not.toBeNull();
      expect(result!.data).toEqual(testData);
      expect(result!.mimeType).toBe(mimeType);
      expect(result!.size).toBe(testData.length);
    });

    it('should replace existing thumbnail on conflict', async () => {
      const newData = Buffer.from('updated thumbnail data');

      await sut.store({
        assetId,
        type: AssetFileType.Thumbnail,
        isEdited: false,
        data: testData,
        mimeType,
      });

      await sut.store({
        assetId,
        type: AssetFileType.Thumbnail,
        isEdited: false,
        data: newData,
        mimeType,
      });

      const result = await sut.get(assetId, AssetFileType.Thumbnail, false);
      expect(result!.data).toEqual(newData);
      expect(result!.size).toBe(newData.length);
    });

    it('should store with correct mime type and size', async () => {
      const jpegData = Buffer.from('jpeg thumbnail data with different size');
      const jpegMimeType = 'image/jpeg';

      await sut.store({
        assetId,
        type: AssetFileType.Preview,
        isEdited: false,
        data: jpegData,
        mimeType: jpegMimeType,
      });

      const result = await sut.get(assetId, AssetFileType.Preview, false);
      expect(result!.mimeType).toBe(jpegMimeType);
      expect(result!.size).toBe(jpegData.length);
    });
  });

  describe('get', () => {
    const assetId = randomUUID();
    const testData = Buffer.from('test thumbnail data');
    const mimeType = 'image/webp';

    beforeEach(async () => {
      sut.initialize(testDbPath);
      await sut.store({
        assetId,
        type: AssetFileType.Thumbnail,
        isEdited: false,
        data: testData,
        mimeType,
      });
    });

    it('should return stored thumbnail data', async () => {
      const result = await sut.get(assetId, AssetFileType.Thumbnail, false);

      expect(result).not.toBeNull();
      expect(result!.data).toEqual(testData);
      expect(result!.mimeType).toBe(mimeType);
    });

    it('should return null for non-existent thumbnail', async () => {
      const result = await sut.get(randomUUID(), AssetFileType.Thumbnail, false);

      expect(result).toBeNull();
    });

    it('should distinguish between edited and non-edited', async () => {
      const editedData = Buffer.from('edited thumbnail data');

      await sut.store({
        assetId,
        type: AssetFileType.Thumbnail,
        isEdited: true,
        data: editedData,
        mimeType,
      });

      const nonEditedResult = await sut.get(assetId, AssetFileType.Thumbnail, false);
      const editedResult = await sut.get(assetId, AssetFileType.Thumbnail, true);

      expect(nonEditedResult!.data).toEqual(testData);
      expect(editedResult!.data).toEqual(editedData);
    });

    it('should distinguish between different thumbnail types', async () => {
      const previewData = Buffer.from('preview data');

      await sut.store({
        assetId,
        type: AssetFileType.Preview,
        isEdited: false,
        data: previewData,
        mimeType,
      });

      const thumbnailResult = await sut.get(assetId, AssetFileType.Thumbnail, false);
      const previewResult = await sut.get(assetId, AssetFileType.Preview, false);

      expect(thumbnailResult!.data).toEqual(testData);
      expect(previewResult!.data).toEqual(previewData);
    });

    it('should fall back to non-edited when edited is requested but not found', async () => {
      const result = await sut.get(assetId, AssetFileType.Thumbnail, true);

      expect(result).not.toBeNull();
      expect(result!.data).toEqual(testData);
    });

    it('should return edited when both exist and edited is requested', async () => {
      const editedData = Buffer.from('edited thumbnail data');

      await sut.store({
        assetId,
        type: AssetFileType.Thumbnail,
        isEdited: true,
        data: editedData,
        mimeType,
      });

      const result = await sut.get(assetId, AssetFileType.Thumbnail, true);

      expect(result!.data).toEqual(editedData);
    });

    it('should not fall back to edited when non-edited is requested but not found', async () => {
      const newAssetId = randomUUID();
      const editedData = Buffer.from('edited only data');

      await sut.store({
        assetId: newAssetId,
        type: AssetFileType.Thumbnail,
        isEdited: true,
        data: editedData,
        mimeType,
      });

      const result = await sut.get(newAssetId, AssetFileType.Thumbnail, false);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    const assetId = randomUUID();
    const testData = Buffer.from('test thumbnail data');
    const mimeType = 'image/webp';

    beforeEach(async () => {
      sut.initialize(testDbPath);
      await sut.store({
        assetId,
        type: AssetFileType.Thumbnail,
        isEdited: false,
        data: testData,
        mimeType,
      });
      await sut.store({
        assetId,
        type: AssetFileType.Preview,
        isEdited: false,
        data: testData,
        mimeType,
      });
    });

    it('should delete specific thumbnail', async () => {
      await sut.delete(assetId, AssetFileType.Thumbnail, false);

      const result = await sut.get(assetId, AssetFileType.Thumbnail, false);
      expect(result).toBeNull();
    });

    it('should not affect other thumbnails for same asset', async () => {
      await sut.delete(assetId, AssetFileType.Thumbnail, false);

      const previewResult = await sut.get(assetId, AssetFileType.Preview, false);
      expect(previewResult).not.toBeNull();
    });
  });

  describe('deleteByAsset', () => {
    const assetId = randomUUID();
    const otherAssetId = randomUUID();
    const testData = Buffer.from('test thumbnail data');
    const mimeType = 'image/webp';

    beforeEach(async () => {
      sut.initialize(testDbPath);
      await sut.store({ assetId, type: AssetFileType.Thumbnail, isEdited: false, data: testData, mimeType });
      await sut.store({ assetId, type: AssetFileType.Preview, isEdited: false, data: testData, mimeType });
      await sut.store({ assetId, type: AssetFileType.Thumbnail, isEdited: true, data: testData, mimeType });
      await sut.store({ assetId: otherAssetId, type: AssetFileType.Thumbnail, isEdited: false, data: testData, mimeType });
    });

    it('should delete all thumbnails for an asset', async () => {
      await sut.deleteByAsset(assetId);

      expect(await sut.get(assetId, AssetFileType.Thumbnail, false)).toBeNull();
      expect(await sut.get(assetId, AssetFileType.Preview, false)).toBeNull();
      expect(await sut.get(assetId, AssetFileType.Thumbnail, true)).toBeNull();
    });

    it('should not affect other assets', async () => {
      await sut.deleteByAsset(assetId);

      const otherAssetResult = await sut.get(otherAssetId, AssetFileType.Thumbnail, false);
      expect(otherAssetResult).not.toBeNull();
    });
  });

  describe('isEnabled', () => {
    it('should return false when database is not initialized', () => {
      expect(sut.isEnabled()).toBe(false);
    });

    it('should return true when database is initialized', () => {
      sut.initialize(testDbPath);
      expect(sut.isEnabled()).toBe(true);
    });
  });
});
