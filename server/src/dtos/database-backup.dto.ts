import z from 'zod';
import { createZodDto } from 'src/zod.js';

const DatabaseBackupSchema = z
  .object({
    filename: z.string().describe('Backup filename'),
    filesize: z.int().describe('Backup file size'),
    timezone: z.string().describe('Backup timezone'),
  })
  .meta({ id: 'DatabaseBackupDto' });

const DatabaseBackupListResponseSchema = z
  .object({
    backups: z.array(DatabaseBackupSchema).describe('List of backups'),
  })
  .meta({ id: 'DatabaseBackupListResponseDto' });

const DatabaseBackupUploadSchema = z
  .object({
    file: z.file().optional().describe('Database backup file'),
  })
  .meta({ id: 'DatabaseBackupUploadDto' });

const DatabaseBackupDeleteSchema = z
  .object({
    backups: z.array(z.string()).describe('Backup filenames to delete'),
  })
  .meta({ id: 'DatabaseBackupDeleteDto' });

export class DatabaseBackupListResponseDto extends createZodDto(DatabaseBackupListResponseSchema) {}
export class DatabaseBackupUploadDto extends createZodDto(DatabaseBackupUploadSchema) {}
export class DatabaseBackupDeleteDto extends createZodDto(DatabaseBackupDeleteSchema) {}
