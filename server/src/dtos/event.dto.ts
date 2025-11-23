import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { User } from 'src/database';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { Optional, ValidateUUID } from 'src/validation';

export class CreateEventDto {
  @IsString()
  @ApiProperty()
  eventName!: string;

  @IsString()
  @Optional()
  description?: string;

  @ValidateUUID({ optional: true })
  eventThumbnailAssetId?: string;
}

export class UpdateEventDto {
  @Optional()
  @IsString()
  eventName?: string;

  @Optional()
  @IsString()
  description?: string;

  @ValidateUUID({ optional: true })
  eventThumbnailAssetId?: string;
}

export class EventResponseDto {
  id!: string;
  ownerId!: string;
  eventName!: string;
  description!: string;
  createdAt!: Date;
  updatedAt!: Date;
  eventThumbnailAssetId!: string | null;
  owner!: UserResponseDto;
  @ApiProperty({ type: 'integer' })
  albumCount!: number;
  @ApiProperty({ type: 'boolean' })
  isOwner?: boolean;
}

export class EventStatisticsResponseDto {
  @ApiProperty({ type: 'integer' })
  owned!: number;
}

export type MapEventDto = {
  eventName: string;
  description: string;
  eventThumbnailAssetId: string | null;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  ownerId: string;
  owner: User;
  albumCount?: number;
};

export const mapEvent = (entity: MapEventDto): EventResponseDto => {
  return {
    eventName: entity.eventName,
    description: entity.description,
    eventThumbnailAssetId: entity.eventThumbnailAssetId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    id: entity.id,
    ownerId: entity.ownerId,
    owner: mapUser(entity.owner),
    albumCount: entity.albumCount || 0,
  };
};
