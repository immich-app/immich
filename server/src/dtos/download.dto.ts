import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const DownloadInfoSchema = z
  .object({
    assetIds: z.array(z.uuidv4()).optional().describe('Asset IDs to download'),
    albumId: z.uuidv4().optional().describe('Album ID to download'),
    userId: z.uuidv4().optional().describe('User ID to download assets from'),
    archiveSize: z.int().min(1).optional().describe('Archive size limit in bytes'),
  })
  .meta({ id: 'DownloadInfoDto' });

const DownloadArchiveInfoSchema = z
  .object({
    size: z.int().describe('Archive size in bytes'),
    assetIds: z.array(z.uuidv4()).describe('Asset IDs in this archive'),
  })
  .meta({ id: 'DownloadArchiveInfo' });

const DownloadResponseSchema = z
  .object({
    totalSize: z.int().describe('Total size in bytes'),
    archives: z.array(DownloadArchiveInfoSchema).describe('Archive information'),
  })
  .meta({ id: 'DownloadResponseDto' });

const DownloadArchiveSchema = z
  .object({
    // Support receiving assetIds as a comma-separated string due to POST form submission.
    // While we can send arrays, the total request parameter count is limited to 1000 fields,
    // which would limit this DTO to a maximum of 1000 assets.
    assetIds: z
      .preprocess((val) => (typeof val === 'string' ? val.split(',') : val), z.array(z.uuidv4()))
      .nonoptional()
      .describe('Asset IDs'),
    edited: z
      .preprocess((val) => {
        if (val === 'true') {
          return true;
        }
        if (val === 'false') {
          return false;
        }
        return val;
      }, z.boolean())
      .optional()
      .describe('Download edited asset if available'),
    archiveName: z.string().optional().describe('The name of the archive to download, without extension'),
  })
  .meta({ id: 'DownloadArchiveDto' });

export class DownloadInfoDto extends createZodDto(DownloadInfoSchema) {}
export class DownloadResponseDto extends createZodDto(DownloadResponseSchema) {}
export class DownloadArchiveInfo extends createZodDto(DownloadArchiveInfoSchema) {}
export class DownloadArchiveDto extends createZodDto(DownloadArchiveSchema) {}
