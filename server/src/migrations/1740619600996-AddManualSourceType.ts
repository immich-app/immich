import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManualSourceType1740619600996 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE sourceType ADD VALUE 'manual'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Prior to this migration, manually tagged pictures had the 'machine-learning' type
    await queryRunner.query(
      `UPDATE "asset_faces" SET "sourceType" = 'machine-learning' WHERE "sourceType" = 'manual';`,
    );

    // Postgres doesn't allow removing values from enums, we have to recreate the type
    await queryRunner.query(`ALTER TYPE sourceType RENAME TO oldSourceType`);
    await queryRunner.query(`CREATE TYPE sourceType AS ENUM ('machine-learning', 'exif');`);

    await queryRunner.query(`ALTER TABLE "asset_faces" ALTER COLUMN "sourceType" DROP DEFAULT;`);
    await queryRunner.query(
      `ALTER TABLE "asset_faces" ALTER COLUMN "sourceType" TYPE sourceType USING "sourceType"::text::sourceType;`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_faces" ALTER COLUMN "sourceType" SET DEFAULT 'machine-learning'::sourceType;`,
    );
    await queryRunner.query(`DROP TYPE oldSourceType;`);
  }
}
