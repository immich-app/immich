import { APIKeyEntity } from '@app/infra/entities';

export class APIKeyCreateResponseDto {
  secret!: string;
  apiKey!: APIKeyResponseDto;
}

export class APIKeyResponseDto {
  id!: string;
  name!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export function mapKey(entity: APIKeyEntity): APIKeyResponseDto {
  return {
    id: entity.id,
    name: entity.name,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
