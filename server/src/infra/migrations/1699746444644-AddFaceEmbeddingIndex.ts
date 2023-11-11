import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFaceEmbeddingIndex1699746444644 implements MigrationInterface {
  name = 'AddFaceEmbeddingIndex1699746444644';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS face_index ON asset_faces
        USING vectors (embedding cosine_ops) WITH (options = $$
        capacity = 2097152
        [indexing.hnsw]
        m = 16
        ef_construction = 300
        $$);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS face_index`);
  }
}
