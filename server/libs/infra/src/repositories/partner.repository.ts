import { IPartnerRepository, PartnerDirection } from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerEntity, UserEntity } from '../entities';
import { CreatePartnerDto } from '@app/domain/partner/dto';

@Injectable()
export class PartnerRepository implements IPartnerRepository {
  readonly logger = new Logger(PartnerRepository.name);

  constructor(
    @InjectRepository(PartnerEntity)
    private readonly repository: Repository<PartnerEntity>,
  ) {}

  getAll(userId: string, direction: PartnerDirection): Promise<PartnerEntity[]> {
    const key = direction === 'shared-with' ? 'sharedWith' : 'sharedBy';
    return this.repository.find({
      where: {
        [key]: { id: userId },
      },
      relations: {
        sharedBy: true,
        sharedWith: true,
      },
    });
  }

  async get(sharedBy: string, sharedWith: string): Promise<PartnerEntity | null> {
    return this.repository.findOne({
      where: {
        sharedWith: {
          id: sharedWith,
        },
        sharedBy: {
          id: sharedBy,
        },
      },
      relations: {
        sharedBy: true,
        sharedWith: true,
      },
    });
  }

  create(createPartnerDto: CreatePartnerDto): Promise<PartnerEntity> {
    const partner = new PartnerEntity();

    partner.sharedWith = new UserEntity();
    partner.sharedWith.id = createPartnerDto.sharedWith;

    partner.sharedBy = new UserEntity();
    partner.sharedBy.id = createPartnerDto.sharedBy;

    return this.repository.save(partner);
  }

  remove(entity: PartnerEntity): Promise<PartnerEntity> {
    return this.repository.remove(entity);
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
