import { AssetFaceId, IFaceRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetFaceEntity } from '../entities/asset-face.entity';

@Injectable()
export class FaceRepository implements IFaceRepository {
  constructor(@InjectRepository(AssetFaceEntity) private repository: Repository<AssetFaceEntity>) {}

  getAll(): Promise<AssetFaceEntity[]> {
    return this.repository.find({ relations: { asset: true } });
  }

  getByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]> {
    return this.repository.find({ where: ids, relations: { asset: true } });
  }

  create(entity: Partial<AssetFaceEntity>): Promise<AssetFaceEntity> {
    return this.repository.save(entity);
  }
}
