import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DatabaseBackupListResponseDto {
  backups!: string[];
}

export class DatabaseBackupUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  file?: any;
}

export class DatabaseBackupDeleteDto {
  @IsString({ each: true })
  backups!: string[];
}
