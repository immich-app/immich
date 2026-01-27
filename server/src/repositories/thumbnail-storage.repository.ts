import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Database, { Database as DatabaseType, Statement } from 'better-sqlite3';
import { AssetFileType } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';

export interface ThumbnailData {
  assetId: string;
  type: AssetFileType;
  isEdited: boolean;
  data: Buffer;
  mimeType: string;
}

export interface ThumbnailResult {
  data: Buffer;
  mimeType: string;
  size: number;
}

interface ThumbnailRow {
  data: Buffer;
  mime_type: string;
  size: number;
}

@Injectable()
export class ThumbnailStorageRepository implements OnModuleDestroy {
  private database: DatabaseType | null = null;
  private insertStatement: Statement | null = null;
  private selectStatement: Statement | null = null;
  private deleteStatement: Statement | null = null;
  private deleteByAssetStatement: Statement | null = null;

  constructor(private logger: LoggingRepository) {
    this.logger.setContext(ThumbnailStorageRepository.name);
  }

  initialize(databasePath: string): void {
    this.database = new Database(databasePath);

    this.database.pragma('page_size = 32768');
    this.database.pragma('journal_mode = WAL');
    this.database.pragma('synchronous = NORMAL');
    this.database.pragma('cache_size = -131072');
    this.database.pragma('mmap_size = 2147483648');
    this.database.pragma('temp_store = MEMORY');
    this.database.pragma('wal_autocheckpoint = 10000');

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS thumbnails (
        asset_id TEXT NOT NULL,
        type TEXT NOT NULL,
        is_edited INTEGER NOT NULL DEFAULT 0,
        data BLOB NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        PRIMARY KEY (asset_id, type, is_edited)
      )
    `);

    this.insertStatement = this.database.prepare(`
      INSERT OR REPLACE INTO thumbnails (asset_id, type, is_edited, data, mime_type, size)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.selectStatement = this.database.prepare(`
      SELECT data, mime_type, size FROM thumbnails
      WHERE asset_id = ? AND type = ? AND is_edited = ?
    `);

    this.deleteStatement = this.database.prepare(`
      DELETE FROM thumbnails WHERE asset_id = ? AND type = ? AND is_edited = ?
    `);

    this.deleteByAssetStatement = this.database.prepare(`
      DELETE FROM thumbnails WHERE asset_id = ?
    `);

    this.logger.log(`SQLite thumbnail storage initialized at ${databasePath}`);
  }

  isEnabled(): boolean {
    return this.database !== null;
  }

  store(thumbnail: ThumbnailData): void {
    if (!this.insertStatement) {
      throw new Error('SQLite thumbnail storage not initialized');
    }

    const isEditedInt = thumbnail.isEdited ? 1 : 0;
    this.insertStatement.run(
      thumbnail.assetId,
      thumbnail.type,
      isEditedInt,
      thumbnail.data,
      thumbnail.mimeType,
      thumbnail.data.length,
    );
  }

  get(assetId: string, type: AssetFileType, isEdited: boolean): ThumbnailResult | null {
    if (!this.selectStatement) {
      return null;
    }

    const isEditedInt = isEdited ? 1 : 0;
    let result = this.selectStatement.get(assetId, type, isEditedInt) as ThumbnailRow | undefined;

    if (!result && isEdited) {
      result = this.selectStatement.get(assetId, type, 0) as ThumbnailRow | undefined;
    }

    if (!result) {
      return null;
    }

    return {
      data: result.data,
      mimeType: result.mime_type,
      size: result.size,
    };
  }

  delete(assetId: string, type: AssetFileType, isEdited: boolean): void {
    if (!this.deleteStatement) {
      return;
    }

    const isEditedInt = isEdited ? 1 : 0;
    this.deleteStatement.run(assetId, type, isEditedInt);
  }

  deleteByAsset(assetId: string): void {
    if (!this.deleteByAssetStatement) {
      return;
    }

    this.deleteByAssetStatement.run(assetId);
  }

  close(): void {
    if (this.database) {
      this.logger.log('Closing SQLite thumbnail storage database');
      this.database.pragma('wal_checkpoint(TRUNCATE)');
      this.database.close();
      this.database = null;
      this.insertStatement = null;
      this.selectStatement = null;
      this.deleteStatement = null;
      this.deleteByAssetStatement = null;
      this.logger.log('SQLite thumbnail storage database closed');
    }
  }

  onModuleDestroy(): void {
    this.logger.log('onModuleDestroy called - closing SQLite thumbnail storage');
    this.close();
  }
}
