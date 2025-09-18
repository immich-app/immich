import { Command, CommandRunner, Option } from 'nest-commander';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { AssetFileType } from 'src/enum';
import { S3AppStorageBackend } from 'src/storage/s3-backend';
import { StorageCore } from 'src/cores/storage.core';

type MigrateOptions = {
  includeDerivatives?: boolean;
  concurrency?: number;
  dryRun?: boolean;
};

@Command({
  name: 'migrate-to-s3',
  description: 'Copy files from local media location to S3 and update database paths after verification',
})
export class MigrateToS3Command extends CommandRunner {
  constructor(
    private logger: LoggingRepository,
    private configRepository: ConfigRepository,
    private assetRepository: AssetRepository,
  ) {
    super();
    this.logger.setContext(MigrateToS3Command.name);
  }

  @Option({ flags: '--include-derivatives', description: 'Also migrate thumbnails/previews/fullsize/encoded videos' })
  parseIncludeDerivatives(): boolean {
    return true;
  }

  @Option({ flags: '--concurrency <n>', description: 'Concurrent uploads (default 4)' })
  parseConcurrency(val: string): number {
    const n = Number.parseInt(val);
    return Number.isFinite(n) && n > 0 ? n : 4;
  }

  @Option({ flags: '--dry-run', description: 'Print planned migrations without copying or updating DB' })
  parseDryRun(): boolean {
    return true;
  }

  async run(_: string[], opts: MigrateOptions): Promise<void> {
    const { includeDerivatives = false, concurrency = 4, dryRun = false } = opts;

    const env = this.configRepository.getEnv();
    const s3c = env.storage.s3;
    if (!s3c?.bucket) {
      console.error('S3 storage is not configured. Set S3_BUCKET (and related variables) and try again.');
      return;
    }

    const s3Base = this.joinS3(s3c.bucket, s3c.prefix || '');
    const localBase = StorageCore.getMediaLocation();
    if (localBase.startsWith('s3://')) {
      console.error('Current media location is already S3; this tool is for local → S3 migration.');
      return;
    }

    const s3 = new S3AppStorageBackend({
      endpoint: s3c.endpoint,
      region: s3c.region || 'us-east-1',
      bucket: s3c.bucket,
      prefix: s3c.prefix,
      forcePathStyle: s3c.forcePathStyle,
      useAccelerate: s3c.useAccelerate,
      accessKeyId: s3c.accessKeyId,
      secretAccessKey: s3c.secretAccessKey,
      sse: s3c.sse as any,
      sseKmsKeyId: s3c.sseKmsKeyId,
    });

    // Fetch assets in chunks to keep memory bounded
    const db = (this.assetRepository as any).db as import('kysely').Kysely<any>;
    const batchSize = 500;
    let offset = 0;
    let totalMigrated = 0;
    let totalSkipped = 0;

    const work: Array<() => Promise<void>> = [];

    const schedule = async (task: () => Promise<void>) => {
      work.push(task);
      if (work.length >= concurrency) {
        await Promise.all(work.splice(0, work.length));
      }
    };

    const flush = async () => {
      if (work.length) {
        await Promise.all(work.splice(0, work.length));
      }
    };

    const migrateOne = async (
      id: string,
      localPath: string | null,
      dest: string,
      label: string,
      updateFn: () => Promise<void>,
    ) => {
      if (!localPath) return;
      if (localPath.startsWith('s3://')) {
        this.logger.debug(`${label}: already S3 ${localPath}`);
        totalSkipped++;
        return;
      }
      const rel = this.relativeUnder(localBase, localPath);
      if (!rel) {
        this.logger.warn(`${label}: path not under base, skipping: ${localPath}`);
        totalSkipped++;
        return;
      }
      const s3Path = this.joinUri(s3Base, rel);
      if (dryRun) {
        console.log(`[DRY RUN] ${label}: copy ${localPath} -> ${s3Path}`);
        totalMigrated++;
        return;
      }

      try {
        const stat = await fs.stat(localPath);
        const exists = await s3.exists(s3Path);
        if (exists) {
          const head = await s3.head(s3Path);
          if (Number(head.size) === Number(stat.size)) {
            this.logger.debug(`${label}: exists and matches, skipping copy ${s3Path}`);
          } else {
            this.logger.warn(`${label}: exists but size mismatch, overwriting ${s3Path}`);
            await this.uploadStream(s3, localPath, s3Path);
          }
        } else {
          await this.uploadStream(s3, localPath, s3Path);
        }

        await updateFn();
        totalMigrated++;
      } catch (error) {
        this.logger.error(`${label}: failed to migrate ${localPath} -> ${dest}: ${(error as Error).message}`);
      }
    };

    for (;;) {
      const rows = await db
        .selectFrom('asset')
        .select(['id', 'originalPath', 'sidecarPath'])
        .where('deletedAt', 'is', null)
        .limit(batchSize)
        .offset(offset)
        .execute();

      if (rows.length === 0) break;

      for (const row of rows) {
        const rel = this.relativeUnder(localBase, row.originalPath);
        if (!rel) {
          totalSkipped++;
          continue;
        }
        const destOriginal = this.joinUri(s3Base, rel);
        await schedule(() =>
          migrateOne(row.id, row.originalPath, destOriginal, 'original', async () => {
            await this.assetRepository.update({ id: row.id, originalPath: destOriginal });
          }),
        );

        if (row.sidecarPath) {
          const relSidecar = this.relativeUnder(localBase, row.sidecarPath);
          if (relSidecar) {
            const destSidecar = this.joinUri(s3Base, relSidecar);
            await schedule(() =>
              migrateOne(row.id, row.sidecarPath!, destSidecar, 'sidecar', async () => {
                await this.assetRepository.update({ id: row.id, sidecarPath: destSidecar });
              }),
            );
          }
        }

        if (includeDerivatives) {
          const files: { assetId: string; path: string; type: AssetFileType }[] = await db
            .selectFrom('asset_file')
            .select(['assetId', 'path', 'type'])
            .where('assetId', '=', row.id)
            .execute();
          for (const f of files) {
            const relFile = this.relativeUnder(localBase, f.path);
            if (!relFile) continue;
            const destFile = this.joinUri(s3Base, relFile);
            await schedule(() =>
              migrateOne(row.id, f.path, destFile, `file:${f.type}`, async () => {
                await this.assetRepository.upsertFile({ assetId: row.id, type: f.type, path: destFile });
              }),
            );
          }
        }
      }

      await flush();
      offset += rows.length;
    }

    await flush();
    console.log(`\nMigration complete. Migrated: ${totalMigrated}, Skipped: ${totalSkipped}`);
  }

  private relativeUnder(base: string, full: string): string | null {
    if (base.startsWith('s3://')) return null;
    const normBase = path.normalize(base).replace(/\/+$/, '');
    const normFull = path.normalize(full);
    if (!normFull.startsWith(normBase)) return null;
    const rel = normFull.slice(normBase.length).replace(/^\/+/, '');
    return rel;
  }

  private joinS3(bucket: string, prefix: string): string {
    const b = bucket;
    const p = prefix.replace(/^\/+|\/+$/g, '');
    return `s3://${b}${p ? '/' + p : ''}`;
  }

  private joinUri(base: string, rel: string) {
    const b = base.replace(/\/+$/g, '');
    const r = rel.replace(/^\/+/, '');
    return `${b}/${r}`;
  }

  private async uploadStream(s3: S3AppStorageBackend, localPath: string, destPath: string) {
    const { stream, done } = await s3.writeStream(destPath);
    await new Promise<void>((resolve, reject) => {
      const rs = createReadStream(localPath);
      rs.on('error', reject);
      stream.on('error', reject);
      stream.on('finish', resolve);
      rs.pipe(stream);
    });
    await done();
  }
}
