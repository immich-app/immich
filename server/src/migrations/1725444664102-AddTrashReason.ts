import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrashReason1725444664102 implements MigrationInterface {
  name = 'AddTrashReason1725444664102';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."assets_trashreason_enum" AS ENUM('deleted', 'offline')`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "trashReason" "public"."assets_trashreason_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "trashReason"`);
    await queryRunner.query(`DROP TYPE "public"."assets_trashreason_enum"`);
  }
}
