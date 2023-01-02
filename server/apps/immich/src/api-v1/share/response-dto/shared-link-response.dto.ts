import { SharedLinkEntity, SharedLinkType } from '@app/database/entities/shared-link.entity';
import { ApiProperty } from '@nestjs/swagger';
import { AlbumResponseDto, mapAlbum } from '../../album/response-dto/album-response.dto';

export class SharedLinkResponseDto {
  id!: string;
  description?: string;
  userId!: string;
  key!: string;

  @ApiProperty({ enumName: 'SharedLinkType', enum: SharedLinkType })
  type!: SharedLinkType;
  createdAt!: string;
  expiresAt?: string;
  assets!: string[];
  album!: AlbumResponseDto;
}

export function mapSharedLinkToResponseDto(sharedLink: SharedLinkEntity): SharedLinkResponseDto {
  return {
    id: sharedLink.id,
    description: sharedLink.description,
    userId: sharedLink.userId,
    key: sharedLink.key,
    type: sharedLink.type,
    createdAt: sharedLink.createdAt,
    expiresAt: sharedLink.expiresAt,
    assets: sharedLink.assets ? sharedLink.assets.map((asset) => asset.id) : [],
    album: mapAlbum(sharedLink.album),
  };
}
