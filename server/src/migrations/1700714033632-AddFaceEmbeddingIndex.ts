import { ConfigRepository } from 'src/repositories/config.repository';
import { vectorIndexQuery } from 'src/utils/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

const vectorExtension = new ConfigRepository().getEnv().database.vectorExtension;

export class AddFaceEmbeddingIndex1700714033632 implements MigrationInterface {
  name = 'AddFaceEmbeddingIndex1700714033632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET search_path TO "$user", public, vectors`);

    await queryRunner.query(vectorIndexQuery({ vectorExtension, table: 'asset_faces', indexName: 'face_index' }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS face_index`);
  }
}
