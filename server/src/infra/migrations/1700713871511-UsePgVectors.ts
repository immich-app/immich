import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsePgVectors1700713871511 implements MigrationInterface {
  name = 'UsePgVectors1700713871511';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const faceDimQuery = await queryRunner.query(`
        SELECT CARDINALITY(embedding::real[]) as dimsize
        FROM asset_faces
        LIMIT 1`);
    const clipDimQuery = await queryRunner.query(`
        SELECT CARDINALITY("clipEmbedding"::real[]) as dimsize
        FROM smart_info
        LIMIT 1`);

    const faceDimSize = faceDimQuery?.[0]?.['dimsize'] ?? 512;
    const clipDimSize = clipDimQuery?.[0]?.['dimsize'] ?? 512;

    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS vectors');

    await queryRunner.query(`
        ALTER TABLE asset_faces 
        ALTER COLUMN embedding SET NOT NULL,
        ALTER COLUMN embedding TYPE vector(${faceDimSize})`);

    await queryRunner.query(`
        CREATE TABLE smart_search (
        "assetId"  uuid PRIMARY KEY NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        embedding  vector(${clipDimSize}) NOT NULL )`);

    await queryRunner.query(`
        INSERT INTO smart_search("assetId", embedding)
        SELECT si."assetId", si."clipEmbedding"
        FROM smart_info si
        WHERE "clipEmbedding" IS NOT NULL`);

    await queryRunner.query(`ALTER TABLE smart_info DROP COLUMN IF EXISTS "clipEmbedding"`);
    }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE asset_faces ALTER COLUMN embedding TYPE real array`);
    await queryRunner.query(`ALTER TABLE smart_info ADD COLUMN IF NOT EXISTS "clipEmbedding" TYPE real array`);
    await queryRunner.query(`
        INSERT INTO smart_info
        ("assetId", "clipEmbedding")
        SELECT s."assetId", s.embedding
        FROM smart_search s
        ON CONFLICT (s."assetId") DO UPDATE SET "clipEmbedding" = s.embedding`);
    await queryRunner.query(`DROP TABLE IF EXISTS smart_search`);
  }
}
