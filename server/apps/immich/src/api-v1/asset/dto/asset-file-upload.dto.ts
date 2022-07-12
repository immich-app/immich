import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AssetFileUploadDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'string', format: 'binary' })
  assetData!: any;
}
