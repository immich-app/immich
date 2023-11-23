import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCLIPEmbeddingIndex1699746301742 implements MigrationInterface {
  name = 'AddCLIPEmbeddingIndex1699746301742';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS clip_index ON smart_search
        USING vectors (embedding cosine_ops) WITH (options = $$
        [indexing.hnsw]
        m = 16
        ef_construction = 300
        $$);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS clip_index`);
  }
}
