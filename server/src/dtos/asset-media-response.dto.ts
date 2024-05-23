import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export enum AssetMediaStatusEnum {
  REPLACED = 'replaced',
  DUPLICATE = 'duplicate',
}
export class AssetMediaResponseDto {
  @ApiProperty({
    type: String,
    enum: AssetMediaStatusEnum,
    required: true,
    enumName: 'AssetMediaStatus',
  })
  status?: AssetMediaStatusEnum;
  @Optional()
  id?: string;
}
