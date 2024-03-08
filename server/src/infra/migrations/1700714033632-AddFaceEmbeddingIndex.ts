import { MigrationInterface, QueryRunner } from 'typeorm';
import { vectorExt } from '../database.config';
import { DatabaseExtension } from '@app/domain/repositories/database.repository';

export class AddFaceEmbeddingIndex1700714033632 implements MigrationInterface {
  name = 'AddFaceEmbeddingIndex1700714033632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (vectorExt === DatabaseExtension.VECTORS) {
      await queryRunner.query(`SET vectors.pgvector_compatibility=on`);
    }
    await queryRunner.query(`SET search_path TO "$user", public, vectors`);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS face_index ON asset_faces
      USING hnsw (embedding vector_cosine_ops)
      WITH (ef_construction = 300, m = 16)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS face_index`);
  }
}
