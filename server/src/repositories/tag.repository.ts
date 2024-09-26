import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Chunked, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { TagEntity } from 'src/entities/tag.entity';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AssetTagItem, ITagRepository } from 'src/interfaces/tag.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { DataSource, In, Repository, TreeRepository } from 'typeorm';

@Instrumentation()
@Injectable()
export class TagRepository implements ITagRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(TagEntity) private repository: Repository<TagEntity>,
    @InjectRepository(TagEntity) private tree: TreeRepository<TagEntity>,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(TagRepository.name);
  }

  get(id: string): Promise<TagEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  getByValue(userId: string, value: string): Promise<TagEntity | null> {
    return this.repository.findOne({ where: { userId, value } });
  }

  async upsertValue({
    userId,
    value,
    parent,
  }: {
    userId: string;
    value: string;
    parent?: TagEntity;
  }): Promise<TagEntity> {
    return this.dataSource.transaction(async (manager) => {
      // upsert tag
      const { identifiers } = await manager.upsert(
        TagEntity,
        { userId, value, parentId: parent?.id },
        { conflictPaths: { userId: true, value: true } },
      );
      const id = identifiers[0]?.id;
      if (!id) {
        throw new Error('Failed to upsert tag');
      }

      // update closure table
      await manager.query(
        `INSERT INTO tags_closure (id_ancestor, id_descendant)
         VALUES ($1, $1)
         ON CONFLICT DO NOTHING;`,
        [id],
      );

      if (parent) {
        await manager.query(
          `INSERT INTO tags_closure (id_ancestor, id_descendant)
          SELECT id_ancestor, '${id}' as id_descendant FROM tags_closure WHERE id_descendant = $1
          ON CONFLICT DO NOTHING`,
          [parent.id],
        );
      }

      return manager.findOneOrFail(TagEntity, { where: { id } });
    });
  }

  async getAll(userId: string): Promise<TagEntity[]> {
    const tags = await this.repository.find({
      where: { userId },
      order: {
        value: 'ASC',
      },
    });

    return tags;
  }

  create(tag: Partial<TagEntity>): Promise<TagEntity> {
    return this.save(tag);
  }

  update(tag: Partial<TagEntity>): Promise<TagEntity> {
    return this.save(tag);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @ChunkedSet({ paramIndex: 1 })
  async getAssetIds(tagId: string, assetIds: string[]): Promise<Set<string>> {
    if (assetIds.length === 0) {
      return new Set();
    }

    const results = await this.dataSource
      .createQueryBuilder()
      .select('tag_asset.assetsId', 'assetId')
      .from('tag_asset', 'tag_asset')
      .where('"tag_asset"."tagsId" = :tagId', { tagId })
      .andWhere('"tag_asset"."assetsId" IN (:...assetIds)', { assetIds })
      .getRawMany<{ assetId: string }>();

    return new Set(results.map(({ assetId }) => assetId));
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async addAssetIds(tagId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await this.dataSource.manager
      .createQueryBuilder()
      .insert()
      .into('tag_asset', ['tagsId', 'assetsId'])
      .values(assetIds.map((assetId) => ({ tagsId: tagId, assetsId: assetId })))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  async removeAssetIds(tagId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('tag_asset')
      .where({
        tagsId: tagId,
        assetsId: In(assetIds),
      })
      .execute();
  }

  @GenerateSql({ params: [[{ assetId: DummyValue.UUID, tagId: DummyValue.UUID }]] })
  @Chunked()
  async upsertAssetIds(items: AssetTagItem[]): Promise<AssetTagItem[]> {
    if (items.length === 0) {
      return [];
    }

    const { identifiers } = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('tag_asset', ['assetsId', 'tagsId'])
      .values(items.map(({ assetId, tagId }) => ({ assetsId: assetId, tagsId: tagId })))
      .execute();

    return (identifiers as Array<{ assetsId: string; tagsId: string }>).map(({ assetsId, tagsId }) => ({
      assetId: assetsId,
      tagId: tagsId,
    }));
  }

  async upsertAssetTags({ assetId, tagIds }: { assetId: string; tagIds: string[] }) {
    await this.dataSource.transaction(async (manager) => {
      await manager.createQueryBuilder().delete().from('tag_asset').where({ assetsId: assetId }).execute();

      if (tagIds.length === 0) {
        return;
      }

      await manager
        .createQueryBuilder()
        .insert()
        .into('tag_asset', ['tagsId', 'assetsId'])
        .values(tagIds.map((tagId) => ({ tagsId: tagId, assetsId: assetId })))
        .execute();
    });
  }

  async deleteEmptyTags() {
    await this.dataSource.transaction(async (manager) => {
      const ids = new Set<string>();
      const tags = await manager.find(TagEntity);
      for (const tag of tags) {
        const count = await manager
          .createQueryBuilder('assets', 'asset')
          .innerJoin(
            'asset.tags',
            'asset_tags',
            'asset_tags.id IN (SELECT id_descendant FROM tags_closure WHERE id_ancestor = :tagId)',
            { tagId: tag.id },
          )
          .getCount();

        if (count === 0) {
          this.logger.debug(`Found empty tag: ${tag.id} - ${tag.value}`);
          ids.add(tag.id);
        }
      }

      if (ids.size > 0) {
        await manager.delete(TagEntity, { id: In([...ids]) });
        this.logger.log(`Deleted ${ids.size} empty tags`);
      }
    });
  }

  private async save(partial: Partial<TagEntity>): Promise<TagEntity> {
    const { id } = await this.repository.save(partial);
    return this.repository.findOneOrFail({ where: { id } });
  }
}
