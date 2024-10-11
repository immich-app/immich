import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssetFileChecksum1728632095015 implements MigrationInterface {
  name = 'AssetFileChecksum1728632095015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_files" ADD "checksum" bytea`);
    await queryRunner.query(`CREATE INDEX "IDX_c946066edd16cfa5c25a26aa8e" ON "asset_files" ("checksum")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_c946066edd16cfa5c25a26aa8e"`);
    await queryRunner.query(`ALTER TABLE "asset_files" DROP COLUMN "checksum"`);
  }
}
