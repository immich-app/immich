import type { ApiKey } from '@prisma/client';

export class APIKeyResponseDto {
  id!: string;
  name!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export function mapKey(entity: ApiKey): APIKeyResponseDto {
  return {
    id: entity.id,
    name: entity.name,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
