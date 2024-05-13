import { PartnerEntity } from 'src/entities/partner.entity';

export interface PartnerIds {
  sharedById: string;
  sharedWithId: string;
}

export enum PartnerDirection {
  SharedBy = 'shared-by',
  SharedWith = 'shared-with',
}

export const IPartnerRepository = 'IPartnerRepository';

export interface IPartnerRepository {
  getAll(userId: string): Promise<PartnerEntity[]>;
  get(partner: PartnerIds): Promise<PartnerEntity | null>;
  create(partner: PartnerIds): Promise<PartnerEntity>;
  remove(entity: PartnerEntity): Promise<void>;
  update(entity: Partial<PartnerEntity>): Promise<PartnerEntity>;
}
