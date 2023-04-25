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

  async createPerson(
    embedding: number[],
    asset: AssetEntity,
    cropFaceResult: CropFaceResult,
  ): Promise<AssetEntity | null> {
    return await this.entityManager.transaction(async (transactionalEntityManager) => {
      const person = new PersonEntity();
      person.id = cropFaceResult.faceId;
      person.owner = asset.owner;
      person.ownerId = asset.ownerId;
      person.thumbnailPath = cropFaceResult.filePath;
      person.name = 'Unknown';
      await transactionalEntityManager.save(person);

      const assetFace = new AssetFaceEntity();
      assetFace.embedding = embedding;
      assetFace.asset = asset;
      assetFace.assetId = asset.id;
      assetFace.personId = cropFaceResult.faceId;
      await transactionalEntityManager.save(assetFace);

      return await this.assetRepository.findOne({
        where: { id: asset.id },
        relations: {
          exifInfo: true,
          faces: true,
        },
      });
    });
  }
}
