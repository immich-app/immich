import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCLIPEmbeddingIndex1700713994428 implements MigrationInterface {
  name = 'AddCLIPEmbeddingIndex1700713994428';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS clip_index ON smart_search
      USING vectors (embedding vector_cos_ops) WITH (options = $$
      [indexing.hnsw]
      m = 16
      ef_construction = 300
      $$);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS clip_index`);
  }
}
