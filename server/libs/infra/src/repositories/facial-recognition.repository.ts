import { IFacialRecognitionRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetFaceEntity, PersonEntity } from '../entities';

@Injectable()
export class FacialRecognitionRepository implements IFacialRecognitionRepository {
  constructor(
    // @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
    @InjectRepository(AssetFaceEntity) private assetFacesRepository: Repository<AssetFaceEntity>,
  ) {}

  createAssetFace(entity: Partial<AssetFaceEntity>): Promise<AssetFaceEntity> {
    return this.assetFacesRepository.save(entity);
  }

  createPerson(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.personRepository.save(entity);
  }

  savePerson(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.personRepository.save(entity);
  }
}
