import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { ValidateUUID } from 'src/validation';

export class AssetFullSyncDto {
  @ValidateUUID({ optional: true })
  lastId?: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedUntil!: string;

  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'integer' })
  limit!: number;

  @ValidateUUID({ optional: true })
  userId?: string;
}

export class AssetDeltaSyncDto {
  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAfter!: string;

  @ValidateUUID({ each: true })
  userIds!: string[];
}

export class AssetDeltaSyncResponseDto {
  needsFullSync!: boolean;
  upserted!: AssetResponseDto[];
  deleted!: string[];
}
