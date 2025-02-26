import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive, IsString } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { Optional, ValidateDate, ValidateUUID } from 'src/validation';

export class AssetFullSyncDto {
  @ValidateUUID({ optional: true })
  lastId?: string;

  @ValidateDate()
  updatedUntil!: Date;

  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'integer' })
  limit!: number;

  @ValidateUUID({ optional: true })
  userId?: string;
}

export class AssetDeltaSyncDto {
  @ValidateDate()
  updatedAfter!: Date;

  @ValidateUUID({ each: true })
  userIds!: string[];
}

export class AssetDeltaSyncResponseDto {
  needsFullSync!: boolean;
  upserted!: AssetResponseDto[];
  deleted!: string[];
}

export class SyncUserV1 {
  id!: string;
  name!: string;
  email!: string;
  deletedAt!: Date | null;
}

export class SyncUserDeleteV1 {
  userId!: string;
}

export type SyncItem = {
  [SyncEntityType.UserV1]: SyncUserV1;
  [SyncEntityType.UserDeleteV1]: SyncUserDeleteV1;
};

const responseDtos = [
  //
  SyncUserV1,
  SyncUserDeleteV1,
];

export const extraSyncModels = responseDtos;

export class SyncStreamDto {
  @IsEnum(SyncRequestType, { each: true })
  @ApiProperty({ enumName: 'SyncRequestType', enum: SyncRequestType, isArray: true })
  types!: SyncRequestType[];
}

export class SyncAckDto {
  @ApiProperty({ enumName: 'SyncEntityType', enum: SyncEntityType })
  type!: SyncEntityType;
  ack!: string;
}

export class SyncAckSetDto {
  @IsString({ each: true })
  acks!: string[];
}

export class SyncAckDeleteDto {
  @IsEnum(SyncEntityType, { each: true })
  @ApiProperty({ enumName: 'SyncEntityType', enum: SyncEntityType, isArray: true })
  @Optional()
  types?: SyncEntityType[];
}
