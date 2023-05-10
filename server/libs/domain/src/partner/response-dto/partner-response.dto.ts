import { PartnerEntity } from '@app/infra/entities';

export class PartnerResponseDto {
  sharedBy!: string;
  sharedWith!: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapPartner(entity: PartnerEntity): PartnerResponseDto {
  return {
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    sharedBy: entity.sharedBy,
    sharedWith: entity.sharedWith,
  };
}
