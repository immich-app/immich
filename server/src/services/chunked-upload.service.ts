import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { StorageCore } from 'src/cores/storage.core';
import {
  ChunkedUploadSessionResponseDto,
  CreateChunkedUploadSessionDto,
  FinishChunkedUploadResponseDto,
  UploadChunkResponseDto,
} from 'src/dtos/asset-media-chunked.dto';
import { AssetMediaStatus } from 'src/dtos/asset-media-response.dto';
import { AssetVisibility, JobName, Permission, StorageFolder } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { UploadFile } from 'src/types';
import { mimeTypes } from 'src/utils/mime-types';
import { AuthDto } from 'src/dtos/auth.dto';
import { requireUploadAccess } from 'src/utils/access';

/** Default chunk size: 50 MB */
const DEFAULT_CHUNK_SIZE = 50 * 1024 * 1024;
/** Upload session TTL: 24 hours */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
/** Maximum chunk size: 95 MB (under Cloudflare 100MB limit with overhead margin) */
const MAX_CHUNK_SIZE = 95 * 1024 * 1024;

interface ChunkedUploadSession {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
  receivedChunks: Set<number>;
  createdAt: Date;
  expiresAt: Date;
  tempDir: string;
  dto: CreateChunkedUploadSessionDto;
}

@Injectable()
export class ChunkedUploadService extends BaseService {
  /**
   * In-memory session store. In production, this should use Redis or a database
   * for horizontal scaling. For the scope of this proposal, in-memory is sufficient
   * to demonstrate the approach.
   */
  private sessions = new Map<string, ChunkedUploadSession>();

  /**
   * Step 1: Create a chunked upload session.
   * The client receives a sessionId and uploads chunks to it.
   */
  async createSession(
    auth: AuthDto,
    dto: CreateChunkedUploadSessionDto,
  ): Promise<ChunkedUploadSessionResponseDto> {
    requireUploadAccess(auth);

    await this.requireAccess({
      auth,
      permission: Permission.AssetUpload,
      ids: [auth.user.id],
    });

    // Validate the file type
    if (!mimeTypes.isAsset(dto.filename)) {
      throw new BadRequestException(`Unsupported file type: ${dto.filename}`);
    }

    // Check quota
    this.requireQuota(auth, dto.fileSize);

    const sessionId = randomUUID();
    const chunkSize = Math.min(dto.chunkSize || DEFAULT_CHUNK_SIZE, MAX_CHUNK_SIZE);
    const totalChunks = Math.ceil(dto.fileSize / chunkSize);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    // Create temp directory for chunks
    const tempDir = join(
      StorageCore.getNestedFolder(StorageFolder.Upload, auth.user.id, sessionId),
      'chunks',
    );
    this.storageRepository.mkdirSync(tempDir);

    const session: ChunkedUploadSession = {
      id: sessionId,
      userId: auth.user.id,
      filename: dto.filename,
      fileSize: dto.fileSize,
      chunkSize,
      totalChunks,
      receivedChunks: new Set(),
      createdAt: new Date(),
      expiresAt,
      tempDir,
      dto,
    };

    this.sessions.set(sessionId, session);

    this.logger.log(
      `Created chunked upload session ${sessionId} for file "${dto.filename}" ` +
        `(${dto.fileSize} bytes, ${totalChunks} chunks of ${chunkSize} bytes)`,
    );

    return {
      sessionId,
      chunkSize,
      totalChunks,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Step 2: Upload a single chunk.
   * Each chunk is saved to disk in the session's temp directory.
   */
  async uploadChunk(
    auth: AuthDto,
    sessionId: string,
    chunkIndex: number,
    chunkData: Buffer,
  ): Promise<UploadChunkResponseDto> {
    const session = this.getSession(sessionId, auth.user.id);

    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new BadRequestException(
        `Invalid chunk index ${chunkIndex}. Expected 0-${session.totalChunks - 1}`,
      );
    }

    if (session.receivedChunks.has(chunkIndex)) {
      this.logger.warn(`Chunk ${chunkIndex} already received for session ${sessionId}, overwriting`);
    }

    // Validate chunk size (last chunk can be smaller)
    const isLastChunk = chunkIndex === session.totalChunks - 1;
    const expectedMaxSize = isLastChunk
      ? session.fileSize - chunkIndex * session.chunkSize
      : session.chunkSize;

    if (chunkData.length > expectedMaxSize && !isLastChunk) {
      throw new BadRequestException(
        `Chunk ${chunkIndex} size ${chunkData.length} exceeds expected maximum ${expectedMaxSize}`,
      );
    }

    // Write chunk to temp file
    const chunkPath = join(session.tempDir, `chunk_${String(chunkIndex).padStart(6, '0')}`);
    const writeStream = createWriteStream(chunkPath);
    writeStream.write(chunkData);
    writeStream.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    session.receivedChunks.add(chunkIndex);

    this.logger.debug(
      `Received chunk ${chunkIndex + 1}/${session.totalChunks} for session ${sessionId} ` +
        `(${chunkData.length} bytes)`,
    );

    return {
      chunkIndex,
      chunksReceived: session.receivedChunks.size,
      totalChunks: session.totalChunks,
    };
  }

  /**
   * Step 3: Finish the chunked upload.
   * All chunks are assembled into the final file, checksum is computed,
   * and the asset is created through the standard asset creation pipeline.
   */
  async finishUpload(
    auth: AuthDto,
    sessionId: string,
  ): Promise<FinishChunkedUploadResponseDto> {
    const session = this.getSession(sessionId, auth.user.id);

    // Verify all chunks were received
    if (session.receivedChunks.size !== session.totalChunks) {
      const missing = [];
      for (let i = 0; i < session.totalChunks; i++) {
        if (!session.receivedChunks.has(i)) {
          missing.push(i);
        }
      }
      throw new BadRequestException(
        `Missing ${missing.length} chunks: [${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}]`,
      );
    }

    try {
      // Assemble chunks into final file
      const { finalPath, checksum, size } = await this.assembleChunks(session, auth);

      this.logger.log(
        `Assembled ${session.totalChunks} chunks into ${finalPath} ` +
          `(${size} bytes, sha1: ${checksum.toString('hex')})`,
      );

      // Create the upload file descriptor
      const uploadFile: UploadFile = {
        uuid: sessionId,
        checksum,
        originalPath: finalPath,
        originalName: session.filename,
        size,
      };

      // Reuse the standard asset creation logic via AssetMediaService
      // Here we directly create the asset, mirroring uploadAsset logic
      const { dto } = session;

      // Check for duplicates by checksum
      const duplicateId = await this.assetRepository.getUploadAssetIdByChecksum(
        auth.user.id,
        checksum,
      );
      if (duplicateId) {
        // Clean up the assembled file since it's a duplicate
        await this.jobRepository.queue({
          name: JobName.FileDelete,
          data: { files: [finalPath] },
        });
        this.cleanupSession(sessionId);
        return { assetId: duplicateId, isDuplicate: true };
      }

      // Create the asset
      const asset = await this.assetRepository.create({
        ownerId: auth.user.id,
        libraryId: null,
        checksum: uploadFile.checksum,
        originalPath: uploadFile.originalPath,
        deviceAssetId: dto.deviceAssetId,
        deviceId: dto.deviceId,
        fileCreatedAt: dto.fileCreatedAt,
        fileModifiedAt: dto.fileModifiedAt,
        localDateTime: dto.fileCreatedAt,
        type: mimeTypes.assetType(uploadFile.originalPath),
        isFavorite: dto.isFavorite,
        duration: dto.duration || null,
        visibility: dto.visibility ?? AssetVisibility.Timeline,
        livePhotoVideoId: dto.livePhotoVideoId,
        originalFileName: dto.filename,
      });

      await this.storageRepository.utimes(
        uploadFile.originalPath,
        new Date(),
        new Date(dto.fileModifiedAt),
      );
      await this.assetRepository.upsertExif(
        { assetId: asset.id, fileSizeInByte: uploadFile.size },
        { lockedPropertiesBehavior: 'override' },
      );

      await this.eventRepository.emit('AssetCreate', { asset });
      await this.jobRepository.queue({
        name: JobName.AssetExtractMetadata,
        data: { id: asset.id, source: 'upload' },
      });

      await this.userRepository.updateUsage(auth.user.id, uploadFile.size);

      this.cleanupSession(sessionId);

      return { assetId: asset.id, isDuplicate: false };
    } catch (error) {
      // Cleanup on error
      this.logger.error(`Failed to finish chunked upload session ${sessionId}: ${error}`);
      await this.cleanupSessionFiles(session);
      this.cleanupSession(sessionId);
      throw error;
    }
  }

  /**
   * Cancel an upload session and clean up temp files.
   */
  async cancelSession(auth: AuthDto, sessionId: string): Promise<void> {
    const session = this.getSession(sessionId, auth.user.id);
    await this.cleanupSessionFiles(session);
    this.cleanupSession(sessionId);
    this.logger.log(`Cancelled chunked upload session ${sessionId}`);
  }

  /**
   * Get session status (for client polling / resume support).
   */
  getSessionStatus(auth: AuthDto, sessionId: string) {
    const session = this.getSession(sessionId, auth.user.id);
    const receivedChunks = [...session.receivedChunks].sort((a, b) => a - b);
    return {
      sessionId: session.id,
      filename: session.filename,
      fileSize: session.fileSize,
      chunkSize: session.chunkSize,
      totalChunks: session.totalChunks,
      receivedChunks,
      chunksReceived: session.receivedChunks.size,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  private getSession(sessionId: string, userId: string): ChunkedUploadSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Upload session ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new NotFoundException(`Upload session ${sessionId} not found`);
    }

    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      throw new BadRequestException(`Upload session ${sessionId} has expired`);
    }

    return session;
  }

  private async assembleChunks(
    session: ChunkedUploadSession,
    auth: AuthDto,
  ): Promise<{ finalPath: string; checksum: Buffer; size: number }> {
    const ext = '.' + session.filename.split('.').pop()?.toLowerCase();
    const finalDir = StorageCore.getNestedFolder(StorageFolder.Upload, auth.user.id, session.id);
    this.storageRepository.mkdirSync(finalDir);
    const finalPath = join(finalDir, `${session.id}${ext}`);

    const hash = createHash('sha1');
    const writeStream = createWriteStream(finalPath);
    let totalSize = 0;

    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = join(session.tempDir, `chunk_${String(i).padStart(6, '0')}`);
      const readStream = createReadStream(chunkPath);

      await new Promise<void>((resolve, reject) => {
        readStream.on('data', (data: Buffer) => {
          hash.update(data);
          totalSize += data.length;
        });
        readStream.on('end', resolve);
        readStream.on('error', reject);
        readStream.pipe(writeStream, { end: false });
      });
    }

    writeStream.end();
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const checksum = hash.digest();

    return { finalPath, checksum, size: totalSize };
  }

  private cleanupSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private async cleanupSessionFiles(session: ChunkedUploadSession): Promise<void> {
    try {
      const files = await readdir(session.tempDir);
      for (const file of files) {
        await unlink(join(session.tempDir, file)).catch(() => {});
      }
    } catch {
      // Directory may not exist
    }
  }

  private requireQuota(auth: AuthDto, size: number) {
    if (auth.user.quotaSizeInBytes !== null && auth.user.quotaSizeInBytes < auth.user.quotaUsageInBytes + size) {
      throw new BadRequestException('Quota has been exceeded!');
    }
  }
}
