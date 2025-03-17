import { DatabaseExtension } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { createVectorIndex } from 'src/repositories/database.repository';
import { MigrationInterface, QueryRunner } from 'typeorm';

const vectorExtension = new ConfigRepository().getEnv().database.vectorExtension;

export class AddFaceEmbeddingIndex1700714033632 implements MigrationInterface {
  name = 'AddFaceEmbeddingIndex1700714033632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (vectorExtension === DatabaseExtension.VECTORS) {
      await queryRunner.query(`SET vectors.pgvector_compatibility=on`);
    }
    await queryRunner.query(`SET search_path TO "$user", public, vectors`);

    await queryRunner.query(createVectorIndex(vectorExtension, 'asset_faces', 'face_index'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS face_index`);
  }
}
