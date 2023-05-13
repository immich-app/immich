import { PartnerEntity } from '@app/infra/entities';
import { IPartnerRepository, PartnerIds } from './partner.repository';

export enum PartnerDirection {
  SharedBy = 'shared-by',
  SharedWith = 'shared-with',
}

export class PartnerCore {
  constructor(private repository: IPartnerRepository) {}

  async getAll(userId: string, direction: PartnerDirection): Promise<PartnerEntity[]> {
    const partners = await this.repository.getAll(userId);
    const key = direction === PartnerDirection.SharedBy ? 'sharedById' : 'sharedWithId';
    return partners.filter((partner) => partner[key] === userId);
  }

  get(ids: PartnerIds): Promise<PartnerEntity | null> {
    return this.repository.get(ids);
  }

  async create(ids: PartnerIds): Promise<PartnerEntity> {
    return this.repository.create(ids);
  }

  async remove(ids: PartnerIds): Promise<void> {
    await this.repository.remove(ids as PartnerEntity);
  }

  hasAssetAccess(assetId: string, userId: string): Promise<boolean> {
    return this.repository.hasAssetAccess(assetId, userId);
  }
}
