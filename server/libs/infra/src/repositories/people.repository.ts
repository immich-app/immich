import { AssetFaceId, IPeopleRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity, AssetFaceEntity, PersonEntity } from '../entities';

export class PeopleRepository implements IPeopleRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(AssetFaceEntity) private faceRepository: Repository<AssetFaceEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
  ) {}
  getPersonAssets(id: string): Promise<AssetEntity[]> {
    return this.assetRepository.find({
      where: { faces: { personId: id } },
      relations: {
        faces: {
          person: true,
        },
        exifInfo: true,
      },
    });
  }

  getAll(userId: string): Promise<PersonEntity[]> {
    return this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .where('person.ownerId = :userId', { userId })
      .orderBy('COUNT(face.assetId)', 'DESC')
      .groupBy('person.id')
      .getMany();
  }

  getById(userId: string, personId: string): Promise<PersonEntity | null> {
    return this.personRepository.findOne({ where: { id: personId, ownerId: userId } });
  }

  create(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.personRepository.save(entity);
  }

  save(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.personRepository.save(entity);
  }

  getAllFaces(): Promise<AssetFaceEntity[]> {
    return this.faceRepository.find({ relations: { asset: true } });
  }

  getFaceByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]> {
    return this.faceRepository.find({ where: ids, relations: { asset: true } });
  }
}
