import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetJobStatusEntity } from 'src/entities/asset-job-status.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { PersonEntity } from 'src/entities/person.entity';
import {
  AssetFaceId,
  DeleteAllFacesOptions,
  IPersonRepository,
  PeopleStatistics,
  PersonNameResponse,
  PersonNameSearchOptions,
  PersonSearchOptions,
  PersonStatistics,
  UpdateFacesData,
} from 'src/interfaces/person.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Paginated, PaginationMode, PaginationOptions, paginate, paginatedBuilder } from 'src/utils/pagination';
import { FindManyOptions, FindOptionsRelations, FindOptionsSelect, In, IsNull, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class PersonRepository implements IPersonRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
    @InjectRepository(AssetFaceEntity) private assetFaceRepository: Repository<AssetFaceEntity>,
    @InjectRepository(AssetJobStatusEntity) private jobStatusRepository: Repository<AssetJobStatusEntity>,
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

  async deleteAllFaces({ sourceType }: DeleteAllFacesOptions): Promise<void> {
    // eslint-disable-next-line unicorn/prefer-ternary
    if (sourceType === undefined) {
      await this.assetFaceRepository.query('TRUNCATE TABLE asset_faces CASCADE');
    } else if (sourceType === null) {
      await this.assetFaceRepository
        .createQueryBuilder('asset_faces')
        .delete()
        .andWhere('sourceType is null')
        .execute();
    } else {
      await this.assetFaceRepository
        .createQueryBuilder('asset_faces')
        .delete()
        .andWhere('sourceType = :sourceType', { sourceType })
        .execute();
    }
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

  @GenerateSql({ params: [{ take: 10, skip: 10 }, DummyValue.UUID] })
  getAllForUser(pagination: PaginationOptions, userId: string, options?: PersonSearchOptions): Paginated<PersonEntity> {
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
      .addOrderBy('person.createdAt')
      .andWhere("person.thumbnailPath != ''")
      .having("person.name != '' OR COUNT(face.assetId) >= :faces", { faces: options?.minimumFaceCount || 1 })
      .groupBy('person.id');
    if (!options?.withHidden) {
      queryBuilder.andWhere('person.isHidden = false');
    }

    return paginatedBuilder(queryBuilder, {
      mode: PaginationMode.LIMIT_OFFSET,
      ...pagination,
    });
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

  @GenerateSql({ params: [DummyValue.UUID, { withHidden: true }] })
  getDistinctNames(userId: string, { withHidden }: PersonNameSearchOptions): Promise<PersonNameResponse[]> {
    const queryBuilder = this.personRepository
      .createQueryBuilder('person')
      .select(['id', 'name'])
      .distinctOn(['lower(person.name)'])
      .where(`person.ownerId = :userId AND person.name != ''`, { userId });

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

  create(entities: any): any {
    return this.personRepository.save(entities);
  }

  async createFaces(entities: AssetFaceEntity[]): Promise<string[]> {
    const res = await this.assetFaceRepository.save(entities);
    return res.map((row) => row.id);
  }

  async upsertFaces(assetId: string, entities: AssetFaceEntity[], sourceType?: string): Promise<string[]> {
    return await this.assetFaceRepository.manager.transaction(async (manager) => {
      const builder = manager.createQueryBuilder(AssetFaceEntity, 'asset_faces');
      let query = builder.delete().where('assetId = :assetId', { assetId: assetId });

      if (sourceType) {
        query = query.andWhere('sourceType = :sourceType', { sourceType: sourceType });
      } else if (sourceType == null) {
        query = query.andWhere({ sourceType: IsNull() });
      }
      await query.execute();

      const res = await manager.save(AssetFaceEntity, entities);
      return res.map((row) => row.id);
    });
  }

  async update(entities: any): Promise<any> {
    return await this.personRepository.save(entities);
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

  @GenerateSql()
  async getLatestFaceDate(): Promise<string | undefined> {
    const result: { latestDate?: string } | undefined = await this.jobStatusRepository
      .createQueryBuilder('jobStatus')
      .select('MAX(jobStatus.facesRecognizedAt)::text', 'latestDate')
      .getRawOne();
    return result?.latestDate;
  }
}
