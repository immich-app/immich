import { CropFaceResult, IFacialRecognitionRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AssetEntity, AssetFaceEntity, PersonEntity } from '../entities';

@Injectable()
export class FacialRecognitionRepository implements IFacialRecognitionRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
    @InjectRepository(AssetFaceEntity) private assetFacesRepository: Repository<AssetFaceEntity>,
    private entityManager: EntityManager,
  ) {}

  async save(personEntity: Partial<PersonEntity>, assetFaceEntity: Partial<AssetFaceEntity>): Promise<void> {
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(personEntity);
      await transactionalEntityManager.save(assetFaceEntity);
    });
  }
}
