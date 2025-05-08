import { DatabaseExtension } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { vectorIndexQuery } from 'src/utils/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

const vectorExtension = new ConfigRepository().getEnv().database.vectorExtension;

export class AddFaceSearchRelation1718486162779 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (vectorExtension === DatabaseExtension.VECTORS) {
      await queryRunner.query(`SET search_path TO "$user", public, vectors`);
    }

    const hasEmbeddings = async (tableName: string): Promise<boolean> => {
      const columns = await queryRunner.query(
        `SELECT column_name as name
        FROM information_schema.columns
        WHERE table_name = '${tableName}'`,
      );
      return columns.some((column: { name: string }) => column.name === 'embedding');
    };

    const hasAssetEmbeddings = await hasEmbeddings('smart_search');
    if (!hasAssetEmbeddings) {
      await queryRunner.query(`TRUNCATE smart_search`);
      await queryRunner.query(`ALTER TABLE smart_search ADD COLUMN IF NOT EXISTS embedding vector(512) NOT NULL`);
    }

    await queryRunner.query(`
      CREATE TABLE face_search (
      "faceId"  uuid PRIMARY KEY REFERENCES asset_faces(id) ON DELETE CASCADE,
      embedding  vector(512) NOT NULL )`);

    await queryRunner.query(`ALTER TABLE face_search ALTER COLUMN embedding SET STORAGE EXTERNAL`);
    await queryRunner.query(`ALTER TABLE smart_search ALTER COLUMN embedding SET STORAGE EXTERNAL`);

    const hasFaceEmbeddings = await hasEmbeddings('asset_faces');
    if (hasFaceEmbeddings) {
      await queryRunner.query(`
        INSERT INTO face_search("faceId", embedding)
        SELECT id, embedding
        FROM asset_faces faces`);
    }

    await queryRunner.query(`ALTER TABLE asset_faces DROP COLUMN IF EXISTS embedding`);

    await queryRunner.query(`ALTER TABLE face_search ALTER COLUMN embedding SET DATA TYPE real[]`);
    await queryRunner.query(`ALTER TABLE face_search ALTER COLUMN embedding SET DATA TYPE vector(512)`);

    await queryRunner.query(vectorIndexQuery({ vectorExtension, table: 'smart_search', indexName: 'clip_index' }));

    await queryRunner.query(vectorIndexQuery({ vectorExtension, table: 'face_search', indexName: 'face_index' }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (vectorExtension === DatabaseExtension.VECTORS) {
      await queryRunner.query(`SET search_path TO "$user", public, vectors`);
    }

    await queryRunner.query(`ALTER TABLE asset_faces ADD COLUMN "embedding" vector(512)`);
    await queryRunner.query(`ALTER TABLE face_search ALTER COLUMN embedding SET STORAGE DEFAULT`);
    await queryRunner.query(`ALTER TABLE smart_search ALTER COLUMN embedding SET STORAGE DEFAULT`);
    await queryRunner.query(`
      UPDATE asset_faces
      SET embedding = fs.embedding
      FROM face_search fs
      WHERE id = fs."faceId"`);
    await queryRunner.query(`DROP TABLE face_search`);

    await queryRunner.query(vectorIndexQuery({ vectorExtension, table: 'asset_faces', indexName: 'face_index' }));
  }
}
