import { AssetType } from '@app/database/entities/asset.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { CreateAssetDto } from './create-asset.dto';

export class AssetFileUploadDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'string', format: 'binary' })
  assetData!: any;
}
