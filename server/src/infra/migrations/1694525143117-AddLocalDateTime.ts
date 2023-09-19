import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocalDateTime1694525143117 implements MigrationInterface {
  name = 'AddLocalDateTime1694525143117';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "localDateTime" TIMESTAMP`);
    await queryRunner.query(`
      update "assets"
        set "localDateTime" = "fileCreatedAt"`);

    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "localDateTime" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "localDateTime"`);
  }
}
