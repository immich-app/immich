import { PartnerEntity } from '@app/infra/entities';

export type PartnerDirection = 'shared-by' | 'shared-with';

export const IPartnerRepository = 'IPartnerRepository';

export interface IPartnerRepository {
  getAll(userId: string, direction: PartnerDirection): Promise<PartnerEntity[]>;
  get(sharedBy: string, sharedWith: string): Promise<PartnerEntity | null>;
  create(entity: Omit<PartnerEntity, 'id'>): Promise<PartnerEntity>;
  remove(entity: PartnerEntity): Promise<PartnerEntity>;
}
