import { getVectorExtension } from 'src/database.config';
import { DatabaseExtension } from 'src/interfaces/database.interface';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFaceSearchRelation1718486162779 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (getVectorExtension() === DatabaseExtension.VECTORS) {
      await queryRunner.query(`SET search_path TO "$user", public, vectors`);
      await queryRunner.query(`SET vectors.pgvector_compatibility=on`);
    }

    await queryRunner.query(`
            CREATE TABLE face_search (
            "faceId"  uuid PRIMARY KEY REFERENCES asset_faces(id) ON DELETE CASCADE,
            embedding  vector(512) NOT NULL )`);

    await queryRunner.query(`ALTER TABLE face_search ALTER COLUMN embedding SET STORAGE EXTERNAL`);
    await queryRunner.query(`ALTER TABLE smart_search ALTER COLUMN embedding SET STORAGE EXTERNAL`);

    await queryRunner.query(`
            INSERT INTO face_search("faceId", embedding)
            SELECT id, embedding
            FROM asset_faces faces`);

    await queryRunner.query(`ALTER TABLE asset_faces DROP COLUMN "embedding"`);

    await queryRunner.query(`
            CREATE INDEX face_index ON face_search
            USING hnsw (embedding vector_cosine_ops)
            WITH (ef_construction = 300, m = 16)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (getVectorExtension() === DatabaseExtension.VECTORS) {
      await queryRunner.query(`SET search_path TO "$user", public, vectors`);
      await queryRunner.query(`SET vectors.pgvector_compatibility=on`);
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

    await queryRunner.query(`
          CREATE INDEX face_index ON asset_faces
          USING hnsw (embedding vector_cosine_ops)
          WITH (ef_construction = 300, m = 16)`);
  }
}
