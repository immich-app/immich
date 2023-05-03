import { IPartnerRepository, PartnerDirection } from '@app/domain';
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

  getAll(userId: string, direction: PartnerDirection): Promise<PartnerEntity[]> {
    if (direction === 'shared-by') {
      return this.repository
        .createQueryBuilder('partners')
        .select('partners.sharedBy', 'sharedBy')
        .addSelect('partners.sharedWith', 'sharedWith')
        .addSelect('partners.createdAt', 'createdAt')
        .addSelect('partners.updatedAt', 'updatedAt')
        .addSelect('partners.id', 'id')
        .where('"sharedById" = :sharedBy', { sharedBy: userId })
        .getRawMany();
    } else {
      return this.repository
        .createQueryBuilder('partners')
        .select('partners.sharedBy', 'sharedBy')
        .addSelect('partners.sharedWith', 'sharedWith')
        .addSelect('partners.createdAt', 'createdAt')
        .addSelect('partners.updatedAt', 'updatedAt')
        .addSelect('partners.id', 'id')
        .where('"sharedWithId" = :sharedWith', { sharedWith: userId })
        .getRawMany();
    }
  }

  async get(sharedBy: string, sharedWith: string): Promise<PartnerEntity | null> {
    const entity =
      (await this.repository
        .createQueryBuilder('partners')
        .select('partners.sharedBy', 'sharedBy')
        .addSelect('partners.sharedWith', 'sharedWith')
        .addSelect('partners.createdAt', 'createdAt')
        .addSelect('partners.updatedAt', 'updatedAt')
        .addSelect('partners.id', 'id')
        .where('"sharedById" = :sharedBy', { sharedBy: sharedBy })
        .andWhere('"sharedWithId" = :sharedWith', { sharedWith: sharedWith })
        .getRawOne<PartnerEntity>()) ?? null;

    return entity;
  }

  create(entity: Omit<PartnerEntity, 'id'>): Promise<PartnerEntity> {
    return this.repository.save(entity);
  }

  remove(entity: PartnerEntity): Promise<PartnerEntity> {
    return this.repository.remove(entity);
  }
}
