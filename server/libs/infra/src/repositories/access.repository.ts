import { IAccessRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerEntity } from '../entities';

export class AccessRepository implements IAccessRepository {
  constructor(@InjectRepository(PartnerEntity) private partnerRepository: Repository<PartnerEntity>) {}

  hasPartnerAccess(userId: string, partnerId: string): Promise<boolean> {
    return this.partnerRepository.exist({
      where: {
        sharedWithId: userId,
        sharedById: partnerId,
      },
    });
  }

  hasPartnerAssetAccess(userId: string, assetId: string): Promise<boolean> {
    return this.partnerRepository.exist({
      where: {
        sharedWith: {
          id: userId,
        },
        sharedBy: {
          assets: {
            id: assetId,
          },
        },
      },
      relations: {
        sharedWith: true,
        sharedBy: {
          assets: true,
        },
      },
    });
  }
}
