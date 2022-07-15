import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GetAssetThumbnailDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  assetId!: string;

  /**
   * Get thumbnail in JPEG format which has higher resolution than webp thumbnail format
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value == 'true') {
      return true;
    } else if (value == 'false') {
      return false;
    }
    return value;
  })
  @ApiProperty({ type: Boolean })
  isHighQuality?: boolean;
}
