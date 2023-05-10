import { PartnerEntity } from '@app/infra/entities';
import { CreatePartnerDto } from './dto';

export type PartnerDirection = 'shared-by' | 'shared-with';

export const IPartnerRepository = 'IPartnerRepository';

export interface IPartnerRepository {
  getAll(userId: string, direction: PartnerDirection): Promise<PartnerEntity[]>;
  get(sharedBy: string, sharedWith: string): Promise<PartnerEntity | null>;
  create(createPartnerDto: CreatePartnerDto): Promise<PartnerEntity>;
  remove(entity: PartnerEntity): Promise<PartnerEntity>;
  hasAssetAccess(assetId: string, userId: string): Promise<boolean>;
}
