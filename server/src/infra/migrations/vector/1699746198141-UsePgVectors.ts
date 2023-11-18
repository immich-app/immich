import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsePgVectors1699746198141 implements MigrationInterface {
  name = 'UsePgVectors1699746198141';

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

    await queryRunner.query('DROP EXTENSION IF EXISTS vectors');
    await queryRunner.query('CREATE EXTENSION vectors');

    await queryRunner.query(`
      BEGIN;

      ALTER TABLE asset_faces ALTER COLUMN embedding TYPE vector(${faceDimSize});

      CREATE TABLE smart_search (
        "assetId"  uuid PRIMARY KEY NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        embedding  vector(${clipDimSize}) NOT NULL );

      INSERT INTO smart_search("assetId", embedding)
        SELECT si."assetId", si."clipEmbedding"
        FROM smart_info si
        WHERE "clipEmbedding" IS NOT NULL;

      ALTER TABLE smart_info DROP COLUMN "clipEmbedding";

      COMMIT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      BEGIN;

      ALTER TABLE asset_faces ALTER COLUMN embedding TYPE real array;

      ALTER TABLE smart_info ADD COLUMN IF NOT EXISTS "clipEmbedding" TYPE real array;

      INSERT INTO smart_info
        ("assetId", "clipEmbedding")
        SELECT s."assetId", s.embedding
        FROM smart_search s
        ON CONFLICT (s."assetId") DO UPDATE SET "clipEmbedding" = s.embedding;
      
      DROP TABLE IF EXISTS smart_search;

      COMMIT;
    `);
  }
}
