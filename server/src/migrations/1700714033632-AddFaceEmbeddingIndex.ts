import { getVectorExtension } from 'src/repositories/database.repository';
import { vectorIndexQuery } from 'src/utils/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFaceEmbeddingIndex1700714033632 implements MigrationInterface {
  name = 'AddFaceEmbeddingIndex1700714033632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const vectorExtension = await getVectorExtension(queryRunner);
    await queryRunner.query(`SET search_path TO "$user", public, vectors`);

    await queryRunner.query(vectorIndexQuery({ vectorExtension, table: 'asset_faces', indexName: 'face_index' }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS face_index`);
  }
}
