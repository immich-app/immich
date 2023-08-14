import { AssetFaceId, IPersonRepository, PersonSearchOptions, UpdateFacesData } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AssetEntity, AssetFaceEntity, PersonEntity } from '../entities';

export class PersonRepository implements IPersonRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
    @InjectRepository(AssetFaceEntity) private assetFaceRepository: Repository<AssetFaceEntity>,
  ) {}

  /**
   * Before reassigning faces, delete potential key violations
   */
  async prepareReassignFaces({ oldPersonId, newPersonId }: UpdateFacesData): Promise<string[]> {
    const results = await this.assetFaceRepository
      .createQueryBuilder('face')
      .select('face."assetId"')
      .where(`face."personId" IN (:...ids)`, { ids: [oldPersonId, newPersonId] })
      .groupBy('face."assetId"')
      .having('COUNT(face."personId") > 1')
      .getRawMany();

    const assetIds = results.map(({ assetId }) => assetId);

    await this.assetFaceRepository.delete({ personId: oldPersonId, assetId: In(assetIds) });

    return assetIds;
  }

  async reassignFaces({ oldPersonId, newPersonId }: UpdateFacesData): Promise<number> {
    const result = await this.assetFaceRepository
      .createQueryBuilder()
      .update()
      .set({ personId: newPersonId })
      .where({ personId: oldPersonId })
      .execute();

    return result.affected ?? 0;
  }

  delete(entity: PersonEntity): Promise<PersonEntity | null> {
    return this.personRepository.remove(entity);
  }

  async deleteAll(): Promise<number> {
    const people = await this.personRepository.find();
    await this.personRepository.remove(people);
    return people.length;
  }

  getAll(userId: string, options?: PersonSearchOptions): Promise<PersonEntity[]> {
    return this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .where('person.ownerId = :userId', { userId })
      .orderBy('COUNT(face.assetId)', 'DESC')
      .addOrderBy("NULLIF(person.name, '')", 'ASC', 'NULLS LAST')
      .having('COUNT(face.assetId) >= :faces', { faces: options?.minimumFaceCount || 1 })
      .groupBy('person.id')
      .limit(500)
      .getMany();
  }

  getAllWithoutFaces(): Promise<PersonEntity[]> {
    return this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .having('COUNT(face.assetId) = 0')
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
        isVisible: true,
        isArchived: false,
      },
      relations: {
        faces: {
          person: true,
        },
        exifInfo: true,
      },
      order: {
        fileCreatedAt: 'desc',
      },
      // TODO: remove after either (1) pagination or (2) time bucket is implemented for this query
      take: 1000,
    });
  }

  create(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.personRepository.save(entity);
  }

  async update(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    const { id } = await this.personRepository.save(entity);
    return this.personRepository.findOneByOrFail({ id });
  }

  async getFaceById({ personId, assetId }: AssetFaceId): Promise<AssetFaceEntity | null> {
    return this.assetFaceRepository.findOneBy({ assetId, personId });
  }
}
