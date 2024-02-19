import { IPartnerRepository, PartnerIds } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { PartnerEntity } from '../entities';
import { Span } from 'nestjs-otel';

@Injectable()
export class PartnerRepository implements IPartnerRepository {
  constructor(@InjectRepository(PartnerEntity) private readonly repository: Repository<PartnerEntity>) {}

  @Span()
  getAll(userId: string): Promise<PartnerEntity[]> {
    return this.repository.find({ where: [{ sharedWithId: userId }, { sharedById: userId }] });
  }

  @Span()
  get({ sharedWithId, sharedById }: PartnerIds): Promise<PartnerEntity | null> {
    return this.repository.findOne({ where: { sharedById, sharedWithId } });
  }

  @Span()
  create({ sharedById, sharedWithId }: PartnerIds): Promise<PartnerEntity> {
    return this.save({ sharedBy: { id: sharedById }, sharedWith: { id: sharedWithId } });
  }

  @Span()
  async remove(entity: PartnerEntity): Promise<void> {
    await this.repository.remove(entity);
  }

  @Span()
  update(entity: Partial<PartnerEntity>): Promise<PartnerEntity> {
    return this.save(entity);
  }

  private async save(entity: DeepPartial<PartnerEntity>): Promise<PartnerEntity> {
    await this.repository.save(entity);
    return this.repository.findOneOrFail({
      where: { sharedById: entity.sharedById, sharedWithId: entity.sharedWithId },
    });
  }
}
