import { APIKeyEntity } from '@app/infra/db/entities';

export class APIKeyResponseDto {
  @ApiProperty({ type: 'integer' })
  id!: string;
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
