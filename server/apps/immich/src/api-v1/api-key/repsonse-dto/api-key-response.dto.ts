import { APIKeyEntity } from '@app/database';
import { ApiProperty } from '@nestjs/swagger';

export class APIKeyResponseDto {
  @ApiProperty({ type: 'integer' })
  id!: number;
  name!: string;
  createdAt!: string;
  updatedAt!: string;
}

export function mapKey(entity: APIKeyEntity): APIKeyResponseDto {
  return {
    id: entity.id,
    name: entity.name,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
