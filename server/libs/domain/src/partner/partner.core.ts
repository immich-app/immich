import { PartnerEntity } from '@app/infra/entities';
import { BadRequestException } from '@nestjs/common';
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

  create(ids: PartnerIds): Promise<PartnerEntity> {
    return this.repository.create(ids);
  }

  async remove(ids: PartnerIds): Promise<void> {
    const partner = await this.get(ids);
    if (!partner) {
      throw new BadRequestException('Partner not found');
    }

    await this.repository.remove(partner);
  }

  hasAssetAccess(assetId: string, userId: string): Promise<boolean> {
    return this.repository.hasAssetAccess(assetId, userId);
  }
}
