import { DatabaseExtension } from 'src/interfaces/database.interface';
import { ConfigRepository } from 'src/repositories/config.repository';
import { MigrationInterface, QueryRunner } from 'typeorm';

const vectorExtension = new ConfigRepository().getEnv().database.vectorExtension;

export class AddFaceEmbeddingIndex1700714033632 implements MigrationInterface {
  name = 'AddFaceEmbeddingIndex1700714033632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (vectorExtension === DatabaseExtension.VECTORS) {
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
