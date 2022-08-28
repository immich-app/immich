import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetChecksum1661678114639 implements MigrationInterface {
  name = 'AddAssetChecksum1661678114639'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "checksum" bytea`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_64c507300988dd1764f9a6530c" ON "assets" ("checksum") WHERE 'checksum' IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_64c507300988dd1764f9a6530c"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "checksum"`);
  }

}
