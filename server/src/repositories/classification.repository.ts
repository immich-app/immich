import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { ClassificationCategoryTable } from 'src/schema/tables/classification-category.table';
import { ClassificationPromptEmbeddingTable } from 'src/schema/tables/classification-prompt-embedding.table';

@Injectable()
export class ClassificationRepository {
  constructor(
    @InjectKysely() private db: Kysely<DB>,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(ClassificationRepository.name);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getCategories(userId: string) {
    return this.db
      .selectFrom('classification_category')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('name', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getCategoriesWithPrompts(userId: string) {
    return this.db
      .selectFrom('classification_category as c')
      .leftJoin('classification_prompt_embedding as p', 'p.categoryId', 'c.id')
      .select([
        'c.id',
        'c.name',
        'c.similarity',
        'c.action',
        'c.enabled',
        'c.tagId',
        'c.createdAt',
        'c.updatedAt',
        'p.prompt',
      ])
      .where('c.userId', '=', userId)
      .orderBy('c.name', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getCategory(id: string) {
    return this.db.selectFrom('classification_category').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async createCategory(values: Insertable<ClassificationCategoryTable>) {
    return this.db.insertInto('classification_category').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async updateCategory(id: string, values: Updateable<ClassificationCategoryTable>) {
    return this.db
      .updateTable('classification_category')
      .set(values)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteCategory(id: string) {
    await this.db.deleteFrom('classification_category').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getPromptEmbeddings(categoryId: string) {
    return this.db
      .selectFrom('classification_prompt_embedding')
      .selectAll()
      .where('categoryId', '=', categoryId)
      .execute();
  }

  getAllCategories() {
    return this.db.selectFrom('classification_category').selectAll().execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getEnabledCategoriesWithEmbeddings(userId: string) {
    return this.db
      .selectFrom('classification_category as c')
      .innerJoin('classification_prompt_embedding as p', 'p.categoryId', 'c.id')
      .select([
        'c.id as categoryId',
        'c.name',
        'c.similarity',
        'c.action',
        'c.tagId',
        'p.id as promptId',
        'p.prompt',
        'p.embedding',
      ])
      .where('c.userId', '=', userId)
      .where('c.enabled', '=', true)
      .execute();
  }

  async upsertPromptEmbedding(values: Insertable<ClassificationPromptEmbeddingTable>) {
    return this.db
      .insertInto('classification_prompt_embedding')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deletePromptEmbeddingsByCategory(categoryId: string) {
    await this.db.deleteFrom('classification_prompt_embedding').where('categoryId', '=', categoryId).execute();
  }

  async resetClassifiedAt(userId: string) {
    await this.db
      .updateTable('asset_job_status')
      .set({ classifiedAt: null })
      .where('assetId', 'in', this.db.selectFrom('asset').select('id').where('ownerId', '=', userId))
      .execute();
  }

  async setClassifiedAt(assetId: string) {
    await this.db
      .updateTable('asset_job_status')
      .set({ classifiedAt: new Date().toISOString() })
      .where('assetId', '=', assetId)
      .execute();
  }

  streamUnclassifiedAssets(userId?: string) {
    let query = this.db
      .selectFrom('asset_job_status as ajs')
      .innerJoin('asset as a', 'a.id', 'ajs.assetId')
      .innerJoin('smart_search as ss', 'ss.assetId', 'a.id')
      .select(['a.id', 'a.ownerId'])
      .where('ajs.classifiedAt', 'is', null);

    if (userId) {
      query = query.where('a.ownerId', '=', userId);
    }

    return query.stream();
  }
}
