import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsePgVector1693228677355 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS vector');

    const faceDimQuery = await queryRunner.query(`
      SELECT CARDINALITY("embedding")
      FROM "asset_faces"
      LIMIT 1`);
    const clipDimQuery = await queryRunner.query(`
      SELECT CARDINALITY("clipEmbedding")
      FROM "smart_info"
      LIMIT 1`);

    const faceDimSize = faceDimQuery[0] ?? 512;
    const clipDimSize = clipDimQuery[0] ?? 512;

    await queryRunner.query(`
      ALTER TABLE "asset_faces"
      ALTER COLUMN "embedding" TYPE vector(${faceDimSize})`);
    await queryRunner.query(
      `ALTER TABLE "smart_info"
      ALTER COLUMN "clipEmbedding" TYPE vector(${clipDimSize})`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_faces" ALTER COLUMN "embedding" TYPE real array`);
    await queryRunner.query(`ALTER TABLE "smart_info" ALTER COLUMN "clipEmbedding" TYPE real array`);
  }
}
