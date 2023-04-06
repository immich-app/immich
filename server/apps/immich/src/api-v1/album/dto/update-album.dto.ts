import { ApiProperty } from '@nestjs/swagger';
import { ValidateUUID } from 'apps/immich/src/decorators/validate-uuid.decorator';
import { IsOptional } from 'class-validator';

export class UpdateAlbumDto {
  @IsOptional()
  @ApiProperty()
  albumName?: string;

  @ValidateUUID({ optional: true })
  albumThumbnailAssetId?: string;
}
