import { IPeopleRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonEntity, AssetEntity, AssetFaceEntity } from '../entities';

export class PeopleRepository implements IPeopleRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
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
}
