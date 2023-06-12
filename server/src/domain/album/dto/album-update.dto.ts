import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator';

export class UpdateAlbumDto {
  @IsOptional()
  @ApiProperty()
  albumName?: string;

  @ValidateUUID({ optional: true })
  albumThumbnailAssetId?: string;
}
