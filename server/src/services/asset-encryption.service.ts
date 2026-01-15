import { Injectable } from '@nestjs/common';
import { createCipheriv, randomBytes, scrypt, ScryptOptions } from 'node:crypto';
import { createReadStream, createWriteStream, renameSync, unlinkSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetType, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

function scryptAsync(password: string | Buffer, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

interface AssetJobStatus {
  assetId: string;
  facesRecognizedAt: Date | null;
  ocrAt: Date | null;
  smartSearchAt: Date | null;
  videoEncodedAt: Date | null;
  encryptedAt: Date | null;
}

// In-memory cache for migration vault keys (keyed by userId)
// In production, consider using Redis or a secure vault service
const migrationKeyCache = new Map<string, { key: Buffer; expiresAt: Date }>();

// Migration key expiry (1 hour)
const MIGRATION_KEY_EXPIRY_MS = 60 * 60 * 1000;

@Injectable()
export class AssetEncryptionService extends BaseService {
  /**
   * Queue encryption migration for a user's unencrypted assets.
   * Must be called with an unlocked vault to cache the vault key for migration.
   */
  async queueEncryptionMigration(auth: AuthDto): Promise<{ queuedCount: number }> {
    const userId = auth.user.id;

    // Get vault key from session
    const vaultKey = await this.getVaultKeyFromSession(auth);
    if (!vaultKey) {
      throw new Error('Vault must be unlocked to start encryption migration');
    }

    // Cache vault key for migration jobs
    migrationKeyCache.set(userId, {
      key: vaultKey,
      expiresAt: new Date(Date.now() + MIGRATION_KEY_EXPIRY_MS),
    });

    // Get unencrypted assets for this user
    const unencryptedAssetIds = await this.assetEncryptionRepository.getUnencryptedAssetIds(userId, 1000);

    // Queue encryption jobs for each asset
    let queuedCount = 0;
    for (const assetId of unencryptedAssetIds) {
      await this.jobRepository.queue({
        name: JobName.AssetEncrypt,
        data: { id: assetId },
      });
      queuedCount++;
    }

    this.logger.log(`Queued ${queuedCount} assets for encryption migration for user ${userId}`);

    return { queuedCount };
  }

  @OnJob({ name: JobName.AssetEncryptAll, queue: QueueName.Encryption })
  handleEncryptAll(_job: JobOf<JobName.AssetEncryptAll>): JobStatus {
    // This job is for admin-triggered encryption of all users' assets
    // For now, it's a no-op - users should trigger their own migration
    this.logger.log('AssetEncryptAll job triggered - this requires per-user vault unlock');
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetEncrypt, queue: QueueName.Encryption })
  async handleEncrypt(job: JobOf<JobName.AssetEncrypt>): Promise<JobStatus> {
    const { id: assetId } = job;

    // Get the asset with files
    const asset = await this.assetRepository.getById(assetId, { files: true });
    if (!asset) {
      this.logger.warn(`Asset not found: ${assetId}`);
      return JobStatus.Failed;
    }

    // Check if user has a vault set up
    const hasVault = await this.vaultRepository.exists(asset.ownerId);
    if (!hasVault) {
      // User doesn't have encryption enabled, skip
      this.logger.debug(`User ${asset.ownerId} does not have vault, skipping encryption`);
      // Queue S3 upload for unencrypted asset
      await this.jobRepository.queue({ name: JobName.S3UploadAsset, data: { id: assetId } });
      return JobStatus.Skipped;
    }

    // Check if already encrypted
    const existingEncryption = await this.assetEncryptionRepository.getByAssetId(assetId);
    if (existingEncryption) {
      this.logger.debug(`Asset ${assetId} already encrypted`);
      return JobStatus.Skipped;
    }

    // Get vault key from migration cache
    const cachedKey = migrationKeyCache.get(asset.ownerId);
    if (!cachedKey || cachedKey.expiresAt < new Date()) {
      // Cache expired or not found - asset will be encrypted when user triggers migration again
      if (cachedKey) {
        migrationKeyCache.delete(asset.ownerId);
      }
      this.logger.debug(`No valid migration key for user ${asset.ownerId}, deferring encryption of ${assetId}`);
      // Queue for S3 upload without encryption
      await this.jobRepository.queue({ name: JobName.S3UploadAsset, data: { id: assetId } });
      return JobStatus.Skipped;
    }

    const vaultKey = cachedKey.key;

    try {
      // Generate a new DEK (Data Encryption Key) for this asset
      const dek = this.cryptoRepository.generateEncryptionKey();

      // Encrypt all files for this asset
      // 1. Original file
      const originalResult = await this.encryptFile(asset.originalPath, dek);

      // 2. Thumbnail and preview files
      const files = asset.files || [];
      for (const file of files) {
        await this.encryptFile(file.path, dek);
      }

      // 3. Encoded video (if exists)
      if (asset.encodedVideoPath) {
        await this.encryptFile(asset.encodedVideoPath, dek);
      }

      // Wrap DEK with vault key
      const wrappedDek = this.cryptoRepository.wrapKey(dek, vaultKey);

      // Get vault version
      const vault = await this.vaultRepository.getByUserId(asset.ownerId);
      const vaultVersion = vault?.version ?? 1;

      // Store encryption metadata
      await this.assetEncryptionRepository.create({
        id: this.cryptoRepository.randomUUID(),
        assetId,
        wrappedDek,
        fileIv: originalResult.iv,
        authTag: originalResult.authTag,
        algorithm: 'aes-256-gcm',
        vaultVersion,
      });

      // Update job status
      await this.assetRepository.upsertJobStatus({
        assetId,
        encryptedAt: new Date(),
      });

      this.logger.log(`Successfully encrypted asset ${assetId}`);

      // Queue S3 upload for encrypted asset
      await this.jobRepository.queue({ name: JobName.S3UploadAsset, data: { id: assetId } });

      return JobStatus.Success;
    } catch (error) {
      this.logger.error(`Error encrypting asset ${assetId}: ${error}`);
      return JobStatus.Failed;
    }
  }

  /**
   * Get the vault key from the session cache.
   */
  private async getVaultKeyFromSession(auth: AuthDto): Promise<Buffer | null> {
    if (!auth.session) {
      return null;
    }

    const sessionRecord = await this.sessionRepository.update(auth.session.id, {});
    if (!sessionRecord?.encryptedVaultKeyCache || !sessionRecord.vaultKeyExpiresAt) {
      return null;
    }

    if (new Date(sessionRecord.vaultKeyExpiresAt) <= new Date()) {
      await this.sessionRepository.update(auth.session.id, {
        encryptedVaultKeyCache: null,
        vaultKeyExpiresAt: null,
      });
      return null;
    }

    try {
      const sessionKey = await this.deriveSessionKey(auth.session.id);
      return this.cryptoRepository.unwrapKey(sessionRecord.encryptedVaultKeyCache, sessionKey);
    } catch {
      this.logger.warn(`Failed to decrypt vault key from session cache`);
      return null;
    }
  }

  /**
   * Derive a session key from the session ID.
   */
  private async deriveSessionKey(sessionId: string): Promise<Buffer> {
    const salt = Buffer.from('immich-vault-session-key', 'utf8');
    return scryptAsync(sessionId, salt, 32, {
      N: 2 ** 14,
      r: 8,
      p: 1,
    });
  }

  private isMLComplete(assetType: AssetType, jobStatus: AssetJobStatus): boolean {
    // Smart search must be complete
    if (!jobStatus.smartSearchAt) {
      return false;
    }

    // Face recognition must be complete
    if (!jobStatus.facesRecognizedAt) {
      return false;
    }

    // OCR must be complete (if applicable - for now assume it's optional)
    // if (!jobStatus.ocrAt) {
    //   return false;
    // }

    // For videos, video encoding must be complete
    if (assetType === AssetType.Video && !jobStatus.videoEncodedAt) {
      return false;
    }

    return true;
  }

  /**
   * Encrypts a file in place using AES-256-GCM.
   * Format: [16-byte IV][encrypted data][16-byte auth tag]
   */
  private async encryptFile(filePath: string, dek: Buffer): Promise<{ iv: string; authTag: string }> {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', dek, iv);

    const tempPath = `${filePath}.enc`;

    const readStream = createReadStream(filePath);
    const writeStream = createWriteStream(tempPath);

    // Write IV first
    writeStream.write(iv);

    await pipeline(readStream, cipher, writeStream);

    const authTag = cipher.getAuthTag();

    // Append auth tag
    const appendStream = createWriteStream(tempPath, { flags: 'a' });
    appendStream.write(authTag);
    appendStream.end();

    // Replace original with encrypted file
    unlinkSync(filePath);
    renameSync(tempPath, filePath);

    return {
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }
}
