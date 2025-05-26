import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeFileMetadataNonNullable1744662638410 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM assets WHERE "fileCreatedAt" IS NULL OR "fileModifiedAt" IS NULL OR "localDateTime" IS NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE assets
        ALTER COLUMN "fileCreatedAt" SET NOT NULL,
        ALTER COLUMN "fileModifiedAt" SET NOT NULL,
        ALTER COLUMN "localDateTime" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE assets
        ALTER COLUMN "fileCreatedAt" DROP NOT NULL,
        ALTER COLUMN "fileModifiedAt" DROP NOT NULL,
        ALTER COLUMN "localDateTime" DROP NOT NULL`);
  }
}
