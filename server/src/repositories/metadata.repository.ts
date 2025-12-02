import { Injectable } from '@nestjs/common';
import { BinaryField, DefaultReadTaskOptions, ExifTool, Tags } from 'exiftool-vendored';
import geotz from 'geo-tz';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { mimeTypes } from 'src/utils/mime-types';

interface ExifDuration {
  Value: number;
  Scale?: number;
}

type StringOrNumber = string | number;

type TagsWithWrongTypes =
  | 'FocalLength'
  | 'Duration'
  | 'Description'
  | 'ImageDescription'
  | 'RegionInfo'
  | 'TagsList'
  | 'Keywords'
  | 'HierarchicalSubject'
  | 'ISO';

export interface ImmichTags extends Omit<Tags, TagsWithWrongTypes> {
  ContentIdentifier?: string;
  MotionPhoto?: number;
  MotionPhotoVersion?: number;
  MotionPhotoPresentationTimestampUs?: number;
  MediaGroupUUID?: string;
  ImagePixelDepth?: string;
  FocalLength?: number;
  Duration?: number | string | ExifDuration;
  EmbeddedVideoType?: string;
  EmbeddedVideoFile?: BinaryField;
  MotionPhotoVideo?: BinaryField;
  TagsList?: StringOrNumber[];
  HierarchicalSubject?: StringOrNumber[];
  Keywords?: StringOrNumber | StringOrNumber[];
  ISO?: number | number[];

  // Type is wrong, can also be number.
  Description?: StringOrNumber;
  ImageDescription?: StringOrNumber;

  // Extended properties for image regions, such as faces
  RegionInfo?: {
    AppliedToDimensions: {
      W: number;
      H: number;
      Unit: string;
    };
    RegionList: {
      Area: {
        // (X,Y) // center of the rectangle
        X: number;
        Y: number;
        W: number;
        H: number;
        Unit: string;
      };
      Rotation?: number;
      Type?: string;
      Name?: string;
    }[];
  };

  Device?: {
    Manufacturer?: string;
    ModelName?: string;
  };

  AndroidMake?: string;
  AndroidModel?: string;
}

@Injectable()
export class MetadataRepository {
  private exiftool: ExifTool;
  private maxConcurrency: number | null = null;
  private isShuttingDown = false;
  private recreateLock = false;
  private readonly MAX_RETRIES = 4;
  private readonly INITIAL_RETRY_DELAY_MS = 500;
  private readonly FINAL_RETRY_DELAY_MS = 10_000;

  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MetadataRepository.name);
    this.exiftool = this.createExifTool();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableError(error: any): boolean {
    if (!error) {
      return false;
    }

    const message = error?.message || String(error);
    const code = error?.code;
    const statusCode = error?.statusCode || error?.status;

    // Ошибки BatchCluster требуют пересоздания
    if (this.isBatchClusterError(error)) {
      return true;
    }

    // HTTP статусы, указывающие на временные проблемы (часто от rclone/облачных хранилищ)
    if (
      statusCode === 429 || // Too Many Requests (rate limiting)
      statusCode === 502 || // Bad Gateway
      statusCode === 503 || // Service Unavailable
      statusCode === 504 || // Gateway Timeout
      statusCode === 408 || // Request Timeout
      statusCode === 500 || // Internal Server Error (может быть временным)
      statusCode === 509 // Bandwidth Limit Exceeded
    ) {
      return true;
    }

    // Ошибки файловой системы, которые могут быть временными
    // Особенно актуально для rclone, который монтирует облачные хранилища
    if (
      code === 'ENOENT' || // No such file or directory (может быть временным при rclone)
      code === 'EACCES' || // Permission denied (может быть временным)
      code === 'ETIMEDOUT' || // Operation timed out
      code === 'ECONNRESET' || // Connection reset by peer
      code === 'ECONNREFUSED' || // Connection refused
      code === 'EHOSTUNREACH' || // Host unreachable
      code === 'ENETUNREACH' || // Network unreachable
      code === 'EAGAIN' || // Resource temporarily unavailable
      code === 'EBUSY' || // Device or resource busy
      code === 'EIO' || // Input/output error
      code === 'EMFILE' || // Too many open files
      code === 'ENFILE' || // Too many open files in system
      code === 'ENOSPC' || // No space left on device (может быть временным при квотах)
      code === 'EROFS' // Read-only file system (может быть временным при проблемах монтирования)
    ) {
      return true;
    }

    // Ошибки, связанные с временной недоступностью файла или сети
    // Включая специфичные для rclone и облачных хранилищ
    if (typeof message === 'string') {
      const lowerMessage = message.toLowerCase();
      return (
        lowerMessage.includes('no such file') ||
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('timed out') ||
        lowerMessage.includes('temporarily unavailable') ||
        lowerMessage.includes('service unavailable') ||
        lowerMessage.includes('bad gateway') ||
        lowerMessage.includes('gateway timeout') ||
        lowerMessage.includes('too many requests') ||
        lowerMessage.includes('rate limit') ||
        lowerMessage.includes('throttled') ||
        lowerMessage.includes('connection reset') ||
        lowerMessage.includes('connection refused') ||
        lowerMessage.includes('connection closed') ||
        lowerMessage.includes('network error') ||
        lowerMessage.includes('network is unreachable') ||
        lowerMessage.includes('host is unreachable') ||
        lowerMessage.includes('econnreset') ||
        lowerMessage.includes('econnrefused') ||
        lowerMessage.includes('etimedout') ||
        lowerMessage.includes('enoent') ||
        lowerMessage.includes('eio') ||
        lowerMessage.includes('input/output error') ||
        lowerMessage.includes('resource temporarily unavailable') ||
        lowerMessage.includes('device or resource busy') ||
        lowerMessage.includes('too many open files') ||
        lowerMessage.includes('read-only file system') ||
        lowerMessage.includes('mount point') ||
        lowerMessage.includes('not mounted') ||
        lowerMessage.includes('transport endpoint is not connected') ||
        lowerMessage.includes('stale file handle') ||
        lowerMessage.includes('broken pipe') ||
        lowerMessage.includes('epipe')
      );
    }

    return false;
  }

  private createExifTool(): ExifTool {
    return new ExifTool({
      defaultVideosToUTC: true,
      backfillTimezones: true,
      inferTimezoneFromDatestamps: true,
      inferTimezoneFromTimeStamp: true,
      useMWG: true,
      numericTags: [...DefaultReadTaskOptions.numericTags, 'FocalLength', 'FileSize'],
      /* eslint unicorn/no-array-callback-reference: off, unicorn/no-array-method-this-argument: off */
      geoTz: (lat, lon) => geotz.find(lat, lon)[0],
      geolocation: true,
      // Enable exiftool LFS to parse metadata for files larger than 2GB.
      readArgs: ['-api', 'largefilesupport=1'],
      writeArgs: ['-api', 'largefilesupport=1', '-overwrite_original'],
    });
  }

  private async recreateExifTool(): Promise<void> {
    if (this.isShuttingDown || this.recreateLock) {
      return;
    }

    this.recreateLock = true;
    try {
      this.logger.warn('BatchCluster has ended, recreating ExifTool instance');
      try {
        // Пытаемся корректно завершить старый экземпляр, если это возможно
        await this.exiftool.end();
      } catch {
        // Игнорируем ошибки при завершении старого экземпляра
      }

      // Создаем новый экземпляр
      this.exiftool = this.createExifTool();

      // Восстанавливаем настройку concurrency, если она была установлена
      if (this.maxConcurrency !== null) {
        this.exiftool.batchCluster.setMaxProcs(this.maxConcurrency);
      }
    } finally {
      this.recreateLock = false;
    }
  }

  private isBatchClusterError(error: any): boolean {
    const message = error?.message || String(error);
    return (
      typeof message === 'string' && (message.includes('BatchCluster has ended') || message.includes('cannot enqueue'))
    );
  }

  setMaxConcurrency(concurrency: number) {
    this.maxConcurrency = concurrency;
    try {
      this.exiftool.batchCluster.setMaxProcs(concurrency);
    } catch (error) {
      if (this.isBatchClusterError(error)) {
        // Если BatchCluster завершен, просто сохраняем значение для следующего пересоздания
        return;
      }
      this.logger.warn(`Failed to set max concurrency: ${error}`);
    }
  }

  async teardown() {
    this.isShuttingDown = true;
    try {
      await this.exiftool.end();
    } catch (error) {
      this.logger.warn(`Error during ExifTool teardown: ${error}`);
    }
  }

  async readTags(path: string): Promise<ImmichTags> {
    const args = mimeTypes.isVideo(path) ? ['-ee'] : [];
    let lastError: any;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Если это повторная попытка и была ошибка BatchCluster, пересоздаем экземпляр
        if (attempt > 0 && this.isBatchClusterError(lastError)) {
          await this.recreateExifTool();
        }

        return (await this.exiftool.read(path, args)) as ImmichTags;
      } catch (error) {
        lastError = error;

        // Если это последняя попытка или ошибка не требует повторной попытки
        if (attempt === this.MAX_RETRIES || !this.isRetryableError(error)) {
          if (attempt > 0) {
            this.logger.warn(`Error reading exif data after ${attempt} retries (${path}): ${error}`);
          } else {
            this.logger.warn(`Error reading exif data (${path}): ${error}`);
          }
          return {};
        }

        // Вычисляем задержку с экспоненциальным backoff, последняя попытка - 10 секунд
        const delayMs =
          attempt === this.MAX_RETRIES - 1
            ? this.FINAL_RETRY_DELAY_MS
            : this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.debug(
          `Retrying readTags for ${path} (attempt ${attempt + 1}/${this.MAX_RETRIES}) after ${delayMs}ms`,
        );
        await this.delay(delayMs);
      }
    }

    return {};
  }

  async extractBinaryTag(path: string, tagName: string): Promise<Buffer> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Если это повторная попытка и была ошибка BatchCluster, пересоздаем экземпляр
        if (attempt > 0 && this.isBatchClusterError(lastError)) {
          await this.recreateExifTool();
        }

        return await this.exiftool.extractBinaryTagToBuffer(tagName, path);
      } catch (error) {
        lastError = error;

        // Если это последняя попытка или ошибка не требует повторной попытки
        if (attempt === this.MAX_RETRIES || !this.isRetryableError(error)) {
          if (attempt > 0) {
            this.logger.warn(`Error extracting binary tag after ${attempt} retries (${path}, ${tagName}): ${error}`);
          } else {
            this.logger.warn(`Error extracting binary tag (${path}, ${tagName}): ${error}`);
          }
          throw error;
        }

        // Вычисляем задержку с экспоненциальным backoff, последняя попытка - 10 секунд
        const delayMs =
          attempt === this.MAX_RETRIES - 1
            ? this.FINAL_RETRY_DELAY_MS
            : this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.debug(
          `Retrying extractBinaryTag for ${path} (attempt ${attempt + 1}/${this.MAX_RETRIES}) after ${delayMs}ms`,
        );
        await this.delay(delayMs);
      }
    }

    throw lastError;
  }

  async writeTags(path: string, tags: Partial<Tags>): Promise<void> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Если это повторная попытка и была ошибка BatchCluster, пересоздаем экземпляр
        if (attempt > 0 && this.isBatchClusterError(lastError)) {
          await this.recreateExifTool();
        }

        await this.exiftool.write(path, tags);
        return;
      } catch (error) {
        lastError = error;

        // Если это последняя попытка или ошибка не требует повторной попытки
        if (attempt === this.MAX_RETRIES || !this.isRetryableError(error)) {
          if (attempt > 0) {
            this.logger.warn(`Error writing exif data after ${attempt} retries (${path}): ${error}`);
          } else {
            this.logger.warn(`Error writing exif data (${path}): ${error}`);
          }
          throw error;
        }

        // Вычисляем задержку с экспоненциальным backoff, последняя попытка - 10 секунд
        const delayMs =
          attempt === this.MAX_RETRIES - 1
            ? this.FINAL_RETRY_DELAY_MS
            : this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.debug(
          `Retrying writeTags for ${path} (attempt ${attempt + 1}/${this.MAX_RETRIES}) after ${delayMs}ms`,
        );
        await this.delay(delayMs);
      }
    }

    throw lastError;
  }
}
