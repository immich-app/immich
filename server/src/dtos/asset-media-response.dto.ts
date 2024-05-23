import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export enum AssetMediaStatusEnum {
  UPDATED = 'updated',
  DUPLICATE = 'duplicate',
}

export class DefaultAssetMediaResponseDto {
  @ApiProperty({
    type: String,
    enum: AssetMediaStatusEnum,
    required: true,
    enumName: 'AssetMediaStatus',
  })
  readonly status?: string;
  @IsOptional()
  assetId?: string;
  @IsOptional()
  copyId?: string;
  @IsOptional()
  duplicateId?: string;
}

export class AssetMediaUpdateResponseDto {
  readonly status = 'updated';
  assetId: string;
  copyId: string;
  constructor(assetId: string, copyId: string) {
    this.assetId = assetId;
    this.copyId = copyId;
  }
}
export class DuplicateAssetResponseDto {
  readonly status = 'duplicate';
  duplicateId: string;
  constructor(duplicateId: string) {
    this.duplicateId = duplicateId;
  }
}

export type AssetMediaResponseDto = AssetMediaUpdateResponseDto | DuplicateAssetResponseDto;
