import { PartnerEntity } from '@app/infra/entities';

export class PartnerResponseDto {
  id!: string;
  sharedBy!: string;
  sharedWith!: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapPartner(entity: PartnerEntity): PartnerResponseDto {
  return {
    id: entity.id,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    sharedBy: entity.sharedBy,
    sharedWith: entity.sharedWith,
  };
}
