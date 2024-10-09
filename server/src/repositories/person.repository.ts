import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetJobStatusEntity } from 'src/entities/asset-job-status.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { FaceSearchEntity } from 'src/entities/face-search.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { PaginationMode, SourceType } from 'src/enum';
import {
  AssetFaceId,
  DeleteFacesOptions,
  IPersonRepository,
  PeopleStatistics,
  PersonNameResponse,
  PersonNameSearchOptions,
  PersonSearchOptions,
  PersonStatistics,
  UnassignFacesOptions,
  UpdateFacesData,
} from 'src/interfaces/person.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Paginated, PaginationOptions, paginate, paginatedBuilder } from 'src/utils/pagination';
import { DataSource, FindManyOptions, FindOptionsRelations, FindOptionsSelect, In, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class PersonRepository implements IPersonRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
    @InjectRepository(AssetFaceEntity) private assetFaceRepository: Repository<AssetFaceEntity>,
    @InjectRepository(FaceSearchEntity) private faceSearchRepository: Repository<FaceSearchEntity>,
    @InjectRepository(AssetJobStatusEntity) private jobStatusRepository: Repository<AssetJobStatusEntity>,
  ) {}

  @GenerateSql({ params: [{ oldPersonId: DummyValue.UUID, newPersonId: DummyValue.UUID }] })
  async reassignFaces({ oldPersonId, faceIds, newPersonId }: UpdateFacesData): Promise<number> {
    const result = await this.assetFaceRepository
      .createQueryBuilder()
      .update()
      .set({ personId: newPersonId })
      .where(_.omitBy({ personId: oldPersonId, id: faceIds ? In(faceIds) : undefined }, _.isUndefined))
      .execute();

    return result.affected ?? 0;
  }

  async unassignFaces({ sourceType }: UnassignFacesOptions): Promise<void> {
    await this.assetFaceRepository
      .createQueryBuilder()
      .update()
      .set({ personId: null })
      .where({ sourceType })
      .execute();

    await this.vacuum({ reindexVectors: false });
  }

  async delete(entities: PersonEntity[]): Promise<void> {
    await this.personRepository.remove(entities);
  }

  async deleteAll(): Promise<void> {
    await this.personRepository.clear();
  }

  async deleteFaces({ sourceType }: DeleteFacesOptions): Promise<void> {
    await this.assetFaceRepository
      .createQueryBuilder('asset_faces')
      .delete()
      .andWhere('sourceType = :sourceType', { sourceType })
      .execute();

    await this.vacuum({ reindexVectors: sourceType === SourceType.MACHINE_LEARNING });
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
      .where(
        'person.ownerId = :userId AND (LOWER(person.name) LIKE :nameStart OR LOWER(person.name) LIKE :nameAnywhere)',
        { userId, nameStart: `${personName.toLowerCase()}%`, nameAnywhere: `% ${personName.toLowerCase()}%` },
      )
      .limit(1000);

    if (!withHidden) {
      queryBuilder.andWhere('person.isHidden = false');
    }
    return queryBuilder.getMany();
  }

  @GenerateSql({ params: [DummyValue.UUID, { withHidden: true }] })
  getDistinctNames(userId: string, { withHidden }: PersonNameSearchOptions): Promise<PersonNameResponse[]> {
    const queryBuilder = this.personRepository
      .createQueryBuilder('person')
      .select(['person.id', 'person.name'])
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

  create(person: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.save(person);
  }

  async createAll(people: Partial<PersonEntity>[]): Promise<string[]> {
    const results = await this.personRepository.save(people);
    return results.map((person) => person.id);
  }

  async createFaces(entities: AssetFaceEntity[]): Promise<string[]> {
    const res = await this.assetFaceRepository.save(entities);
    return res.map((row) => row.id);
  }

  async refreshFaces(
    facesToAdd: Partial<AssetFaceEntity>[],
    faceIdsToRemove: string[],
    embeddingsToAdd?: FaceSearchEntity[],
  ): Promise<void> {
    const query = this.faceSearchRepository.createQueryBuilder().select('1').fromDummy();
    if (facesToAdd.length > 0) {
      const insertCte = this.assetFaceRepository.createQueryBuilder().insert().values(facesToAdd);
      query.addCommonTableExpression(insertCte, 'added');
    }

    if (faceIdsToRemove.length > 0) {
      const deleteCte = this.assetFaceRepository
        .createQueryBuilder()
        .delete()
        .where('id = any(:faceIdsToRemove)', { faceIdsToRemove });
      query.addCommonTableExpression(deleteCte, 'deleted');
    }

    if (embeddingsToAdd?.length) {
      const embeddingCte = this.faceSearchRepository.createQueryBuilder().insert().values(embeddingsToAdd).orIgnore();
      query.addCommonTableExpression(embeddingCte, 'embeddings');
      query.getQuery(); // typeorm mixes up parameters without this
    }

    await query.execute();
  }

  async update(person: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.save(person);
  }

  async updateAll(people: Partial<PersonEntity>[]): Promise<void> {
    await this.personRepository.save(people);
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

  private async save(person: Partial<PersonEntity>): Promise<PersonEntity> {
    const { id } = await this.personRepository.save(person);
    return this.personRepository.findOneByOrFail({ id });
  }

  private async vacuum({ reindexVectors }: { reindexVectors: boolean }): Promise<void> {
    await this.assetFaceRepository.query('VACUUM ANALYZE asset_faces, face_search, person');
    await this.assetFaceRepository.query('REINDEX TABLE asset_faces');
    await this.assetFaceRepository.query('REINDEX TABLE person');
    if (reindexVectors) {
      await this.assetFaceRepository.query('REINDEX TABLE face_search');
    }
  }
}
