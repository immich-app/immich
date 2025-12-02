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
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY_MS = 500;

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

    // Ошибки BatchCluster требуют пересоздания
    if (this.isBatchClusterError(error)) {
      return true;
    }

    // Ошибки файловой системы, которые могут быть временными
    if (code === 'ENOENT' || code === 'EACCES' || code === 'ETIMEDOUT' || code === 'ECONNRESET') {
      return true;
    }

    // Ошибки, связанные с временной недоступностью файла
    if (
      typeof message === 'string' &&
      (message.includes('No such file') ||
        message.includes('timeout') ||
        message.includes('ETIMEDOUT') ||
        message.includes('ENOENT') ||
        message.includes('temporarily unavailable'))
    ) {
      return true;
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
      typeof message === 'string' &&
      (message.includes('BatchCluster has ended') || message.includes('cannot enqueue'))
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

        return await this.exiftool.read(path, args);
      } catch (error) {
        lastError = error;

        // Если это последняя попытка или ошибка не требует повторной попытки
        if (attempt === this.MAX_RETRIES || !this.isRetryableError(error)) {
          if (attempt > 0) {
            this.logger.warn(
              `Error reading exif data after ${attempt} retries (${path}): ${error}`,
            );
          } else {
            this.logger.warn(`Error reading exif data (${path}): ${error}`);
          }
          return {};
        }

        // Вычисляем задержку с экспоненциальным backoff
        const delayMs = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
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
            this.logger.warn(
              `Error extracting binary tag after ${attempt} retries (${path}, ${tagName}): ${error}`,
            );
          } else {
            this.logger.warn(`Error extracting binary tag (${path}, ${tagName}): ${error}`);
          }
          throw error;
        }

        // Вычисляем задержку с экспоненциальным backoff
        const delayMs = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
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
            this.logger.warn(
              `Error writing exif data after ${attempt} retries (${path}): ${error}`,
            );
          } else {
            this.logger.warn(`Error writing exif data (${path}): ${error}`);
          }
          throw error;
        }

        // Вычисляем задержку с экспоненциальным backoff
        const delayMs = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.debug(
          `Retrying writeTags for ${path} (attempt ${attempt + 1}/${this.MAX_RETRIES}) after ${delayMs}ms`,
        );
        await this.delay(delayMs);
      }
    }

    throw lastError;
  }
}
