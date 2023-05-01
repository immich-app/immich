import { IPersonRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity, AssetFaceEntity, PersonEntity } from '../entities';

export class PersonRepository implements IPersonRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(AssetFaceEntity) private faceRepository: Repository<AssetFaceEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
  ) {}
  getAll(userId: string): Promise<PersonEntity[]> {
    return this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .where('person.ownerId = :userId', { userId })
      .orderBy('COUNT(face.assetId)', 'DESC')
      .groupBy('person.id')
      .getMany();
  }

  getById(ownerId: string, personId: string): Promise<PersonEntity | null> {
    return this.personRepository.findOne({ where: { id: personId, ownerId } });
  }

  getAssets(ownerId: string, personId: string): Promise<AssetEntity[]> {
    return this.assetRepository.find({
      where: {
        ownerId,
        faces: {
          personId,
        },
      },
      relations: {
        faces: {
          person: true,
        },
        exifInfo: true,
      },
    });
  }

  create(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.personRepository.save(entity);
  }

  update(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.personRepository.save(entity);
  }
}
