import { IPartnerRepository, PartnerIds } from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerEntity } from '../entities';

@Injectable()
export class PartnerRepository implements IPartnerRepository {
  readonly logger = new Logger(PartnerRepository.name);

  constructor(
    @InjectRepository(PartnerEntity)
    private readonly repository: Repository<PartnerEntity>,
  ) {}

  getAll(userId: string): Promise<PartnerEntity[]> {
    return this.repository.find({
      where: [{ sharedWithId: userId }, { sharedById: userId }],
      relations: {
        sharedBy: true,
        sharedWith: true,
      },
    });
  }

  get({ sharedWithId, sharedById }: PartnerIds): Promise<PartnerEntity | null> {
    return this.repository.findOne({
      where: {
        sharedById,
        sharedWithId,
      },
      relations: {
        sharedBy: true,
        sharedWith: true,
      },
    });
  }

  create({ sharedById, sharedWithId }: PartnerIds): Promise<PartnerEntity> {
    return this.repository.save({ sharedWithId, sharedById });
  }

  async remove(entity: PartnerEntity): Promise<void> {
    await this.repository.remove(entity);
  }

  async hasAssetAccess(assetId: string, userId: string): Promise<boolean> {
    const count = await this.repository.count({
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

    return count == 1;
  }
}
