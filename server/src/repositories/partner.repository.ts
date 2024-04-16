import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PartnerEntity } from 'src/entities/partner.entity';
import { IPartnerRepository, PartnerIds } from 'src/interfaces/partner.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { DeepPartial, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class PartnerRepository implements IPartnerRepository {
  constructor(@InjectRepository(PartnerEntity) private repository: Repository<PartnerEntity>) {}

  getAll(userId: string): Promise<PartnerEntity[]> {
    return this.repository.find({ where: [{ sharedWithId: userId }, { sharedById: userId }] });
  }

  get({ sharedWithId, sharedById }: PartnerIds): Promise<PartnerEntity | null> {
    return this.repository.findOne({ where: { sharedById, sharedWithId } });
  }

  create({ sharedById, sharedWithId }: PartnerIds): Promise<PartnerEntity> {
    return this.save({ sharedBy: { id: sharedById }, sharedWith: { id: sharedWithId } });
  }

  async remove(entity: PartnerEntity): Promise<void> {
    await this.repository.remove(entity);
  }

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
