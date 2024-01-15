import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFaceEmbeddingIndex1700714033632 implements MigrationInterface {
  name = 'AddFaceEmbeddingIndex1700714033632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS face_index ON asset_faces
      USING vectors (embedding vector_cos_ops) WITH (options = $$
      [indexing.hnsw]
      m = 16
      ef_construction = 300
      $$);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS face_index`);
  }
}
