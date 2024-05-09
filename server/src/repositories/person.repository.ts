import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { PersonEntity } from 'src/entities/person.entity';
import {
  AssetFaceId,
  IPersonRepository,
  PeopleStatistics,
  PersonNameSearchOptions,
  PersonSearchOptions,
  PersonStatistics,
  UpdateFacesData,
} from 'src/interfaces/person.interface';
import { asVector } from 'src/utils/database';
import { Instrumentation } from 'src/utils/instrumentation';
import { Paginated, PaginationOptions, paginate } from 'src/utils/pagination';
import { FindManyOptions, FindOptionsRelations, FindOptionsSelect, In, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class PersonRepository implements IPersonRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
    @InjectRepository(AssetFaceEntity) private assetFaceRepository: Repository<AssetFaceEntity>,
  ) {}

  @GenerateSql({ params: [{ oldPersonId: DummyValue.UUID, newPersonId: DummyValue.UUID }] })
  async reassignFaces({ oldPersonId, faceIds, newPersonId }: UpdateFacesData): Promise<number> {
    const result = await this.assetFaceRepository
      .createQueryBuilder()
      .update()
      .set({ personId: newPersonId })
      .where(_.omitBy({ personId: oldPersonId ?? undefined, id: faceIds ? In(faceIds) : undefined }, _.isUndefined))
      .execute();

    return result.affected ?? 0;
  }

  async delete(entities: PersonEntity[]): Promise<void> {
    await this.personRepository.remove(entities);
  }

  async deleteAll(): Promise<void> {
    await this.personRepository.clear();
  }

  async deleteAllFaces(): Promise<void> {
    await this.assetFaceRepository.query('TRUNCATE TABLE asset_faces CASCADE');
  }

  getAllFaces(
    pagination: PaginationOptions,
    options: FindManyOptions<AssetFaceEntity> = {},
  ): Paginated<AssetFaceEntity> {
    return paginate(this.assetFaceRepository, pagination, options);
  }

  getAll(pagination: PaginationOptions, options: FindManyOptions<PersonEntity> = {}): Paginated<PersonEntity> {
    return paginate(this.personRepository, pagination, options);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAllForUser(userId: string, options?: PersonSearchOptions): Promise<PersonEntity[]> {
    const queryBuilder = this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .where('person.ownerId = :userId', { userId })
      .innerJoin('face.asset', 'asset')
      .andWhere('asset.isArchived = false')
      .orderBy('person.isHidden', 'ASC')
      .addOrderBy("NULLIF(person.name, '') IS NULL", 'ASC')
      .addOrderBy('COUNT(face.assetId)', 'DESC')
      .addOrderBy("NULLIF(person.name, '')", 'ASC', 'NULLS LAST')
      .andWhere("person.thumbnailPath != ''")
      .having("person.name != '' OR COUNT(face.assetId) >= :faces", { faces: options?.minimumFaceCount || 1 })
      .groupBy('person.id')
      .limit(500);
    if (!options?.withHidden) {
      queryBuilder.andWhere('person.isHidden = false');
    }

    return queryBuilder.getMany();
  }

  @GenerateSql()
  getAllWithoutFaces(): Promise<PersonEntity[]> {
    return this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .having('COUNT(face.assetId) = 0')
      .groupBy('person.id')
      .withDeleted()
      .getMany();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaces(assetId: string): Promise<AssetFaceEntity[]> {
    return this.assetFaceRepository.find({
      where: { assetId },
      relations: {
        person: true,
      },
      order: {
        boundingBoxX1: 'ASC',
      },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaceById(id: string): Promise<AssetFaceEntity> {
    // TODO return null instead of find or fail
    return this.assetFaceRepository.findOneOrFail({
      where: { id },
      relations: {
        person: true,
      },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaceByIdWithAssets(
    id: string,
    relations: FindOptionsRelations<AssetFaceEntity>,
    select: FindOptionsSelect<AssetFaceEntity>,
  ): Promise<AssetFaceEntity | null> {
    return this.assetFaceRepository.findOne(
      _.omitBy(
        {
          where: { id },
          relations: {
            ...relations,
            person: true,
            asset: true,
          },
          select,
        },
        _.isUndefined,
      ),
    );
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async reassignFace(assetFaceId: string, newPersonId: string): Promise<number> {
    const result = await this.assetFaceRepository
      .createQueryBuilder()
      .update()
      .set({ personId: newPersonId })
      .where({ id: assetFaceId })
      .execute();

    return result.affected ?? 0;
  }

  getById(personId: string): Promise<PersonEntity | null> {
    return this.personRepository.findOne({ where: { id: personId } });
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING, { withHidden: true }] })
  getByName(userId: string, personName: string, { withHidden }: PersonNameSearchOptions): Promise<PersonEntity[]> {
    const queryBuilder = this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .where(
        'person.ownerId = :userId AND (LOWER(person.name) LIKE :nameStart OR LOWER(person.name) LIKE :nameAnywhere)',
        { userId, nameStart: `${personName.toLowerCase()}%`, nameAnywhere: `% ${personName.toLowerCase()}%` },
      )
      .groupBy('person.id')
      .orderBy('COUNT(face.assetId)', 'DESC')
      .limit(20);

    if (!withHidden) {
      queryBuilder.andWhere('person.isHidden = false');
    }
    return queryBuilder.getMany();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getStatistics(personId: string): Promise<PersonStatistics> {
    const items = await this.assetFaceRepository
      .createQueryBuilder('face')
      .leftJoin('face.asset', 'asset')
      .where('face.personId = :personId', { personId })
      .andWhere('asset.isArchived = false')
      .andWhere('asset.deletedAt IS NULL')
      .andWhere('asset.livePhotoVideoId IS NULL')
      .select('COUNT(DISTINCT(asset.id))', 'count')
      .getRawOne();
    return {
      assets: items.count ?? 0,
    };
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAssets(personId: string): Promise<AssetEntity[]> {
    return this.assetRepository.find({
      where: {
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

  @GenerateSql({ params: [DummyValue.UUID] })
  async getNumberOfPeople(userId: string): Promise<PeopleStatistics> {
    const items = await this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .where('person.ownerId = :userId', { userId })
      .innerJoin('face.asset', 'asset')
      .andWhere('asset.isArchived = false')
      .andWhere("person.thumbnailPath != ''")
      .select('COUNT(DISTINCT(person.id))', 'total')
      .addSelect('COUNT(DISTINCT(person.id)) FILTER (WHERE person.isHidden = true)', 'hidden')
      .having('COUNT(face.assetId) != 0')
      .getRawOne();

    if (items == undefined) {
      return { total: 0, hidden: 0 };
    }

    const result: PeopleStatistics = {
      total: items.total ?? 0,
      hidden: items.hidden ?? 0,
    };

    return result;
  }

  create(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.personRepository.save(entity);
  }

  async createFaces(entities: AssetFaceEntity[]): Promise<string[]> {
    const res = await this.assetFaceRepository.insert(
      entities.map((entity) => ({ ...entity, embedding: () => asVector(entity.embedding, true) })),
    );
    return res.identifiers.map((row) => row.id);
  }

  async update(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    const { id } = await this.personRepository.save(entity);
    return this.personRepository.findOneByOrFail({ id });
  }

  @GenerateSql({ params: [[{ assetId: DummyValue.UUID, personId: DummyValue.UUID }]] })
  @ChunkedArray()
  async getFacesByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]> {
    return this.assetFaceRepository.find({ where: ids, relations: { asset: true }, withDeleted: true });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getRandomFace(personId: string): Promise<AssetFaceEntity | null> {
    return this.assetFaceRepository.findOneBy({ personId });
  }
}
