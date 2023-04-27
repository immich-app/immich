import { IFacialRecognitionRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetFaceEntity } from '../entities';

@Injectable()
export class FacialRecognitionRepository implements IFacialRecognitionRepository {
  constructor(@InjectRepository(AssetFaceEntity) private assetFacesRepository: Repository<AssetFaceEntity>) {}

  createAssetFace(entity: Partial<AssetFaceEntity>): Promise<AssetFaceEntity> {
    return this.assetFacesRepository.save(entity);
  }
}
