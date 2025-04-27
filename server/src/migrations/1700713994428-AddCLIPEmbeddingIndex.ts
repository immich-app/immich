import { ConfigRepository } from 'src/repositories/config.repository';
import { vectorIndexQuery } from 'src/utils/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

const vectorExtension = new ConfigRepository().getEnv().database.vectorExtension;

export class AddCLIPEmbeddingIndex1700713994428 implements MigrationInterface {
  name = 'AddCLIPEmbeddingIndex1700713994428';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET search_path TO "$user", public, vectors`);

    await queryRunner.query(vectorIndexQuery({ vectorExtension, table: 'smart_search', indexName: 'clip_index' }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS clip_index`);
  }
}
