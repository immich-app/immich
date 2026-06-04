import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { defaults } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MlStreamTask, MlWorkRequest, MlWorkResult } from 'src/types';

/**
 * S3 configuration for ML stream mode.
 * When enabled, local file paths are converted to S3 URLs so the ML service
 * can fetch images directly from S3 instead of requiring shared filesystem access.
 */
interface MlStreamS3Config {
  enabled: boolean;
  bucket: string;
  endpoint?: string;
  prefix: string;
}

const STREAM_KEYS = {
  requests: {
    [MlStreamTask.Clip]: 'immich:ml:requests:clip',
    [MlStreamTask.Face]: 'immich:ml:requests:face',
    [MlStreamTask.Ocr]: 'immich:ml:requests:ocr',
  },
  results: 'immich:ml:results',
  deadLetter: 'immich:ml:deadletter',
} as const;

const CONSUMER_GROUP = 'immich-server';
const RESULT_BLOCK_MS = 5000;

export interface MlStreamStats {
  pending: Record<MlStreamTask, number>;
  results: number;
  deadLetter: number;
}

type ResultHandler = (result: MlWorkResult) => Promise<void>;

@Injectable()
export class MlStreamRepository implements OnModuleDestroy {
  private redis?: Redis;
  private subscriber?: Redis;
  private statsRedis?: Redis;
  private resultConsumerRunning = false;
  private consumerName: string;
  private s3Config: MlStreamS3Config = { enabled: false, bucket: '', prefix: '' };

  constructor(
    private configRepository: ConfigRepository,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(MlStreamRepository.name);
    this.consumerName = `server-${process.pid}-${Date.now()}`;
    this.initS3Config();
  }

  /**
   * Initialize S3 configuration from existing config structure.
   * Uses the hot bucket for ML operations (thumbnails/previews).
   */
  private initS3Config(): void {
    const s3Config = defaults.storage.s3;

    if (!s3Config.enabled) {
      return;
    }

    const hotBucket = s3Config.hotBucket;
    if (hotBucket.bucket) {
      this.s3Config = {
        enabled: true,
        bucket: hotBucket.bucket,
        endpoint: hotBucket.endpoint || s3Config.endpoint,
        prefix: hotBucket.prefix || '',
      };
      this.logger.log(`ML stream S3 mode enabled: bucket=${hotBucket.bucket}`);
    }
  }

  onModuleDestroy() {
    this.teardown();
  }

  async setup(): Promise<void> {
    const { redis } = this.configRepository.getEnv();
    this.redis = new Redis({ ...redis, lazyConnect: true });
    this.subscriber = this.redis.duplicate();

    await Promise.all([this.redis.connect(), this.subscriber.connect()]);

    await this.ensureConsumerGroups();
    this.logger.log('ML stream repository initialized');
  }

  teardown(): void {
    this.resultConsumerRunning = false;

    if (this.redis) {
      this.redis.disconnect();
      this.redis = undefined;
    }

    if (this.statsRedis) {
      this.statsRedis.disconnect();
      this.statsRedis = undefined;
    }

    if (this.subscriber) {
      this.subscriber.disconnect();
      this.subscriber = undefined;
    }
  }

  private async ensureConsumerGroups(): Promise<void> {
    if (!this.redis) {
      return;
    }

    const streams = [...Object.values(STREAM_KEYS.requests), STREAM_KEYS.results];

    for (const stream of streams) {
      try {
        await this.redis.xgroup('CREATE', stream, CONSUMER_GROUP, '$', 'MKSTREAM');
        this.logger.debug(`Created consumer group for ${stream}`);
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('BUSYGROUP')) {
          this.logger.debug(`Consumer group already exists for ${stream}`);
        } else {
          throw error;
        }
      }
    }
  }

  async publish(request: MlWorkRequest): Promise<void> {
    if (!this.redis) {
      throw new Error('ML stream repository not initialized');
    }

    const streamKey = STREAM_KEYS.requests[request.taskType];
    const fields = this.serializeRequest(request);

    await this.redis.xadd(streamKey, '*', ...fields);
    this.logger.debug(`Published ML request: ${request.taskType} for asset ${request.assetId}`);
  }

  async publishBatch(requests: MlWorkRequest[]): Promise<void> {
    if (!this.redis) {
      throw new Error('ML stream repository not initialized');
    }

    if (requests.length === 0) {
      return;
    }

    const pipeline = this.redis.pipeline();

    for (const request of requests) {
      const streamKey = STREAM_KEYS.requests[request.taskType];
      const fields = this.serializeRequest(request);
      pipeline.xadd(streamKey, '*', ...fields);
    }

    await pipeline.exec();
    this.logger.debug(`Published ${requests.length} ML requests`);
  }

  startResultConsumer(handler: ResultHandler): void {
    if (this.resultConsumerRunning) {
      this.logger.warn('Result consumer already running');
      return;
    }

    this.resultConsumerRunning = true;
    void this.consumeResults(handler);
    this.logger.log('Started ML result consumer');
  }

  stopResultConsumer(): void {
    this.resultConsumerRunning = false;
    this.logger.log('Stopped ML result consumer');
  }

  private async consumeResults(handler: ResultHandler): Promise<void> {
    while (this.resultConsumerRunning) {
      try {
        await this.processResultBatch(handler);
      } catch (error) {
        this.logger.error(`Error consuming results: ${error}`);
        await this.sleep(1000);
      }
    }
  }

  private async processResultBatch(handler: ResultHandler): Promise<void> {
    if (!this.subscriber) {
      return;
    }

    const response = (await this.subscriber.xreadgroup(
      'GROUP',
      CONSUMER_GROUP,
      this.consumerName,
      'COUNT',
      100,
      'BLOCK',
      RESULT_BLOCK_MS,
      'STREAMS',
      STREAM_KEYS.results,
      '>',
    )) as [string, [string, string[]][]][] | null;

    if (!response) {
      return;
    }

    for (const [, messages] of response) {
      for (const [messageId, fields] of messages) {
        try {
          const result = this.deserializeResult(fields);
          await handler(result);
          await this.subscriber.xack(STREAM_KEYS.results, CONSUMER_GROUP, messageId);
        } catch (error) {
          this.logger.error(`Failed to process result ${messageId}: ${error}`);
        }
      }
    }
  }

  async getStreamStats(): Promise<MlStreamStats> {
    if (!this.redis) {
      throw new Error('ML stream repository not initialized');
    }

    const pending: Record<MlStreamTask, number> = {
      [MlStreamTask.Clip]: 0,
      [MlStreamTask.Face]: 0,
      [MlStreamTask.Ocr]: 0,
    };

    for (const [task, stream] of Object.entries(STREAM_KEYS.requests)) {
      try {
        // Use XINFO GROUPS to get consumer group lag (unconsumed messages)
        const groups = await this.redis.xinfo('GROUPS', stream) as unknown[];
        const lag = this.parseConsumerGroupLag(groups, 'ml-workers');
        if (lag !== null) {
          pending[task as MlStreamTask] = lag;
        } else {
          // Fallback to total stream length if no consumer group
          pending[task as MlStreamTask] = await this.redis.xlen(stream);
        }
      } catch {
        pending[task as MlStreamTask] = 0;
      }
    }

    const [results, deadLetter] = await Promise.all([
      this.redis.xlen(STREAM_KEYS.results).catch(() => 0),
      this.redis.xlen(STREAM_KEYS.deadLetter).catch(() => 0),
    ]);

    return { pending, results, deadLetter };
  }

  async getStreamLag(task: MlStreamTask): Promise<number> {
    const stats = await this.getStreamCounts(task);
    return stats.lag;
  }

  async getStreamCounts(task: MlStreamTask): Promise<{ lag: number; active: number }> {
    const client = await this.getRedisForStats();
    if (!client) {
      return { lag: 0, active: 0 };
    }

    const stream = STREAM_KEYS.requests[task];
    try {
      const groups = await client.xinfo('GROUPS', stream) as unknown[];
      const parsed = this.parseConsumerGroupStats(groups, 'ml-workers');
      if (parsed) {
        return parsed;
      }
      const total = await client.xlen(stream);
      return { lag: total, active: 0 };
    } catch {
      return { lag: 0, active: 0 };
    }
  }

  /**
   * Get a Redis client for stats queries. Uses the existing connection if available,
   * otherwise creates a lightweight on-demand connection (for web workers).
   */
  private async getRedisForStats(): Promise<Redis | undefined> {
    if (this.redis) {
      return this.redis;
    }

    // On-demand connection for web workers that don't call setup()
    if (!this.statsRedis) {
      try {
        const { redis } = this.configRepository.getEnv();
        this.statsRedis = new Redis({ ...redis, lazyConnect: true });
        await this.statsRedis.connect();
      } catch {
        return undefined;
      }
    }
    return this.statsRedis;
  }

  private parseConsumerGroupStats(groups: unknown[], groupName: string): { lag: number; active: number } | null {
    for (const group of groups) {
      if (Array.isArray(group)) {
        let isMatch = false;
        let lag: number | null = null;
        let pending = 0;
        for (let i = 0; i < group.length - 1; i += 2) {
          const key = String(group[i]);
          const value = group[i + 1];
          if (key === 'name' && String(value) === groupName) {
            isMatch = true;
          }
          if (key === 'lag' && value !== null && value !== undefined) {
            lag = Number(value);
          }
          if (key === 'pending' && value !== null && value !== undefined) {
            pending = Number(value);
          }
        }
        if (isMatch && lag !== null) {
          return { lag, active: pending };
        }
      }
    }
    return null;
  }

  private parseConsumerGroupLag(groups: unknown[], groupName: string): number | null {
    // XINFO GROUPS returns an array of [field, value, field, value, ...] per group
    // or an array of objects depending on the Redis client
    for (const group of groups) {
      if (Array.isArray(group)) {
        let isMatch = false;
        let lag: number | null = null;
        for (let i = 0; i < group.length - 1; i += 2) {
          const key = String(group[i]);
          const value = group[i + 1];
          if (key === 'name' && String(value) === groupName) {
            isMatch = true;
          }
          if (key === 'lag' && value !== null && value !== undefined) {
            lag = Number(value);
          }
        }
        if (isMatch && lag !== null) {
          return lag;
        }
      }
    }
    return null;
  }

  async moveToDeadLetter(request: MlWorkRequest): Promise<void> {
    if (!this.redis) {
      throw new Error('ML stream repository not initialized');
    }

    const fields = this.serializeRequest(request);
    await this.redis.xadd(STREAM_KEYS.deadLetter, '*', ...fields);
    this.logger.warn(`Moved request to dead letter: ${request.correlationId}`);
  }

  async getDeadLetterMessages(limit: number = 100): Promise<MlWorkRequest[]> {
    if (!this.redis) {
      throw new Error('ML stream repository not initialized');
    }

    const messages = await this.redis.xrange(STREAM_KEYS.deadLetter, '-', '+', 'COUNT', limit);
    return messages.map(([, fields]) => this.deserializeRequest(fields));
  }

  async replayDeadLetter(correlationId: string): Promise<boolean> {
    if (!this.redis) {
      throw new Error('ML stream repository not initialized');
    }

    const messages = await this.redis.xrange(STREAM_KEYS.deadLetter, '-', '+');
    for (const [messageId, fields] of messages) {
      const request = this.deserializeRequest(fields);
      if (request.correlationId === correlationId) {
        request.attempt = 1;
        await this.publish(request);
        await this.redis.xdel(STREAM_KEYS.deadLetter, messageId);
        return true;
      }
    }
    return false;
  }

  private serializeRequest(request: MlWorkRequest): string[] {
    // Convert local path to S3 URL if S3 is enabled
    const imagePath = this.toS3Path(request.imagePath);

    return [
      'correlationId',
      request.correlationId,
      'assetId',
      request.assetId,
      'taskType',
      request.taskType,
      'imagePath',
      imagePath,
      'config',
      JSON.stringify(request.config),
      'timestamp',
      String(request.timestamp),
      'attempt',
      String(request.attempt),
    ];
  }

  /**
   * Convert a path to an S3 URL if needed.
   * Paths already in s3:// format are passed through unchanged.
   * Local paths are converted by stripping the media location prefix.
   */
  private toS3Path(path: string): string {
    if (path.startsWith('s3://')) {
      return path;
    }

    if (!this.s3Config.enabled) {
      return path;
    }

    try {
      const mediaLocation = StorageCore.getMediaLocation();

      if (!path.startsWith(mediaLocation)) {
        this.logger.warn(`Path ${path} does not start with media location ${mediaLocation}`);
        return path;
      }

      let s3Key = path.slice(mediaLocation.length);
      if (s3Key.startsWith('/')) {
        s3Key = s3Key.slice(1);
      }

      return `s3://${this.s3Config.bucket}/${s3Key}`;
    } catch {
      return path;
    }
  }

  private deserializeRequest(fields: string[]): MlWorkRequest {
    const map = this.fieldsToMap(fields);
    return {
      correlationId: map.correlationId,
      assetId: map.assetId,
      taskType: map.taskType as MlStreamTask,
      imagePath: map.imagePath,
      config: JSON.parse(map.config),
      timestamp: Number(map.timestamp),
      attempt: Number(map.attempt),
    };
  }

  private deserializeResult(fields: string[]): MlWorkResult {
    const map = this.fieldsToMap(fields);
    return {
      correlationId: map.correlationId,
      assetId: map.assetId,
      taskType: map.taskType as MlStreamTask,
      status: map.status as 'success' | 'error',
      result: map.result ? JSON.parse(map.result) : undefined,
      error: map.error ? JSON.parse(map.error) : undefined,
      processingTimeMs: Number(map.processingTimeMs),
      timestamp: Number(map.timestamp),
    };
  }

  private fieldsToMap(fields: string[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      map[fields[i]] = fields[i + 1];
    }
    return map;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
