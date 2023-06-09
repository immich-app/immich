import { ApiProperty } from '@nestjs/swagger';

export enum DeleteAssetStatusEnum {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class DeleteAssetResponseDto {
  id!: string;

  @ApiProperty({ type: 'string', enum: DeleteAssetStatusEnum, enumName: 'DeleteAssetStatus' })
  status!: DeleteAssetStatusEnum;
}
