import { vectorExt } from 'src/database.config';
import { DatabaseExtension } from 'src/interfaces/database.interface';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeparateFaceSearchRelation1715217873291 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE face_search (
        "faceId"  uuid PRIMARY KEY REFERENCES asset_faces(id) ON DELETE CASCADE,
        embedding  vector(512) NOT NULL )`);

    await queryRunner.query(`
        INSERT INTO face_search("faceId", embedding)
        SELECT id, embedding
        FROM asset_faces faces`);

    if (vectorExt === DatabaseExtension.VECTORS) {
      await queryRunner.query(`SET vectors.pgvector_compatibility=on`);
    }
    await queryRunner.query(`SET search_path TO "$user", public, vectors`);

    await queryRunner.query(`ALTER TABLE asset_faces DROP COLUMN "embedding"`);

    await queryRunner.query(`
        CREATE INDEX face_index ON face_search
        USING hnsw (embedding vector_cosine_ops)
        WITH (ef_construction = 300, m = 16)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE asset_faces ADD COLUMN IF NOT EXISTS "embedding" TYPE vector(512)`);
    await queryRunner.query(`
        INSERT INTO asset_faces(id, embedding)
        SELECT fs."faceId", fs.embedding
        FROM face_search fs
        ON CONFLICT (fs."faceId") DO UPDATE SET embedding = fs.embedding`);
    await queryRunner.query(`DROP TABLE face_search`);
  }
}
