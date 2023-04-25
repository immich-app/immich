import { IFacialRecognitionRepository } from '@app/domain';
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

  async createPerson(embedding: number[], asset: AssetEntity): Promise<void> {
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      const person = new PersonEntity();
      person.owner = asset.owner;
      person.ownerId = asset.ownerId;
    });
  }
}
