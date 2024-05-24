import { ApiProperty } from '@nestjs/swagger';

export enum AssetMediaStatusEnum {
  REPLACED = 'replaced',
  DUPLICATE = 'duplicate',
}
export class AssetMediaResponseDto {
  @ApiProperty({ enum: AssetMediaStatusEnum, enumName: 'AssetMediaStatus' })
  status!: AssetMediaStatusEnum;
  id!: string;
}
