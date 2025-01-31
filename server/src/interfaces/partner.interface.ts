import { Updateable } from 'kysely';
import { Partners } from 'src/db';
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
  get(partner: PartnerIds): Promise<PartnerEntity | undefined>;
  create(partner: PartnerIds): Promise<PartnerEntity>;
  remove(partner: PartnerIds): Promise<void>;
  update(partner: PartnerIds, entity: Updateable<Partners>): Promise<PartnerEntity>;
}
