import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { SystemConfigLibraryScanDto } from './system-config-library-scan.dto';

export class SystemConfigLibraryDto {
  @Type(() => SystemConfigLibraryScanDto)
  @ValidateNested()
  @IsObject()
  scan!: SystemConfigLibraryScanDto;
}
