import { createZodDto } from 'nestjs-zod';
import { MaintenanceAction, MaintenanceActionSchema, StorageFolderSchema } from 'src/enum';
import z from 'zod';

const SetMaintenanceModeSchema = z
  .object({
    action: MaintenanceActionSchema,
    restoreBackupFilename: z.string().optional().describe('Restore backup filename'),
  })
  .refine(
    (data) => data.action !== MaintenanceAction.RestoreDatabase || (data.restoreBackupFilename?.length ?? 0) > 0,
    { error: 'Backup filename is required when action is restore_database', path: ['restoreBackupFilename'] },
  )
  .meta({ id: 'SetMaintenanceModeDto' });

const MaintenanceLoginSchema = z
  .object({
    token: z.string().optional().describe('Maintenance token'),
  })
  .meta({ id: 'MaintenanceLoginDto' });

const MaintenanceAuthSchema = z
  .object({
    username: z.string().describe('Maintenance username'),
  })
  .meta({ id: 'MaintenanceAuthDto' });

const MaintenanceStatusResponseSchema = z
  .object({
    active: z.boolean(),
    action: MaintenanceActionSchema,
    progress: z.number().optional(),
    task: z.string().optional(),
    error: z.string().optional(),
  })
  .meta({ id: 'MaintenanceStatusResponseDto' });

const MaintenanceDetectInstallStorageFolderSchema = z
  .object({
    folder: StorageFolderSchema,
    readable: z.boolean().describe('Whether the folder is readable'),
    writable: z.boolean().describe('Whether the folder is writable'),
    files: z.number().describe('Number of files in the folder'),
  })
  .meta({ id: 'MaintenanceDetectInstallStorageFolderDto' });

const MaintenanceDetectInstallResponseSchema = z
  .object({
    storage: z.array(MaintenanceDetectInstallStorageFolderSchema),
  })
  .meta({ id: 'MaintenanceDetectInstallResponseDto' });

export class SetMaintenanceModeDto extends createZodDto(SetMaintenanceModeSchema) {}
export class MaintenanceLoginDto extends createZodDto(MaintenanceLoginSchema) {}
export class MaintenanceAuthDto extends createZodDto(MaintenanceAuthSchema) {}
export class MaintenanceStatusResponseDto extends createZodDto(MaintenanceStatusResponseSchema) {}
export class MaintenanceDetectInstallResponseDto extends createZodDto(MaintenanceDetectInstallResponseSchema) {}
