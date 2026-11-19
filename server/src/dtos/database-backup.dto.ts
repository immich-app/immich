import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';

const DatabaseBackupSchema = z
  .object({
    filename: z.string().describe('Backup filename'),
    filesize: z.int().describe('Backup file size'),
    timezone: z.string().describe('Backup timezone'),
  })
  .meta({ id: 'DatabaseBackupDto' });

export class DatabaseBackupListResponseDto extends createZodDto({
  backups: z.array(DatabaseBackupSchema).describe('List of backups'),
}) {}

export class DatabaseBackupUploadDto extends createZodDto({
  file: z.file().optional().describe('Database backup file'),
}) {}

export class DatabaseBackupDeleteDto extends createZodDto({
  backups: z.array(z.string()).describe('Backup filenames to delete'),
}) {}
