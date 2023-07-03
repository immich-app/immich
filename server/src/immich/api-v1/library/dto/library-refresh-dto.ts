import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class LibraryRefreshDto {
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  libraryId!: string;

  // Forces all files to be re-read (slow)
  @IsOptional()
  @IsBoolean()
  refreshMetadata?: boolean = false;
}
