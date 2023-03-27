import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClipEmbeddingFloat81679901204458 implements MigrationInterface {
  name = 'ClipEmbeddingFloat81679901204458';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "smart_info" ALTER COLUMN "clipEmbedding" TYPE double precision array USING "clipEmbedding"::double precision array`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "smart_info" ALTER COLUMN "clipEmbedding" TYPE numeric(20,19) array USING "clipEmbedding"::numeric(20,19) array`,
    );
  }
}
