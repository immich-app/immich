import { MigrationInterface, QueryRunner } from 'typeorm';
import { vectorExt } from '../database.config';
import { DatabaseExtension } from '@app/domain/repositories/database.repository';

export class AddCLIPEmbeddingIndex1700713994428 implements MigrationInterface {
  name = 'AddCLIPEmbeddingIndex1700713994428';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (vectorExt === DatabaseExtension.VECTORS) {
      await queryRunner.query(`SET vectors.pgvector_compatibility=on`);
    }
    await queryRunner.query(`SET search_path TO "$user", public, vectors`);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS clip_index ON smart_search
      USING hnsw (embedding vector_cosine_ops)
      WITH (ef_construction = 300, m = 16)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS clip_index`);
  }
}
