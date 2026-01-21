import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DatabaseBackupDto {
  filename!: string;
  filesize!: number;
}

export class DatabaseBackupListResponseDto {
  backups!: DatabaseBackupDto[];
}

export class DatabaseBackupUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  file?: any;
}

export class DatabaseBackupDeleteDto {
  @IsString({ each: true })
  backups!: string[];
}
