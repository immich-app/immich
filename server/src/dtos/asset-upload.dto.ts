import { createZodDto } from 'nestjs-zod';
import { AssetMetadataUpsertItemSchema } from 'src/dtos/asset.dto.js';
import { AssetVisibilitySchema } from 'src/enum.js';
import { isoDatetimeToDate, JsonParsed, stringToBool } from 'src/validation.js';
import z from 'zod';

export enum UploadStatus {
  INITIALIZED = 'initialized',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Default chunk size (50 MiB) to stay comfortably below Cloudflare's 100 MB
 * request-body limit while preventing too many round-trips for large files.
 */
export const DEFAULT_UPLOAD_CHUNK_SIZE_BYTES = 50 * 1024 * 1024;

const UploadInitSchema = z
  .object({
    fileCreatedAt: isoDatetimeToDate.describe('File creation date'),
    fileModifiedAt: isoDatetimeToDate.describe('File modification date'),
    duration: z.coerce.number().int().min(0).optional().describe('Duration in milliseconds (for videos)'),
    filename: z.string().describe('Filename'),
    fileSize: z.coerce.number().int().positive().describe('Total size of the file in bytes'),
    checksum: z.string().describe('Base64 or hex encoded SHA1 hash of the full file'),
    isFavorite: stringToBool.optional().describe('Mark as favorite'),
    visibility: AssetVisibilitySchema.optional(),
    livePhotoVideoId: z.uuidv4().optional().describe('Live photo video ID'),
    metadata: JsonParsed.pipe(z.array(AssetMetadataUpsertItemSchema)).optional().describe('Asset metadata items'),
    chunkSize: z.coerce.number().int().positive().optional().describe('Requested chunk size in bytes'),
  })
  .meta({ id: 'AssetUploadInitDto' });

const UploadChunkSchema = z
  .object({
    chunkSize: z.coerce.number().int().positive().optional().describe('Size of this chunk in bytes'),
  })
  .meta({ id: 'AssetUploadChunkDto' });

const UploadCompleteSchema = z
  .object({
    fileCreatedAt: isoDatetimeToDate.optional().describe('File creation date'),
    fileModifiedAt: isoDatetimeToDate.optional().describe('File modification date'),
    duration: z.coerce.number().int().min(0).optional().describe('Duration in milliseconds (for videos)'),
    isFavorite: stringToBool.optional().describe('Mark as favorite'),
    visibility: AssetVisibilitySchema.optional(),
    livePhotoVideoId: z.uuidv4().optional().describe('Live photo video ID'),
    metadata: JsonParsed.pipe(z.array(AssetMetadataUpsertItemSchema)).optional().describe('Asset metadata items'),
  })
  .meta({ id: 'AssetUploadCompleteDto' });

const UploadInitResponseSchema = z
  .object({
    uploadId: z.uuidv4().describe('Unique identifier for this upload session'),
    chunkSize: z.number().int().positive().describe('Chunk size in bytes that the client should use'),
    status: z.enum(UploadStatus).describe('Current status of the upload session'),
    duplicate: z.boolean().optional().describe('Whether the asset already exists on the server'),
    assetId: z.uuidv4().optional().describe('Existing asset ID if the upload is a duplicate'),
  })
  .meta({ id: 'AssetUploadInitResponseDto' });

const UploadChunkResponseSchema = z
  .object({
    uploadId: z.uuidv4().describe('Unique identifier for this upload session'),
    chunkIndex: z.number().int().nonnegative().describe('Index of the chunk that was just uploaded'),
    received: z.number().int().nonnegative().describe('Total bytes received so far for this upload'),
    status: z.enum(UploadStatus).describe('Current status of the upload session'),
  })
  .meta({ id: 'AssetUploadChunkResponseDto' });

const UploadStatusResponseSchema = z
  .object({
    uploadId: z.uuidv4().describe('Unique identifier for this upload session'),
    received: z.number().int().nonnegative().describe('Total bytes received so far for this upload'),
    status: z.enum(UploadStatus).describe('Current status of the upload session'),
  })
  .meta({ id: 'AssetUploadStatusResponseDto' });

const UploadSessionParamSchema = z.object({
  uploadId: z.uuidv4(),
});

const UploadChunkParamSchema = z.object({
  uploadId: z.uuidv4(),
  chunkIndex: z.coerce.number().int().nonnegative(),
});

export class UploadSessionParamDto extends createZodDto(UploadSessionParamSchema) {}
export class UploadChunkParamDto extends createZodDto(UploadChunkParamSchema) {}

export class AssetUploadInitDto extends createZodDto(UploadInitSchema) {}
export class AssetUploadChunkDto extends createZodDto(UploadChunkSchema) {}
export class AssetUploadCompleteDto extends createZodDto(UploadCompleteSchema) {}
export class AssetUploadInitResponseDto extends createZodDto(UploadInitResponseSchema) {}
export class AssetUploadChunkResponseDto extends createZodDto(UploadChunkResponseSchema) {}
export class AssetUploadStatusResponseDto extends createZodDto(UploadStatusResponseSchema) {}
